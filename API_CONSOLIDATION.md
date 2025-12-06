# API Consolidation - Vercel Function Limit Fix

## Problem
Vercel Hobby plan limits deployments to 12 serverless functions. The project had 14 functions, causing deployment failures.

## Solution
Consolidated related API endpoints to reduce from 14 to 10 serverless functions.

---

## Changes Made

### 1. Consolidated Invoice Operations → `api/invoices.js`
**Merged files:**
- `api/invoice.js` (single invoice operations)
- `api/invoices/index.js` (list/create invoices)
- `api/invoices/payment.js` (payment updates)
- `api/payments.js` (payment management)

**New endpoint structure:**
```
GET  /api/invoices                    → List all invoices
POST /api/invoices                    → Create new invoice
GET  /api/invoices?id={id}            → Get single invoice
GET  /api/invoices?id={id}&action=pdf → Generate PDF

Payment operations:
PUT    /api/invoices?id={id}&action=payment     → Update invoice payment
GET    /api/invoices?action=payment             → Get all payments
GET    /api/invoices?action=payment&invoiceId=  → Get payments by invoice
GET    /api/invoices?action=payment&customerId= → Get payments by customer
POST   /api/invoices?action=payment             → Create payment
DELETE /api/invoices?id={id}&action=payment     → Delete payment
```

### 2. Consolidated User Settings → `api/user.js`
**Merged files:**
- `api/profile.js` (business profile)
- `api/settings.js` (user settings)

**New endpoint structure:**
```
Profile operations:
GET  /api/user?action=profile → Get business profile
POST /api/user?action=profile → Update business profile

Settings operations:
GET  /api/user                → Get all settings
GET  /api/user?section={name} → Get specific settings section
PUT  /api/user                → Update all settings
PUT  /api/user?section={name} → Update specific settings section
```

---

## Final API Structure (10 Functions)

1. ✅ `api/auth.js` - Authentication (login, register)
2. ✅ `api/customers.js` - Customer management
3. ✅ `api/employees.js` - Employee management
4. ✅ `api/expenses.js` - Expense tracking
5. ✅ `api/invoices.js` - **CONSOLIDATED** (invoices + payments)
6. ✅ `api/notifications.js` - Notification system
7. ✅ `api/products.js` - Product management
8. ✅ `api/reports.js` - Dashboard analytics
9. ✅ `api/user.js` - **CONSOLIDATED** (profile + settings)
10. ✅ `api/cron/daily-notifications.js` - Scheduled tasks

**Total: 10 functions** (within 12 function limit ✅)

---

## Frontend Changes

Updated `src/services/api.js` to use new consolidated endpoints:

### Invoice API Changes
```javascript
// OLD
api.get(`/invoice?id=${id}`)
api.get(`/invoice?id=${id}&action=pdf`)
api.put(`/invoices/payment?id=${id}`)

// NEW
api.get(`/invoices?id=${id}`)
api.get(`/invoices?id=${id}&action=pdf`)
api.put(`/invoices?id=${id}&action=payment`)
```

### Payment API Changes
```javascript
// OLD
api.get('/payments')
api.post('/payments')
api.delete(`/payments?id=${id}`)

// NEW
api.get('/invoices?action=payment')
api.post('/invoices?action=payment')
api.delete(`/invoices?id=${id}&action=payment`)
```

### Profile API Changes
```javascript
// OLD
api.get('/profile')
api.post('/profile')

// NEW
api.get('/user?action=profile')
api.post('/user?action=profile')
```

---

## Testing Checklist

After deployment, verify these features work:

### Invoices
- [ ] List all invoices
- [ ] Create new invoice
- [ ] View single invoice
- [ ] Generate PDF
- [ ] Update payment status

### Payments
- [ ] View all payments
- [ ] View payments by invoice
- [ ] View payments by customer
- [ ] Record new payment
- [ ] Delete payment

### Profile & Settings
- [ ] View business profile
- [ ] Update business profile
- [ ] View user settings
- [ ] Update user settings

---

## Deployment Steps

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "Consolidate API endpoints to fix Vercel function limit"
   git push
   ```

2. **Deploy to Vercel:**
   - Vercel will auto-deploy from Git
   - Or manually: `vercel --prod`

3. **Verify deployment:**
   - Check Vercel dashboard shows 10 functions
   - Test all API endpoints
   - Check browser console for errors

---

## Rollback Plan

If issues occur, the old files are in Git history:
```bash
git revert HEAD
git push
```

---

## Benefits

✅ **Reduced function count:** 14 → 10 (20% under limit)
✅ **Better organization:** Related operations grouped together
✅ **Easier maintenance:** Fewer files to manage
✅ **No feature loss:** All functionality preserved
✅ **Future-proof:** Room for 2 more functions if needed

---

## Notes

- All model imports are included in consolidated files
- Error handling preserved from original files
- Authentication middleware applied to all endpoints
- CORS headers configured correctly
- Caching strategy maintained in frontend
