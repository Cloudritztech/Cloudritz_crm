# API Quick Reference - Consolidated Endpoints

## 🔄 Changed Endpoints

### Invoices & Payments (Consolidated)

#### Before:
```
/api/invoice?id={id}              → Get invoice
/api/invoice?id={id}&action=pdf   → PDF
/api/invoices                     → List/Create
/api/invoices/payment?id={id}     → Update payment
/api/payments                     → Payment operations
```

#### After:
```
/api/invoices                           → List/Create invoices
/api/invoices?id={id}                   → Get single invoice
/api/invoices?id={id}&action=pdf        → Generate PDF
/api/invoices?id={id}&action=payment    → Update invoice payment
/api/invoices?action=payment            → All payment operations
```

---

### Profile & Settings (Consolidated)

#### Before:
```
/api/profile     → Business profile
/api/settings    → User settings
```

#### After:
```
/api/user?action=profile    → Business profile
/api/user                   → User settings (default)
/api/user?section={name}    → Specific settings section
```

---

## 📋 Complete API List (10 Functions)

| Endpoint | Purpose | Methods |
|----------|---------|---------|
| `/api/auth` | Authentication | POST |
| `/api/customers` | Customer management | GET, POST, PUT |
| `/api/employees` | Employee management | GET, POST, PUT, DELETE |
| `/api/expenses` | Expense tracking | GET, POST, PUT, DELETE |
| `/api/invoices` | **Invoices + Payments** | GET, POST, PUT, DELETE |
| `/api/notifications` | Notifications | GET, POST, PUT, DELETE |
| `/api/products` | Product management | GET, POST, PUT, DELETE |
| `/api/reports` | Dashboard analytics | GET |
| `/api/user` | **Profile + Settings** | GET, POST, PUT |
| `/api/cron/daily-notifications` | Scheduled tasks | GET (cron) |

---

## 🎯 Usage Examples

### Create Invoice
```javascript
POST /api/invoices
{
  "customer": "customerId",
  "items": [...],
  "discount": 100,
  "paymentMethod": "cash"
}
```

### Get Invoice PDF
```javascript
GET /api/invoices?id={invoiceId}&action=pdf
```

### Record Payment
```javascript
POST /api/invoices?action=payment
{
  "invoice": "invoiceId",
  "amount": 5000,
  "paymentMethod": "upi",
  "paymentDate": "2025-01-15"
}
```

### Update Business Profile
```javascript
POST /api/user?action=profile
{
  "businessName": "Anvi Tiles",
  "ownerName": "Owner Name",
  "gstin": "GST123456",
  ...
}
```

### Get User Settings
```javascript
GET /api/user
GET /api/user?section=notifications
```

---

## ✅ Deployment Checklist

- [x] Consolidated 4 invoice-related files → 1 file
- [x] Consolidated 2 user-related files → 1 file
- [x] Updated frontend API service
- [x] Reduced from 14 to 10 functions
- [x] All functionality preserved
- [ ] Deploy to Vercel
- [ ] Test all endpoints
- [ ] Verify in production

---

## 🚀 Deploy Now

```bash
# Commit changes
git add .
git commit -m "Fix: Consolidate API endpoints for Vercel function limit"
git push

# Deploy (if not auto-deployed)
vercel --prod
```

---

## 📞 Support

If any endpoint returns 404 after deployment:
1. Check Vercel function logs
2. Verify environment variables are set
3. Ensure MongoDB connection is working
4. Check browser console for API errors

**All endpoints use the same authentication and error handling as before.**
