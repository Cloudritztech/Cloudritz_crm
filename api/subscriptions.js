import connectDB from '../lib/mongodb.js';
import SubscriptionPlan from '../lib/models/SubscriptionPlan.js';
import Organization from '../lib/models/Organization.js';
import Payment from '../lib/models/Payment.js';
import SubscriptionInvoice from '../lib/models/SubscriptionInvoice.js';
import { authenticate } from '../lib/middleware/tenant.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  const { method } = req;
  const { action, id } = req.query;

  try {
    await authenticate(req, res, async () => {
      const { userId, organizationId, role } = req.user;

    if (method === 'GET') {
      if (action === 'plans') {
        const plans = await SubscriptionPlan.find({ isActive: true }).sort({ sortOrder: 1 });
        return res.status(200).json({ success: true, plans });
      }

      if (action === 'current') {
        const org = await Organization.findById(organizationId);
        if (!org) {
          return res.status(404).json({ success: false, message: 'Organization not found' });
        }
        return res.status(200).json({ success: true, subscription: org.subscription });
      }

      if (action === 'invoices') {
        const invoices = await SubscriptionInvoice.find({ organizationId })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        return res.status(200).json({ success: true, invoices });
      }

      if (action === 'download-invoice' && id) {
        const invoice = await SubscriptionInvoice.findById(id);
        if (!invoice || invoice.organizationId.toString() !== organizationId.toString()) {
          return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        const org = await Organization.findById(organizationId);
        
        // Generate simple invoice HTML
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Subscription Invoice - ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .invoice-details { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; }
    .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Cloudritz CRM</h1>
    <h2>Subscription Invoice</h2>
  </div>
  
  <div class="invoice-details">
    <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
    <p><strong>Organization:</strong> ${org.name}</p>
    <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
    <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Period</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${invoice.plan}</td>
        <td>${new Date(invoice.billingPeriod.startDate).toLocaleDateString()} - ${new Date(invoice.billingPeriod.endDate).toLocaleDateString()}</td>
        <td>₹${invoice.amount.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="total">
    Total Amount: ₹${invoice.amount.toLocaleString()}
  </div>
  
  ${invoice.paidAt ? `<p style="margin-top: 20px;"><strong>Paid on:</strong> ${new Date(invoice.paidAt).toLocaleString()}</p>` : ''}
  
  <div style="margin-top: 40px; text-align: center; color: #666;">
    <p>Thank you for your business!</p>
    <p>Cloudritz CRM - Professional Business Management</p>
  </div>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename=invoice-${invoice.invoiceNumber}.html`);
        return res.send(html);
      }

      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    if (method === 'POST') {
      if (action === 'create-order') {
        const { planId } = req.body;

        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) {
          return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        // Free plans can be activated directly
        if (plan.price === 0) {
          return res.status(200).json({
            success: true,
            testMode: true,
            freePlan: true,
            order: {
              id: 'free_order_' + Date.now(),
              amount: 0,
              currency: 'INR'
            }
          });
        }

        const amount = plan.price * 100;
        const isTestMode = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'test_key' || process.env.RAZORPAY_KEY_ID.includes('xxx');

        if (isTestMode) {
          return res.status(200).json({
            success: true,
            testMode: true,
            order: {
              id: 'test_order_' + Date.now(),
              amount: amount,
              currency: 'INR'
            }
          });
        }

        // Real Razorpay integration would go here
        return res.status(400).json({
          success: false,
          message: 'Payment gateway not configured. Please contact administrator.'
        });
      }

      if (action === 'verify-payment') {
        const { orderId, paymentId, planId } = req.body;

        if (!orderId || !planId) {
          return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) {
          return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        const org = await Organization.findById(organizationId);
        if (!org) {
          return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        const startDate = new Date();
        const endDate = new Date();
        if (plan.billingCycle === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // Update organization subscription
        org.subscription = {
          plan: plan.name,
          status: 'active',
          startDate,
          endDate,
          maxUsers: plan.limits.maxUsers,
          maxProducts: plan.limits.maxProducts,
          maxInvoices: plan.limits.maxInvoices
        };

        org.features = plan.features;
        await org.save();

        // Create subscription invoice
        const invoiceNumber = `SUB-${Date.now()}`;
        await SubscriptionInvoice.create({
          organizationId,
          invoiceNumber,
          plan: plan.displayName,
          amount: plan.price,
          billingPeriod: { startDate, endDate },
          status: 'paid',
          paidAt: new Date()
        });

        // Record payment
        await Payment.create({
          organizationId,
          amount: plan.price,
          paymentMethod: 'razorpay',
          transactionId: paymentId || orderId,
          status: 'success',
          description: `Subscription: ${plan.displayName}`,
          metadata: { orderId, paymentId, planId }
        });

        return res.status(200).json({ success: true, message: 'Subscription activated successfully' });
      }

      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

      return res.status(405).json({ success: false, message: 'Method not allowed' });
    });
  } catch (error) {
    console.error('Subscriptions API Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
