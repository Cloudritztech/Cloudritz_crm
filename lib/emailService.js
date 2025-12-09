import EmailLog from './models/EmailLog.js';

// Email service using Resend API (free tier: 3000 emails/month)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@cloudritz.com';

export async function sendEmail({ to, subject, html, type, organizationId }) {
  try {
    if (!RESEND_API_KEY) {
      console.log('📧 Email (dev mode):', { to, subject, type });
      await EmailLog.create({ organization: organizationId, to, subject, type, status: 'sent' });
      return { success: true, messageId: 'dev-mode' };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html })
    });

    const data = await response.json();
    
    if (!response.ok) throw new Error(data.message || 'Email send failed');

    await EmailLog.create({ organization: organizationId, to, subject, type, status: 'sent' });
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Email send error:', error);
    await EmailLog.create({ organization: organizationId, to, subject, type, status: 'failed', error: error.message });
    return { success: false, error: error.message };
  }
}

export function getTrialExpiryEmail(orgName, daysLeft) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Trial Expiring Soon</h2>
      <p>Hi ${orgName},</p>
      <p>Your Cloudritz CRM trial will expire in <strong>${daysLeft} days</strong>.</p>
      <p>Upgrade now to continue using all features:</p>
      <ul>
        <li>Unlimited invoices and customers</li>
        <li>Advanced reports and analytics</li>
        <li>WhatsApp integration</li>
        <li>Priority support</li>
      </ul>
      <a href="${process.env.APP_URL}/billing" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Upgrade Now</a>
      <p style="color: #666; font-size: 14px;">Questions? Contact us at support@cloudritz.com</p>
    </div>
  `;
}

export function getSubscriptionInvoiceEmail(orgName, invoice) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Subscription Invoice</h2>
      <p>Hi ${orgName},</p>
      <p>Your subscription invoice is ready:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #f3f4f6;">
          <td style="padding: 12px; border: 1px solid #e5e7eb;">Invoice Number</td>
          <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>${invoice.invoiceNumber}</strong></td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e5e7eb;">Plan</td>
          <td style="padding: 12px; border: 1px solid #e5e7eb;">${invoice.plan}</td>
        </tr>
        <tr style="background: #f3f4f6;">
          <td style="padding: 12px; border: 1px solid #e5e7eb;">Amount</td>
          <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>₹${invoice.amount}</strong></td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e5e7eb;">Due Date</td>
          <td style="padding: 12px; border: 1px solid #e5e7eb;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
        </tr>
      </table>
      <a href="${process.env.APP_URL}/billing/invoice/${invoice._id}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Pay Now</a>
      <p style="color: #666; font-size: 14px;">Thank you for using Cloudritz CRM!</p>
    </div>
  `;
}

export function getPaymentSuccessEmail(orgName, invoice) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Payment Successful</h2>
      <p>Hi ${orgName},</p>
      <p>Your payment of <strong>₹${invoice.amount}</strong> has been received successfully.</p>
      <p>Invoice: <strong>${invoice.invoiceNumber}</strong></p>
      <p>Your subscription is now active until ${new Date(invoice.billingPeriod.end).toLocaleDateString()}.</p>
      <p style="color: #666; font-size: 14px;">Thank you for your business!</p>
    </div>
  `;
}

export function getPaymentFailedEmail(orgName, invoice) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Payment Failed</h2>
      <p>Hi ${orgName},</p>
      <p>We couldn't process your payment of <strong>₹${invoice.amount}</strong>.</p>
      <p>Invoice: <strong>${invoice.invoiceNumber}</strong></p>
      <p>Please update your payment method and try again.</p>
      <a href="${process.env.APP_URL}/billing/invoice/${invoice._id}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Retry Payment</a>
      <p style="color: #666; font-size: 14px;">Need help? Contact support@cloudritz.com</p>
    </div>
  `;
}
