import connectDB from '../lib/mongodb.js';
import Organization from '../lib/models/Organization.js';
import SubscriptionPlan from '../lib/models/SubscriptionPlan.js';
import SubscriptionInvoice from '../lib/models/SubscriptionInvoice.js';
import { authenticate, tenantIsolation, requireRole } from '../lib/middleware/tenant.js';
import { sendEmail, getPaymentSuccessEmail, getPaymentFailedEmail } from '../lib/emailService.js';
import { generateMonthlyInvoices, sendTrialReminders, expireOverdueSubscriptions } from '../lib/billingService.js';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    const { action, type } = req.query;

    // Public webhook endpoint
    if (action === 'webhook') {
      return await handleWebhook(req, res);
    }

    // Cron job endpoint (protected by secret) - runs all billing tasks
    if (action === 'cron') {
      const secret = req.headers['x-cron-secret'];
      if (secret !== process.env.CRON_SECRET) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      return await handleCronAll(req, res);
    }

    // Protected endpoints
    await authenticate(req, res, async () => {
      await tenantIsolation(req, res, async () => {
        if (action === 'plans' && req.method === 'GET') return await getPlans(req, res);
        if (action === 'current' && req.method === 'GET') return await getCurrentSubscription(req, res);
        if (action === 'invoices' && req.method === 'GET') return await getInvoices(req, res);
        if (action === 'create-order' && req.method === 'POST') return await createOrder(req, res);
        if (action === 'verify-payment' && req.method === 'POST') return await verifyPayment(req, res);
        if (action === 'upgrade' && req.method === 'POST') return await upgradePlan(req, res);

        return res.status(400).json({ success: false, message: 'Invalid action' });
      });
    });
  } catch (error) {
    console.error('❌ Billing API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Get all subscription plans
async function getPlans(req, res) {
  const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
  return res.json({ success: true, plans });
}

// Get current subscription
async function getCurrentSubscription(req, res) {
  const org = await Organization.findById(req.organizationId);
  if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

  const plan = await SubscriptionPlan.findOne({ name: org.subscription.plan });
  return res.json({ success: true, subscription: org.subscription, plan });
}

// Get subscription invoices
async function getInvoices(req, res) {
  const invoices = await SubscriptionInvoice.find({ organization: req.organizationId })
    .sort({ createdAt: -1 })
    .limit(50);
  return res.json({ success: true, invoices });
}

// Create Razorpay order
async function createOrder(req, res) {
  const { planId, invoiceId } = req.body;

  let amount, currency = 'INR', receipt;

  if (invoiceId) {
    const invoice = await SubscriptionInvoice.findById(invoiceId);
    if (!invoice || invoice.organization.toString() !== req.organizationId) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    amount = invoice.amount * 100; // Convert to paise
    receipt = invoice.invoiceNumber;
  } else if (planId) {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    amount = plan.price * 100;
    receipt = `PLAN-${Date.now()}`;
  } else {
    return res.status(400).json({ success: false, message: 'planId or invoiceId required' });
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return res.json({ success: true, order: { id: 'test_order_' + Date.now(), amount, currency, receipt }, testMode: true });
  }

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, currency, receipt })
    });

    const order = await response.json();
    if (!response.ok) throw new Error(order.error?.description || 'Order creation failed');

    return res.json({ success: true, order, keyId: RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('❌ Razorpay order error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Verify payment and update subscription
async function verifyPayment(req, res) {
  const { orderId, paymentId, signature, planId, invoiceId } = req.body;

  // Test mode - skip verification
  if (orderId?.startsWith('test_order_')) {
    return await processPayment(req, res, { orderId, paymentId: 'test_payment_' + Date.now(), planId, invoiceId });
  }

  // Verify Razorpay signature
  const crypto = await import('crypto');
  const expectedSignature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ success: false, message: 'Invalid payment signature' });
  }

  return await processPayment(req, res, { orderId, paymentId, planId, invoiceId });
}

// Process successful payment
async function processPayment(req, res, { orderId, paymentId, planId, invoiceId }) {
  const org = await Organization.findById(req.organizationId);
  if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

  let invoice;

  if (invoiceId) {
    invoice = await SubscriptionInvoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    invoice.status = 'paid';
    invoice.paymentId = paymentId;
    invoice.paymentMethod = 'razorpay';
    invoice.paidAt = new Date();
    await invoice.save();

    // Extend subscription
    const plan = await SubscriptionPlan.findOne({ name: org.subscription.plan });
    const daysToAdd = plan.billingCycle === 'yearly' ? 365 : 30;
    org.subscription.endDate = new Date(org.subscription.endDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    org.subscription.status = 'active';
    org.isActive = true;
    await org.save();

  } else if (planId) {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    // Create invoice
    const invoiceNumber = `SUB-${Date.now()}-${org._id.toString().slice(-6)}`;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (plan.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);

    invoice = await SubscriptionInvoice.create({
      organization: org._id,
      invoiceNumber,
      plan: plan.displayName,
      amount: plan.price,
      currency: plan.currency,
      billingPeriod: { start: startDate, end: endDate },
      dueDate: endDate,
      status: 'paid',
      paymentId,
      paymentMethod: 'razorpay',
      paidAt: new Date()
    });

    // Update subscription
    org.subscription.plan = plan.name;
    org.subscription.status = 'active';
    org.subscription.startDate = startDate;
    org.subscription.endDate = endDate;
    org.subscription.maxUsers = plan.limits.maxUsers;
    org.subscription.maxProducts = plan.limits.maxProducts;
    org.subscription.maxInvoices = plan.limits.maxInvoices;
    org.features = plan.features;
    org.isActive = true;
    await org.save();
  }

  // Send success email
  await sendEmail({
    to: org.email,
    subject: 'Payment Successful',
    html: getPaymentSuccessEmail(org.name, invoice),
    type: 'payment_success',
    organizationId: org._id
  });

  return res.json({ success: true, message: 'Payment successful', subscription: org.subscription });
}

// Upgrade plan (admin only)
async function upgradePlan(req, res) {
  await requireRole(['admin'])(req, res, async () => {
    const { planId } = req.body;
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const org = await Organization.findById(req.organizationId);
    org.subscription.plan = plan.name;
    org.subscription.maxUsers = plan.limits.maxUsers;
    org.subscription.maxProducts = plan.limits.maxProducts;
    org.subscription.maxInvoices = plan.limits.maxInvoices;
    org.features = plan.features;
    await org.save();

    return res.json({ success: true, message: 'Plan upgraded', subscription: org.subscription });
  });
}

// Razorpay webhook handler
async function handleWebhook(req, res) {
  const { event, payload } = req.body;

  if (event === 'payment.failed') {
    const orderId = payload.payment.entity.order_id;
    const invoice = await SubscriptionInvoice.findOne({ invoiceNumber: orderId });
    
    if (invoice) {
      invoice.status = 'failed';
      await invoice.save();

      const org = await Organization.findById(invoice.organization);
      await sendEmail({
        to: org.email,
        subject: 'Payment Failed',
        html: getPaymentFailedEmail(org.name, invoice),
        type: 'payment_failed',
        organizationId: org._id
      });
    }
  }

  return res.json({ success: true });
}

// Consolidated cron handler - runs all billing tasks
async function handleCronAll(req, res) {
  const results = {
    invoices: await generateMonthlyInvoices(),
    reminders: await sendTrialReminders(),
    expire: await expireOverdueSubscriptions()
  };
  return res.json({ success: true, results });
}
