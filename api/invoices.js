import connectDB from '../lib/mongodb.js';
import Invoice from '../lib/models/Invoice.js';
import Customer from '../lib/models/Customer.js';
import Product from '../lib/models/Product.js';
import InventoryHistory from '../lib/models/InventoryHistory.js';
import { authenticate, tenantIsolation, checkSubscriptionLimit } from '../lib/middleware/tenant.js';
import { generateInvoicePDF } from '../lib/pdfGenerator.js';
import { numberToWords } from '../lib/numberToWords.js';
import { notifyInvoiceCreated, notifyPaymentReceived } from '../lib/services/notificationService.js';


async function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();
    await authenticate(req, res, async () => {
      await tenantIsolation(req, res, async () => {

    const { method, query } = req;
    const { id, action } = query;

    // Payment operations
    if (action === 'payment') {
      if (method === 'PUT' && id) return await updateInvoicePayment(req, res, id);
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // PDF generation
    if (action === 'pdf' && id) {
      if (method === 'GET') return await generatePDF(req, res, id);
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Single invoice operations
    if (id) {
      if (method === 'GET') return await getInvoice(req, res, id);
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // List/Create invoices
    if (method === 'GET') return await listInvoices(req, res, query);
    if (method === 'POST') {
      await checkSubscriptionLimit('invoices')(req, res, async () => {
        return await createInvoice(req, res);
      });
      return;
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
      });
    });
  } catch (error) {
    console.error('❌ Invoice API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// List invoices
async function listInvoices(req, res, query) {
  try {
    const { search, status, startDate, endDate, customer, limit = 50 } = query;
    const filter = { organizationId: req.organizationId };
    
    if (customer) filter.customer = customer;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    if (search) {
      const customers = await Customer.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customer: { $in: customers.map(c => c._id) } }
      ];
    }

    const invoices = await Invoice.find(filter)
      .populate('customer', 'name phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    return res.status(200).json({ success: true, invoices });
  } catch (error) {
    console.error('❌ List invoices error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Get single invoice
async function getInvoice(req, res, id) {
  try {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid invoice ID' });
    }

    const invoice = await Invoice.findById(id)
      .populate('customer', 'name phone address')
      .populate('items.product', 'name category hsnCode brand')
      .populate('createdBy', 'name')
      .lean();

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    return res.status(200).json({ success: true, invoice });
  } catch (error) {
    console.error('❌ Get invoice error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Generate PDF
async function generatePDF(req, res, id) {
  try {
    const invoice = await Invoice.findById(id)
      .populate('customer', 'name phone address')
      .populate('items.product', 'name category brand hsnCode')
      .populate('createdBy', 'name')
      .lean();

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Fetch business profile and settings
    const User = (await import('../lib/models/User.js')).default;
    const user = await User.findById(req.user._id).select('businessProfile settings').lean();
    const profile = user?.businessProfile || {};
    const settings = user?.settings || {};

    // Add company and bank details to invoice
    invoice.companyDetails = {
      name: profile.businessName || 'Anvi Tiles & Decorhub',
      address: profile.address || 'Gorakhpur, Uttar Pradesh',
      gstin: profile.gstin || '',
      state: profile.state || 'UTTAR PRADESH',
      stateCode: profile.stateCode || '09',
      mobile: profile.phone || '',
      email: profile.email || '',
      logo: profile.logo || ''
    };

    invoice.bankDetails = {
      bankName: profile.bankName || '',
      accountNo: profile.accountNumber || '',
      ifscCode: profile.ifscCode || '',
      branch: profile.branch || ''
    };

    const template = settings.template || 'compact';
    const pdfBuffer = await generateInvoicePDF(invoice, template);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Create invoice
async function createInvoice(req, res) {
  try {
    // Validate organizationId is present
    console.log('🔍 Debug - req.organizationId:', req.organizationId);
    console.log('🔍 Debug - req.userId:', req.userId);
    console.log('🔍 Debug - req.user:', req.user);
    
    if (!req.organizationId) {
      console.error('❌ Missing organizationId in request');
      return res.status(400).json({ success: false, message: 'Organization ID is required. Please ensure you are logged in properly.' });
    }

    const {
      customer, items, discount = 0, discountType = 'amount', applyGST = true,
      paymentMethod = 'cash', paymentStatus = 'unpaid', notes = '', dueDate, terms, buyerDetails,
      destination, deliveryNote, referenceNo, buyerOrderNo
    } = req.body;

    console.log('💰 Payment Status from frontend:', paymentStatus);
    console.log('💰 Full request body:', JSON.stringify(req.body, null, 2));

    if (!customer || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer and items required' });
    }

    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    let grossAmount = 0;
    let itemDiscountTotal = 0;
    const processedItems = [];

    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity <= 0 || !item.price || item.price < 0) {
        return res.status(400).json({ success: false, message: 'Invalid item data' });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      const qty = parseFloat(item.quantity);
      const price = parseFloat(item.price);
      const itemGross = qty * price;
      grossAmount += itemGross;

      const itemDiscount = parseFloat(item.discount) || 0;
      const itemDiscountType = item.discountType || 'amount';
      let discountAmount = 0;

      if (itemDiscountType === 'percentage') {
        discountAmount = (itemGross * itemDiscount) / 100;
      } else {
        discountAmount = itemDiscount;
      }

      itemDiscountTotal += discountAmount;
      const taxableValue = itemGross - discountAmount;

      const cgstAmount = applyGST ? (taxableValue * 9) / 100 : 0;
      const sgstAmount = applyGST ? (taxableValue * 9) / 100 : 0;
      const itemTotal = taxableValue + cgstAmount + sgstAmount;

      processedItems.push({
        product: product._id,
        productRef: product, // Store product reference for later stock update
        quantity: qty,
        price: price,
        discount: itemDiscount,
        discountType: itemDiscountType,
        taxableValue: parseFloat(taxableValue.toFixed(2)),
        cgstRate: 9,
        sgstRate: 9,
        cgstAmount: parseFloat(cgstAmount.toFixed(2)),
        sgstAmount: parseFloat(sgstAmount.toFixed(2)),
        total: parseFloat(itemTotal.toFixed(2))
      });
    }

    let additionalDiscount = parseFloat(discount) || 0;
    let amountAfterItemDiscount = grossAmount - itemDiscountTotal;

    if (discountType === 'percentage') {
      additionalDiscount = (amountAfterItemDiscount * additionalDiscount) / 100;
    }

    let taxableAmount = grossAmount - itemDiscountTotal - additionalDiscount;

    let totalCgst = 0;
    let totalSgst = 0;
    let totalGst = 0;

    if (applyGST) {
      totalCgst = (taxableAmount * 9) / 100;
      totalSgst = (taxableAmount * 9) / 100;
      totalGst = totalCgst + totalSgst;
    }

    let subtotal = applyGST ? (taxableAmount + totalGst) : taxableAmount;
    const roundOff = Math.round(subtotal) - subtotal;
    const grandTotal = Math.round(subtotal);
    const amountInWords = numberToWords(grandTotal);

    // Create invoice items without productRef
    const invoiceItems = processedItems.map(({ productRef, ...item }) => item);

    // Generate invoice number manually as fallback
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;
    
    const startOfMonth = new Date(year, date.getMonth(), 1);
    const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);
    
    const monthCount = await Invoice.countDocuments({
      organizationId: req.organizationId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const invoiceNumber = `${yearMonth}-${String(monthCount + 1).padStart(3, '0')}`;
    console.log('📝 Generated invoice number:', invoiceNumber);

    const invoiceData = {
      invoiceNumber,
      organizationId: req.organizationId,
      customer,
      buyerDetails: {
        name: customerExists.name,
        address: buyerDetails?.street ?
          `${buyerDetails.street}, ${buyerDetails.city || ''}, ${buyerDetails.state || 'UTTAR PRADESH'} ${buyerDetails.pincode || ''}` :
          customerExists.address?.street || 'Address not provided',
        mobile: customerExists.phone,
        gstin: buyerDetails?.gstin || 'N/A',
        state: buyerDetails?.state || customerExists.address?.state || 'UTTAR PRADESH',
        stateCode: '09'
      },
      consigneeDetails: {
        name: customerExists.name,
        address: buyerDetails?.street ?
          `${buyerDetails.street}, ${buyerDetails.city || ''}, ${buyerDetails.state || 'UTTAR PRADESH'} ${buyerDetails.pincode || ''}` :
          customerExists.address?.street || 'Address not provided',
        mobile: customerExists.phone,
        gstin: buyerDetails?.gstin || 'N/A',
        state: buyerDetails?.state || customerExists.address?.state || 'UTTAR PRADESH',
        stateCode: '09'
      },
      modeOfPayment: paymentMethod,
      destination: destination || '',
      deliveryNote: deliveryNote || '',
      referenceNo: referenceNo || '',
      buyerOrderNo: buyerOrderNo || '',
      items: invoiceItems,
      subtotal: parseFloat(grossAmount.toFixed(2)),
      totalTaxableAmount: parseFloat(taxableAmount.toFixed(2)),
      totalCgst: parseFloat(totalCgst.toFixed(2)),
      totalSgst: parseFloat(totalSgst.toFixed(2)),
      tax: parseFloat(totalGst.toFixed(2)),
      discount: parseFloat(additionalDiscount.toFixed(2)),
      discountType: discountType,
      applyGST: applyGST,
      roundOff: parseFloat(roundOff.toFixed(2)),
      grandTotal: grandTotal,
      total: grandTotal,
      amountInWords: amountInWords,
      paymentMethod: paymentMethod,
      notes: notes || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      terms: terms || 'Payment due within 30 days',
      createdBy: req.userId || null
    };

    // Set payment status based on selection - FIXED
    if (paymentStatus === 'paid') {
      invoiceData.paymentStatus = 'paid';
      invoiceData.status = 'paid';
      invoiceData.paidAmount = grandTotal;
      invoiceData.pendingAmount = 0;
      invoiceData.paymentDate = new Date();
      invoiceData.payments = [{
        amount: grandTotal,
        date: new Date(),
        method: paymentMethod,
        reference: 'Initial payment',
        notes: 'Paid during invoice creation',
        collectedBy: req.userId
      }];
    } else {
      // paymentStatus is 'unpaid' or any other value
      invoiceData.paymentStatus = 'unpaid';
      invoiceData.status = 'pending';
      invoiceData.paidAmount = 0;
      invoiceData.pendingAmount = grandTotal;
      invoiceData.payments = [];
    }

    console.log('💰 Final invoice payment status before save:', invoiceData.paymentStatus);
    console.log('💰 Final invoice status before save:', invoiceData.status);
    console.log('💰 Final invoice paidAmount before save:', invoiceData.paidAmount);

    const invoice = await Invoice.create(invoiceData);
    
    console.log('💰 Saved invoice payment status:', invoice.paymentStatus);
    console.log('💰 Saved invoice status:', invoice.status);
    console.log('💰 Saved invoice paidAmount:', invoice.paidAmount);
    
    // FORCE UPDATE if payment status is wrong
    if (paymentStatus === 'paid' && invoice.paymentStatus !== 'paid') {
      console.log('🔧 FORCE UPDATING payment status to paid');
      await Invoice.updateOne(
        { _id: invoice._id },
        {
          $set: {
            paymentStatus: 'paid',
            status: 'paid',
            paidAmount: grandTotal,
            pendingAmount: 0,
            paymentDate: new Date()
          }
        }
      );
      console.log('🔧 FORCE UPDATE completed');
    }

    try {
      await Customer.findByIdAndUpdate(customer, {
        $inc: { totalPurchases: grandTotal },
        lastPurchaseDate: new Date()
      });
    } catch (custErr) {
      console.warn('⚠️ Failed to update customer:', custErr.message);
    }

    // Invoice created successfully - now update stock and log history
    console.log('📦 Updating stock for', processedItems.length, 'items');
    
    for (const item of processedItems) {
      if (item.productRef) {
        const previousStock = item.productRef.stock;
        item.productRef.stock -= item.quantity;
        await item.productRef.save();
        
        console.log(`✅ Stock updated for ${item.productRef.name}: ${previousStock} → ${item.productRef.stock}`);

        // Log inventory history
        const historyData = {
          organizationId: req.organizationId,
          product: item.product,
          type: 'sale',
          quantity: -item.quantity,
          previousStock: previousStock,
          newStock: item.productRef.stock,
          reason: `Sale via invoice ${invoiceNumber}`,
          updatedBy: req.userId || null
        };
        
        console.log('📝 Creating inventory history:', historyData);
        
        const history = await InventoryHistory.create(historyData);
        console.log('✅ Inventory history created:', history._id);
      }
    }

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer', 'name phone address')
      .populate('items.product', 'name category')
      .populate('createdBy', 'name');

    console.log('💰 Final populated invoice payment status:', populatedInvoice.paymentStatus);
    console.log('💰 Final populated invoice status:', populatedInvoice.status);

    // Create notification
    try {
      await notifyInvoiceCreated(req.organizationId, populatedInvoice, customerExists);
    } catch (notifErr) {
      console.warn('⚠️ Failed to create notification:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice: populatedInvoice
    });
  } catch (error) {
    console.error('❌ Create invoice error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Update invoice payment - FIXED for partial payments
async function updateInvoicePayment(req, res, id) {
  try {
    const { amount, method = 'cash', reference, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount required' });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const totalAmount = invoice.grandTotal || invoice.total;
    const currentPending = invoice.pendingAmount || totalAmount;

    // Prevent overpayment
    if (amount > currentPending) {
      return res.status(400).json({ 
        success: false, 
        message: `Payment amount (₹${amount}) exceeds pending amount (₹${currentPending})` 
      });
    }

    // Add new payment entry
    invoice.payments.push({
      amount: parseFloat(amount),
      date: new Date(),
      method,
      reference: reference || '',
      notes: notes || '',
      collectedBy: req.userId
    });

    // Recalculate payment status manually
    invoice.recalculatePaymentStatus();
    
    // Save without triggering pre-save hook payment calculations
    await invoice.save();

    const updatedInvoice = await Invoice.findById(id)
      .populate('customer', 'name phone')
      .populate('createdBy', 'name');

    // Create payment notification
    try {
      const isPartial = updatedInvoice.paymentStatus === 'partial';
      await notifyPaymentReceived(req.organizationId, updatedInvoice, amount, isPartial);
    } catch (notifErr) {
      console.warn('⚠️ Failed to create notification:', notifErr.message);
    }

    return res.json({ 
      success: true, 
      message: 'Payment recorded successfully',
      invoice: updatedInvoice 
    });
  } catch (error) {
    console.error('❌ Payment update error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

