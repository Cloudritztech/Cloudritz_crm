const connectDB = require('../lib/mongodb');
const SubscriptionPlan = require('../lib/models/SubscriptionPlan');
const Organization = require('../lib/models/Organization');
const Payment = require('../lib/models/Payment');
const SubscriptionInvoice = require('../lib/models/SubscriptionInvoice');
const { authenticate, requireRole } = require('../lib/middleware/tenant');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'test_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret'
});

module.exports = async (req, res) => {
  await connectDB();

  const { method } = req;
  const { action, id } = req.query;

  try {
    const authResult = await authenticate(req);
    if (!authResult.success) {
      return res.status(401).json({ success: false, message: authResult.message });
    }

    const { userId, organizationId, role, email } = authResult;

    // GET - List plans or get current subscription
    if (method === 'GET') {
      if (action === 'plans') {
        // Get all active plans
        const plans = await SubscriptionPlan.find({ isActive: true }).sort({ sortOrder: 1 });
        return res.status(200).json({ success: true, plans });
      }

      if (action === 'current') {
        // Get current subscription
        const org = await Organization.findById(organizationId);
        if (!org) {
          return res.status(404).json({ success: false, message: 'Organization not found' });
        }
        return res.status(200).json({ success: true, subscription: org.subscription });
      }

      if (action === 'invoices') {
        // Get subscription invoices
        const invoices = await SubscriptionInvoice.find({ organizationId })
          .sort({ createdAt: -1 })
          .limit(50);
        return res.status(200).json({ success: true, invoices });
      }

      if (action === 'payments') {
        // Get payment history
        const payments = await Payment.find({ organizationId })
          .sort({ createdAt: -1 })
          .limit(50);
        return res.status(200).json({ success: true, payments });
      }

      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    // POST - Create order or verify payment
    if (method === 'POST') {
      if (action === 'create-order') {
        const { planId, invoiceId } = req.body;

        let amount, plan, invoice;

        if (planId) {
          plan = await SubscriptionPlan.findById(planId);
          if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
          }
          amount = plan.price * 100; // Convert to paise
        } else if (invoiceId) {
          invoice = await SubscriptionInvoice.findById(invoiceId);
          if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
          }
          amount = invoice.amount * 100;
        } else {
          return res.status(400).json({ success: false, message: 'Plan ID or Invoice ID required' });
        }

        // Check if Razorpay is configured
        const isTestMode = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'test_key';

        if (isTestMode) {
          // Test mode - return mock order
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

        // Create Razorpay order
        const order = await razorpay.orders.create({
          amount: amount,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            organizationId: organizationId,
            planId: planId || '',
            invoiceId: invoiceId || ''
          }
        });

        // Create payment record
        await Payment.create({
          organizationId,
          planId: planId || null,
          planName: plan?.displayName || invoice?.plan,
          amount: amount / 100,
          currency: 'INR',
          paymentMethod: 'razorpay',
          paymentGateway: {
            orderId: order.id
          },
          status: 'pending',
          type: planId ? 'subscription' : 'renewal',
          invoiceId: invoiceId || null
        });

        return res.status(200).json({
          success: true,
          order,
          keyId: process.env.RAZORPAY_KEY_ID
        });
      }

      if (action === 'verify-payment') {
        const { orderId, paymentId, signature, planId, invoiceId } = req.body;

        // Find payment record
        const payment = await Payment.findOne({ 'paymentGateway.orderId': orderId });
        if (!payment) {
          return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Verify signature (skip in test mode)
        const isTestMode = orderId.startsWith('test_order_');
        if (!isTestMode) {
          const crypto = require('crypto');
          const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(orderId + '|' + paymentId)
            .digest('hex');

          if (generatedSignature !== signature) {
            payment.status = 'failed';
            payment.failureReason = 'Invalid signature';
            await payment.save();
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
          }
        }

        // Update payment
        payment.paymentGateway.paymentId = paymentId;
        payment.paymentGateway.signature = signature;
        payment.status = 'completed';
        payment.processedAt = new Date();
        await payment.save();

        // Update organization subscription
        if (planId) {
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

          // Create invoice
          const invoiceNumber = `SUB-${Date.now()}`;
          await SubscriptionInvoice.create({
            organizationId,
            invoiceNumber,
            plan: plan.displayName,
            amount: plan.price,
            billingPeriod: {
              startDate,
              endDate
            },
            status: 'paid',
            paymentId: payment._id,
            paidAt: new Date()
          });
        } else if (invoiceId) {
          // Mark invoice as paid
          const invoice = await SubscriptionInvoice.findById(invoiceId);
          invoice.status = 'paid';
          invoice.paymentId = payment._id;
          invoice.paidAt = new Date();
          await invoice.save();

          // Extend subscription
          const org = await Organization.findById(organizationId);
          const currentEnd = new Date(org.subscription.endDate);
          const newEnd = new Date(currentEnd);
          newEnd.setMonth(newEnd.getMonth() + 1);
          org.subscription.endDate = newEnd;
          org.subscription.status = 'active';
          await org.save();
        }

        return res.status(200).json({ success: true, payment });
      }

      if (action === 'manual-payment') {
        // Super admin only - manual payment recording
        if (role !== 'superadmin') {
          return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const { organizationId: targetOrgId, planId, amount, notes, paymentMethod } = req.body;

        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) {
          return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        const org = await Organization.findById(targetOrgId);
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

        // Create payment record
        const payment = await Payment.create({
          organizationId: targetOrgId,
          organizationName: org.name,
          planId,
          planName: plan.displayName,
          amount: amount || plan.price,
          currency: 'INR',
          paymentMethod: paymentMethod || 'manual',
          status: 'completed',
          type: 'subscription',
          billingPeriod: { startDate, endDate },
          metadata: { notes },
          processedBy: userId,
          processedAt: new Date()
        });

        // Update subscription
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

        // Create invoice
        const invoiceNumber = `SUB-${Date.now()}`;
        await SubscriptionInvoice.create({
          organizationId: targetOrgId,
          invoiceNumber,
          plan: plan.displayName,
          amount: amount || plan.price,
          billingPeriod: { startDate, endDate },
          status: 'paid',
          paymentId: payment._id,
          paidAt: new Date()
        });

        return res.status(200).json({ success: true, payment });
      }

      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });

  } catch (error) {
    console.error('Subscriptions API Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
