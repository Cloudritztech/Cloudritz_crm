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
          .limit(50);
        return res.status(200).json({ success: true, invoices });
      }

      if (action === 'payments') {
        const payments = await Payment.find({ organizationId })
          .sort({ createdAt: -1 })
          .limit(50);
        return res.status(200).json({ success: true, payments });
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

      if (action === 'verify-payment') {
        const { orderId, paymentId, planId } = req.body;

        const plan = await SubscriptionPlan.findById(planId);
        const org = await Organization.findById(organizationId);

        const startDate = new Date();
        const endDate = new Date();
        if (plan.billingCycle === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

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

        return res.status(200).json({ success: true, message: 'Subscription activated' });
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
