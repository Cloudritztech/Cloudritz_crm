const connectDB = require('../lib/mongodb');
const Organization = require('../lib/models/Organization');
const Product = require('../lib/models/Product');
const Customer = require('../lib/models/Customer');
const Invoice = require('../lib/models/Invoice');
const Employee = require('../lib/models/Employee');
const Expense = require('../lib/models/Expense');
const { authenticate } = require('../lib/middleware/tenant');

module.exports = async (req, res) => {
  await connectDB();

  const { method } = req;
  const { action } = req.query;

  try {
    const authResult = await authenticate(req);
    if (!authResult.success) {
      return res.status(401).json({ success: false, message: authResult.message });
    }

    const { organizationId, role } = authResult;

    if (role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Super admin cannot access backup' });
    }

    // EXPORT - Create full backup
    if (method === 'GET' && action === 'export') {
      const [products, customers, invoices, employees, expenses, organization] = await Promise.all([
        Product.find({ organizationId }).lean(),
        Customer.find({ organizationId }).lean(),
        Invoice.find({ organizationId }).populate('customer', 'name phone').lean(),
        Employee.find({ organizationId }).lean(),
        Expense.find({ organizationId }).lean(),
        Organization.findById(organizationId).select('-__v').lean()
      ]);

      const backup = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        organizationId,
        organizationName: organization.name,
        data: {
          products: products.map(p => ({ ...p, _id: p._id.toString() })),
          customers: customers.map(c => ({ ...c, _id: c._id.toString() })),
          invoices: invoices.map(i => ({ ...i, _id: i._id.toString() })),
          employees: employees.map(e => ({ ...e, _id: e._id.toString() })),
          expenses: expenses.map(e => ({ ...e, _id: e._id.toString() })),
          organization: { ...organization, _id: organization._id.toString() }
        },
        counts: {
          products: products.length,
          customers: customers.length,
          invoices: invoices.length,
          employees: employees.length,
          expenses: expenses.length
        }
      };

      // Update last backup time
      await Organization.findByIdAndUpdate(organizationId, {
        'settings.lastBackup': new Date()
      });

      return res.json({ success: true, backup });
    }

    // IMPORT - Restore from backup
    if (method === 'POST' && action === 'import') {
      const { backup, mode } = req.body; // mode: 'merge' or 'replace'

      if (!backup || !backup.data) {
        return res.status(400).json({ success: false, message: 'Invalid backup data' });
      }

      const results = {
        products: { added: 0, updated: 0, skipped: 0 },
        customers: { added: 0, updated: 0, skipped: 0 },
        invoices: { added: 0, updated: 0, skipped: 0 },
        employees: { added: 0, updated: 0, skipped: 0 },
        expenses: { added: 0, updated: 0, skipped: 0 }
      };

      // Replace mode - delete existing data
      if (mode === 'replace') {
        await Promise.all([
          Product.deleteMany({ organizationId }),
          Customer.deleteMany({ organizationId }),
          Invoice.deleteMany({ organizationId }),
          Employee.deleteMany({ organizationId }),
          Expense.deleteMany({ organizationId })
        ]);
      }

      // Import Products
      if (backup.data.products) {
        for (const product of backup.data.products) {
          const { _id, ...productData } = product;
          productData.organizationId = organizationId;
          
          if (mode === 'merge') {
            const existing = await Product.findOne({ 
              organizationId, 
              name: productData.name 
            });
            
            if (existing) {
              await Product.findByIdAndUpdate(existing._id, productData);
              results.products.updated++;
            } else {
              await Product.create(productData);
              results.products.added++;
            }
          } else {
            await Product.create(productData);
            results.products.added++;
          }
        }
      }

      // Import Customers
      if (backup.data.customers) {
        for (const customer of backup.data.customers) {
          const { _id, ...customerData } = customer;
          customerData.organizationId = organizationId;
          
          if (mode === 'merge') {
            const existing = await Customer.findOne({ 
              organizationId, 
              phone: customerData.phone 
            });
            
            if (existing) {
              await Customer.findByIdAndUpdate(existing._id, customerData);
              results.customers.updated++;
            } else {
              await Customer.create(customerData);
              results.customers.added++;
            }
          } else {
            await Customer.create(customerData);
            results.customers.added++;
          }
        }
      }

      // Import Employees
      if (backup.data.employees) {
        for (const employee of backup.data.employees) {
          const { _id, ...employeeData } = employee;
          employeeData.organizationId = organizationId;
          
          if (mode === 'merge') {
            const existing = await Employee.findOne({ 
              organizationId, 
              phone: employeeData.phone 
            });
            
            if (existing) {
              await Employee.findByIdAndUpdate(existing._id, employeeData);
              results.employees.updated++;
            } else {
              await Employee.create(employeeData);
              results.employees.added++;
            }
          } else {
            await Employee.create(employeeData);
            results.employees.added++;
          }
        }
      }

      // Import Expenses
      if (backup.data.expenses) {
        for (const expense of backup.data.expenses) {
          const { _id, ...expenseData } = expense;
          expenseData.organizationId = organizationId;
          await Expense.create(expenseData);
          results.expenses.added++;
        }
      }

      // Import Invoices (last, as they reference customers)
      if (backup.data.invoices) {
        for (const invoice of backup.data.invoices) {
          const { _id, ...invoiceData } = invoice;
          invoiceData.organizationId = organizationId;
          
          // Try to match customer by phone
          if (invoiceData.customer && typeof invoiceData.customer === 'object') {
            const customerPhone = invoiceData.customer.phone;
            const matchedCustomer = await Customer.findOne({ organizationId, phone: customerPhone });
            if (matchedCustomer) {
              invoiceData.customer = matchedCustomer._id;
            } else {
              delete invoiceData.customer;
            }
          }
          
          await Invoice.create(invoiceData);
          results.invoices.added++;
        }
      }

      return res.json({ 
        success: true, 
        message: 'Backup restored successfully',
        results 
      });
    }

    // GET Backup History
    if (method === 'GET' && action === 'history') {
      // For now, return last backup info from organization settings
      const org = await Organization.findById(organizationId).select('settings.lastBackup');
      
      const history = [];
      if (org.settings?.lastBackup) {
        history.push({
          date: org.settings.lastBackup,
          type: 'Manual',
          size: 'N/A'
        });
      }

      return res.json({ success: true, history });
    }

    return res.status(400).json({ success: false, message: 'Invalid action' });

  } catch (error) {
    console.error('Backup API Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
