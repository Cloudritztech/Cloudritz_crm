import connectDB from '../lib/mongodb.js';
import Invoice from '../lib/models/Invoice.js';
import Product from '../lib/models/Product.js';
import Organization from '../lib/models/Organization.js';
import { notifyPendingPayments, notifyOverdueInvoices, notifyLowStock } from '../lib/services/notificationService.js';

export default async function handler(req, res) {
  // Security: Only allow POST with secret key
  const { authorization } = req.headers;
  const SECRET_KEY = process.env.CRON_SECRET || 'your-secret-key-here';
  
  if (req.method !== 'POST' || authorization !== `Bearer ${SECRET_KEY}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    await connectDB();
    console.log('🕐 Running daily notification scheduler...');

    const organizations = await Organization.find({ isActive: true }).select('_id');
    let totalNotifications = 0;

    for (const org of organizations) {
      try {
        // 1. Pending Payments Reminder
        const pendingInvoices = await Invoice.find({
          organizationId: org._id,
          paymentStatus: { $in: ['unpaid', 'partial'] }
        }).select('invoiceNumber pendingAmount').lean();

        if (pendingInvoices.length > 0) {
          await notifyPendingPayments(org._id, pendingInvoices);
          totalNotifications++;
        }

        // 2. Overdue Invoices
        const today = new Date();
        const overdueInvoices = await Invoice.find({
          organizationId: org._id,
          dueDate: { $lt: today },
          paymentStatus: { $in: ['unpaid', 'partial'] }
        }).select('invoiceNumber dueDate').lean();

        if (overdueInvoices.length > 0) {
          await notifyOverdueInvoices(org._id, overdueInvoices);
          totalNotifications++;
        }

        // 3. Low Stock Alert
        const lowStockProducts = await Product.find({
          organizationId: org._id,
          $expr: { $lte: ['$stock', '$lowStockLimit'] }
        }).select('name stock lowStockLimit').lean();

        if (lowStockProducts.length > 0) {
          await notifyLowStock(org._id, lowStockProducts);
          totalNotifications++;
        }

      } catch (orgError) {
        console.error(`❌ Error processing org ${org._id}:`, orgError);
      }
    }

    console.log(`✅ Daily scheduler completed. Created ${totalNotifications} notifications for ${organizations.length} organizations.`);

    return res.status(200).json({
      success: true,
      message: 'Daily notifications sent',
      stats: {
        organizations: organizations.length,
        notifications: totalNotifications
      }
    });

  } catch (error) {
    console.error('❌ Daily scheduler error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
