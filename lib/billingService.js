import Organization from './models/Organization.js';
import SubscriptionPlan from './models/SubscriptionPlan.js';
import SubscriptionInvoice from './models/SubscriptionInvoice.js';
import { sendEmail, getTrialExpiryEmail, getSubscriptionInvoiceEmail } from './emailService.js';

// Generate subscription invoices for organizations
export async function generateMonthlyInvoices() {
  try {
    const now = new Date();
    const orgs = await Organization.find({
      'subscription.status': 'active',
      'subscription.plan': { $ne: 'trial' },
      isActive: true
    });

    let generated = 0;
    for (const org of orgs) {
      const endDate = new Date(org.subscription.endDate);
      const daysUntilRenewal = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      // Generate invoice 7 days before renewal
      if (daysUntilRenewal === 7) {
        const plan = await SubscriptionPlan.findOne({ name: org.subscription.plan });
        if (!plan) continue;

        const invoiceNumber = `SUB-${Date.now()}-${org._id.toString().slice(-6)}`;
        const invoice = await SubscriptionInvoice.create({
          organization: org._id,
          invoiceNumber,
          plan: plan.displayName,
          amount: plan.price,
          currency: plan.currency,
          billingPeriod: {
            start: endDate,
            end: new Date(endDate.getTime() + (plan.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
          },
          dueDate: endDate
        });

        await sendEmail({
          to: org.email,
          subject: `Subscription Invoice - ${invoiceNumber}`,
          html: getSubscriptionInvoiceEmail(org.name, invoice),
          type: 'subscription_invoice',
          organizationId: org._id
        });

        generated++;
      }
    }

    console.log(`✅ Generated ${generated} subscription invoices`);
    return { success: true, generated };
  } catch (error) {
    console.error('❌ Generate invoices error:', error);
    return { success: false, error: error.message };
  }
}

// Send trial expiration reminders
export async function sendTrialReminders() {
  try {
    const now = new Date();
    const orgs = await Organization.find({
      'subscription.plan': 'trial',
      'subscription.status': 'active',
      isActive: true
    });

    let sent = 0;
    for (const org of orgs) {
      const endDate = new Date(org.subscription.endDate);
      const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      // Send reminders at 7, 3, and 1 day before expiry
      if ([7, 3, 1].includes(daysLeft)) {
        await sendEmail({
          to: org.email,
          subject: `Trial Expiring in ${daysLeft} Day${daysLeft > 1 ? 's' : ''}`,
          html: getTrialExpiryEmail(org.name, daysLeft),
          type: 'trial_expiry',
          organizationId: org._id
        });
        sent++;
      }

      // Expire trial if past end date
      if (daysLeft <= 0) {
        org.subscription.status = 'expired';
        org.isActive = false;
        await org.save();
      }
    }

    console.log(`✅ Sent ${sent} trial reminders`);
    return { success: true, sent };
  } catch (error) {
    console.error('❌ Trial reminders error:', error);
    return { success: false, error: error.message };
  }
}

// Check and expire overdue subscriptions
export async function expireOverdueSubscriptions() {
  try {
    const now = new Date();
    const result = await Organization.updateMany(
      {
        'subscription.status': 'active',
        'subscription.endDate': { $lt: now },
        'subscription.plan': { $ne: 'trial' }
      },
      {
        $set: {
          'subscription.status': 'expired',
          isActive: false
        }
      }
    );

    console.log(`✅ Expired ${result.modifiedCount} subscriptions`);
    return { success: true, expired: result.modifiedCount };
  } catch (error) {
    console.error('❌ Expire subscriptions error:', error);
    return { success: false, error: error.message };
  }
}
