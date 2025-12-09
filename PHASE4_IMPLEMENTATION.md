# Phase 4: Payment Gateway & Automated Billing - Implementation Guide

## Overview
Complete payment gateway integration with Razorpay, automated subscription billing, invoice generation, email notifications, and trial expiration reminders.

## 🎯 Features Implemented

### 1. Payment Gateway Integration (Razorpay)
- **Razorpay Checkout**: Integrated Razorpay payment gateway for subscription payments
- **Order Creation**: Create payment orders with proper amount and currency
- **Payment Verification**: Verify payment signatures for security
- **Test Mode**: Supports test mode when API keys not configured
- **Webhook Handler**: Process payment success/failure webhooks

### 2. Subscription Billing
- **Subscription Invoices**: Generate invoices for subscription renewals
- **Payment Tracking**: Track payment status (pending, paid, failed)
- **Auto-renewal**: Extend subscription on successful payment
- **Plan Upgrades**: Allow users to upgrade their subscription plans
- **Billing History**: View all past invoices and payments

### 3. Automated Invoice Generation
- **Monthly Invoices**: Auto-generate invoices 7 days before renewal
- **Invoice Numbering**: Unique invoice numbers (SUB-timestamp-orgId)
- **Billing Periods**: Track billing period start and end dates
- **Due Dates**: Set due dates for payment

### 4. Email Notifications
- **Email Service**: Integrated Resend API (free tier: 3000 emails/month)
- **Email Templates**: Professional HTML email templates
- **Email Types**:
  - Trial expiration reminders (7, 3, 1 day before)
  - Subscription invoice notifications
  - Payment success confirmations
  - Payment failure alerts
- **Email Logging**: Track all sent emails with status

### 5. Trial Expiration Management
- **Auto Reminders**: Send reminders at 7, 3, and 1 day before trial expiry
- **Auto Expiration**: Automatically expire trials and suspend accounts
- **Upgrade Prompts**: Encourage users to upgrade before expiry

### 6. Automated Cron Jobs
- **Daily Invoice Generation**: Generate invoices at midnight (0 0 * * *)
- **Daily Reminders**: Send trial reminders at 9 AM (0 9 * * *)
- **Daily Expiration**: Check and expire subscriptions at 1 AM (0 1 * * *)

## 📁 New Files Created

### Backend Models
1. **lib/models/SubscriptionInvoice.js**
   - Tracks subscription invoices
   - Fields: invoiceNumber, plan, amount, billingPeriod, status, paymentId

2. **lib/models/EmailLog.js**
   - Logs all email notifications
   - Fields: to, subject, type, status, error, sentAt

### Backend Services
3. **lib/emailService.js**
   - Email sending with Resend API
   - Email templates for all notification types
   - Email logging

4. **lib/billingService.js**
   - Generate monthly invoices
   - Send trial reminders
   - Expire overdue subscriptions

### API Endpoints
5. **api/billing.js**
   - GET /api/billing?action=plans - Get all subscription plans
   - GET /api/billing?action=current - Get current subscription
   - GET /api/billing?action=invoices - Get billing history
   - POST /api/billing?action=create-order - Create Razorpay order
   - POST /api/billing?action=verify-payment - Verify payment
   - POST /api/billing?action=upgrade - Upgrade plan
   - POST /api/billing?action=webhook - Razorpay webhook
   - GET /api/billing?action=cron&type=invoices - Cron: Generate invoices
   - GET /api/billing?action=cron&type=reminders - Cron: Send reminders
   - GET /api/billing?action=cron&type=expire - Cron: Expire subscriptions

### Frontend Pages
6. **src/pages/Billing.jsx**
   - View current subscription and days left
   - Browse and upgrade to different plans
   - View billing history
   - Pay pending invoices
   - Razorpay payment integration

### Configuration
7. **vercel.json** (updated)
   - Added 3 cron jobs for automated billing tasks

8. **.env.example**
   - Added Razorpay configuration
   - Added Resend email configuration
   - Added cron secret

9. **public/index.html**
   - Added Razorpay SDK script

## 🔧 Environment Variables Required

```env
# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@cloudritz.com

# App Configuration
APP_URL=https://your-app.vercel.app

# Cron Job Security
CRON_SECRET=your_random_cron_secret_key
```

## 🚀 Setup Instructions

### 1. Razorpay Setup
1. Sign up at https://razorpay.com
2. Get API keys from Dashboard > Settings > API Keys
3. Add keys to Vercel environment variables
4. Configure webhook URL: `https://your-app.vercel.app/api/billing?action=webhook`

### 2. Resend Email Setup
1. Sign up at https://resend.com (free tier: 3000 emails/month)
2. Get API key from Dashboard
3. Verify your domain or use resend.dev for testing
4. Add RESEND_API_KEY to environment variables

### 3. Vercel Cron Jobs
1. Deploy to Vercel
2. Cron jobs will automatically run on schedule
3. Monitor cron job execution in Vercel dashboard
4. Set CRON_SECRET environment variable for security

### 4. Test Mode
- Without Razorpay keys: System runs in test mode
- Test payments are simulated
- All features work without actual payment processing

## 📊 Database Schema Updates

### Organization Model
Added fields:
```javascript
subscription: {
  razorpayCustomerId: String,
  razorpaySubscriptionId: String
}
```

## 🎨 User Interface

### Billing Page Features
- **Current Plan Card**: Shows active plan, status, and days remaining
- **Plan Selection**: Grid of available plans with features
- **Upgrade Buttons**: One-click upgrade with Razorpay checkout
- **Billing History Table**: All invoices with status and actions
- **Pay Now**: Pay pending invoices directly
- **Download**: Download paid invoice PDFs

### Payment Flow
1. User clicks "Upgrade" or "Pay Now"
2. System creates Razorpay order
3. Razorpay checkout modal opens
4. User completes payment
5. System verifies payment signature
6. Subscription updated automatically
7. Success email sent to user

## 🔐 Security Features

### Payment Security
- Razorpay signature verification
- Secure webhook handling
- Payment ID tracking
- Order ID validation

### Cron Job Security
- Protected by CRON_SECRET header
- Only accessible with valid secret
- Prevents unauthorized execution

### Email Security
- Email logging for audit trail
- Error tracking
- Rate limiting via Resend

## 📈 Automated Workflows

### Daily at Midnight (0:00)
- Generate invoices for subscriptions renewing in 7 days
- Send invoice emails to organizations

### Daily at 9 AM (9:00)
- Check trial subscriptions
- Send reminders for trials expiring in 7, 3, or 1 day
- Include upgrade links in emails

### Daily at 1 AM (1:00)
- Check all active subscriptions
- Expire subscriptions past end date
- Suspend organization access

## 🧪 Testing

### Test Payment Flow
1. Navigate to /billing
2. Click "Upgrade" on any plan
3. In test mode, payment will auto-complete
4. Verify subscription updated
5. Check email logs in database

### Test Cron Jobs
```bash
# Test invoice generation
curl -H "x-cron-secret: YOUR_SECRET" \
  https://your-app.vercel.app/api/billing?action=cron&type=invoices

# Test trial reminders
curl -H "x-cron-secret: YOUR_SECRET" \
  https://your-app.vercel.app/api/billing?action=cron&type=reminders

# Test expiration
curl -H "x-cron-secret: YOUR_SECRET" \
  https://your-app.vercel.app/api/billing?action=cron&type=expire
```

### Test Emails
- Set RESEND_API_KEY to test email delivery
- Check EmailLog collection for sent emails
- Verify email templates render correctly

## 📱 Mobile Responsive
- Billing page fully responsive
- Razorpay checkout works on mobile
- Email templates mobile-optimized

## 🔄 Integration with Existing System

### Organization Model
- Added payment tracking fields
- Subscription status management
- Feature flags based on plan

### User Experience
- Billing link in navigation
- Subscription status in dashboard
- Trial expiry warnings
- Payment reminders

## 🎯 Next Steps

### Optional Enhancements
1. **Invoice PDFs**: Generate PDF invoices for subscriptions
2. **Payment Methods**: Add card management
3. **Proration**: Handle mid-cycle upgrades
4. **Discounts**: Add coupon code support
5. **Analytics**: Track payment metrics
6. **Dunning**: Retry failed payments
7. **Multi-currency**: Support multiple currencies

## 📞 Support

### Common Issues

**Payment not processing**
- Check Razorpay API keys
- Verify webhook URL configured
- Check browser console for errors

**Emails not sending**
- Verify RESEND_API_KEY
- Check domain verification
- Review EmailLog for errors

**Cron jobs not running**
- Verify CRON_SECRET set
- Check Vercel cron logs
- Ensure functions deployed

## ✅ Phase 4 Complete

All features implemented:
- ✅ Razorpay payment gateway integration
- ✅ Automated subscription billing
- ✅ Invoice generation for subscriptions
- ✅ Email notifications (Resend)
- ✅ Trial expiration reminders
- ✅ Automated cron jobs
- ✅ Billing UI with payment flow
- ✅ Test mode support
- ✅ Security and error handling

**Total API Count**: 12 functions (within Vercel limit)
1. auth.js
2. onboarding.js
3. admin.js
4. account.js
5. customers.js
6. products.js
7. invoices.js
8. employees.js
9. expenses.js
10. reports.js
11. notifications.js
12. **billing.js** (NEW)

---

**Built with ❤️ for Cloudritz Tech**
