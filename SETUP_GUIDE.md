# Cloudritz CRM - Complete Setup Guide

## 🚀 Quick Start

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### 2. Required API Keys & Services

#### A. Razorpay Payment Gateway (Required for Subscriptions)

1. **Sign up**: https://dashboard.razorpay.com/signup
2. **Get API Keys**: https://dashboard.razorpay.com/app/keys
3. **Test Mode** (Development):
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
   ```
4. **Live Mode** (Production):
   ```
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
   ```

#### B. Resend Email API (Optional - for email notifications)

1. **Sign up**: https://resend.com/signup
2. **Get API Key**: https://resend.com/api-keys
3. **Free Tier**: 3,000 emails/month, 100 emails/day
4. Configure:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   FROM_EMAIL=noreply@yourdomain.com
   ```

#### C. Cloudinary (Already Configured)

- Used for image uploads (logos, signatures)
- Current configuration is working

#### D. MongoDB Atlas (Already Configured)

- Database is already set up and working

### 3. Cron Jobs Setup (External Service Required)

Since Vercel Hobby plan limits cron jobs, use **cron-job.org** (free):

#### Setup Instructions:

1. **Sign up**: https://cron-job.org/en/signup/
2. **Create New Cron Job**:
   - **Title**: Cloudritz Billing Automation
   - **URL**: `https://your-app.vercel.app/api/billing?action=cron`
   - **Schedule**: Daily at 2:00 AM
   - **Request Method**: GET
   - **Headers**: Add `X-Cron-Secret: your_random_secret_key_here`

3. **Generate Cron Secret**:
   ```bash
   # Generate random secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Add to `.env`:
   ```
   CRON_SECRET=your_generated_secret_here
   ```

4. **What the Cron Job Does**:
   - Checks trial expirations
   - Sends subscription renewal reminders
   - Processes automated billing
   - Updates subscription statuses

### 4. Vercel Deployment

#### Environment Variables to Set in Vercel:

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRE=7000d
NODE_ENV=production
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com
CRON_SECRET=...
VITE_CLOUDINARY_CLOUD_NAME=dbs9ybfk4
VITE_CLOUDINARY_UPLOAD_PRESET=Cloudritz_crm
```

#### Deploy:
```bash
npm run build
vercel --prod
```

## 📊 API Endpoints (12 Total - Within Vercel Free Tier)

1. **account.js** - Profile, settings, branding, employees
2. **admin.js** - Super admin operations, plans, payments list
3. **auth.js** - Login, authentication
4. **backup.js** - Full backup/restore functionality
5. **customers.js** - Customer management
6. **expenses.js** - Expense tracking
7. **invoices.js** - Invoice management
8. **notifications.js** - Notification system
9. **onboarding.js** - Organization onboarding
10. **products.js** - Product management + Excel import
11. **reports.js** - Dashboard analytics
12. **settings.js** - Invoice, integration, backup settings
13. **subscriptions.js** - Subscription purchases, payments
14. **support.js** - Help & support tickets

## ✨ Features Implemented

### ✅ Fully Functional

1. **Multi-Tenant SaaS Architecture**
   - Organization isolation
   - Subscription-based access
   - Role-based permissions

2. **Subscription Management**
   - Razorpay payment integration
   - Multiple plans (Trial, Basic, Professional, Enterprise)
   - Automated billing (via cron)
   - Payment tracking

3. **Super Admin Dashboard**
   - Organization management (CRUD)
   - User management across all orgs
   - Subscription plan management (CRUD)
   - Payment tracking
   - Support ticket management

4. **Business Profile & Branding**
   - Company information
   - Logo & signature upload (Cloudinary)
   - Bank details & UPI
   - Custom brand colors
   - Custom domain support (Enterprise)
   - Hide platform branding (Enterprise)

5. **Backup & Restore**
   - Full data export (JSON)
   - Import with merge/replace options
   - Includes: products, customers, invoices, employees, expenses
   - Automatic backup tracking

6. **Excel Import/Export**
   - Product import from Excel
   - Export products, customers, invoices
   - GST report generation
   - Supports multiple column name formats

7. **Settings Management**
   - Invoice settings (prefix, terms, footer)
   - Integration settings (WhatsApp, SMTP, Google Drive)
   - Backup settings (auto-backup, frequency)

8. **Core CRM Features**
   - Product management with inventory
   - Customer management
   - Invoice generation with GST
   - Expense tracking
   - Employee management
   - Sales reports & analytics

9. **Support System**
   - Live chat-style tickets
   - User can create tickets
   - Super admin can respond
   - Status tracking (open, in-progress, resolved)

### ⚠️ Partially Implemented (UI Ready, Backend Needs Configuration)

1. **WhatsApp Integration**
   - UI and settings ready
   - Needs WhatsApp Business API credentials
   - Invoice sharing link generation works

2. **SMTP Email**
   - Settings UI ready
   - Needs SMTP configuration
   - Test email button ready

3. **Google Drive Backup**
   - Settings toggle ready
   - Needs Google Drive API integration
   - Manual upload works

## 🔧 Configuration Steps

### Step 1: Initial Setup

```bash
# Install dependencies
npm install

# Run locally
npm run dev:full
```

### Step 2: Seed Database

Visit: `https://your-app.vercel.app/api/admin?type=seed`

This creates:
- Super admin account: `admin@cloudritz.com` / `Cloudritz@2024`
- Default subscription plans

### Step 3: Create First Organization

1. Login as super admin
2. Go to Organizations → Create Organization
3. Fill in organization details
4. Create admin user for the organization

### Step 4: Configure Razorpay

1. Get keys from Razorpay dashboard
2. Update `.env` and Vercel environment variables
3. Test payment flow in test mode
4. Switch to live keys for production

### Step 5: Setup Cron Jobs

1. Create account on cron-job.org
2. Add cron job with your app URL
3. Add cron secret header
4. Test by checking subscription status updates

## 📱 User Flow

### For Super Admin:
1. Login → Super Admin Dashboard
2. Manage Organizations
3. Manage Subscription Plans
4. View All Payments
5. Handle Support Tickets
6. Manage Users Across Organizations

### For Organization Admin:
1. Login → Dashboard
2. Manage Products, Customers, Invoices
3. Track Expenses & Employees
4. View Reports & Analytics
5. Configure Business Profile
6. Manage Subscription
7. Create Support Tickets
8. Backup/Restore Data
9. Import/Export Excel

## 🔐 Security Features

- JWT authentication
- Tenant isolation (organizationId filtering)
- Role-based access control
- Subscription limit enforcement
- Cron job secret protection
- Password hashing (bcrypt)

## 📈 Subscription Limits

| Plan | Users | Products | Invoices/Month | Price |
|------|-------|----------|----------------|-------|
| Trial | 2 | 100 | 50 | Free (14 days) |
| Basic | 5 | 500 | 200 | ₹999/month |
| Professional | 15 | 2000 | 1000 | ₹2,499/month |
| Enterprise | Unlimited | Unlimited | Unlimited | ₹4,999/month |

## 🐛 Troubleshooting

### Issue: Payments not working
- Check Razorpay keys are correct
- Verify keys are for correct mode (test/live)
- Check browser console for errors

### Issue: Cron jobs not running
- Verify cron-job.org is configured
- Check cron secret matches
- View cron job execution logs

### Issue: Excel import fails
- Check Excel format matches template
- Verify column names are correct
- Check file size (max 5MB)

### Issue: Backup restore fails
- Verify backup file is valid JSON
- Check backup version compatibility
- Try merge mode instead of replace

## 📞 Support

For issues or questions:
- Email: admin@cloudritz.com
- Create support ticket in app
- Check logs in Vercel dashboard

## 🎯 Next Steps

1. Configure Razorpay with real keys
2. Setup cron jobs on cron-job.org
3. Test payment flow end-to-end
4. Configure email notifications (optional)
5. Setup WhatsApp Business API (optional)
6. Configure Google Drive backup (optional)
7. Add custom domain (Enterprise feature)

---

**Built with ❤️ by Cloudritz Tech**
