# Database Architecture - Multi-Tenant CRM

## Overview
This CRM uses a **single database, multi-tenant architecture** with complete data isolation between organizations. Every tenant's data is separated by `organizationId` to prevent data mixup.

## Core Principles

### 1. Data Isolation
- **Every collection** (except User and Organization) has `organizationId` field
- All queries **MUST** filter by `organizationId`
- Compound indexes ensure fast queries and data isolation
- Unique constraints are scoped to `organizationId`

### 2. Security Layers
- **Authentication**: JWT tokens contain `userId`, `organizationId`, `role`
- **Tenant Isolation Middleware**: Validates organization access on every request
- **Subscription Limits**: Enforces plan limits (products, invoices, users)
- **Role-Based Access**: Super admin, admin, manager, staff roles

### 3. Performance
- Compound indexes on `organizationId` + frequently queried fields
- Indexes on date fields for time-based queries
- Lean queries for read-only operations

---

## Database Schema

### 1. Organization (Master Tenant)
```javascript
{
  _id: ObjectId,
  name: String,                    // Business name
  subdomain: String (unique),      // tenant.cloudritz.com
  email: String,
  phone: String,
  address: String,
  logo: String,
  signatureUrl: String,
  gstin: String,
  
  // Subscription
  subscription: {
    plan: String,                  // trial, basic, professional, enterprise
    status: String,                // active, expired, cancelled
    startDate: Date,
    endDate: Date,
    maxUsers: Number,
    maxProducts: Number,
    maxInvoices: Number
  },
  
  // Features (based on plan)
  features: {
    whatsappIntegration: Boolean,
    aiInsights: Boolean,
    multiCurrency: Boolean,
    advancedReports: Boolean,
    apiAccess: Boolean,
    customBranding: Boolean,
    prioritySupport: Boolean
  },
  
  // Branding (white-label)
  branding: {
    primaryColor: String,
    secondaryColor: String,
    logoUrl: String,
    faviconUrl: String,
    customDomain: String,
    hideCloudiritzBranding: Boolean
  },
  
  // Settings
  settings: {
    invoicePrefix: String,
    invoiceStartNumber: Number,
    termsAndConditions: String,
    footerNote: String,
    whatsapp: Object,
    googleDrive: Object
  },
  
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    branch: String,
    upiId: String
  },
  
  isActive: Boolean,
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- subdomain (unique)
- isActive, subscription.status
```

### 2. User (Multi-Tenant Users)
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId (Organization),  // NULL for superadmin
  name: String,
  email: String,
  password: String (hashed),
  role: String,                    // superadmin, admin, manager, staff
  profileImage: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { organizationId: 1, email: 1 } (unique)
- { email: 1 }
- { role: 1 }
```

### 3. Product (Tenant-Isolated)
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId (Organization),  // REQUIRED
  name: String,
  image: String,
  unit: String,                    // piece, box, kg, meter, etc.
  sellingPrice: Number,
  purchasePrice: Number,
  stock: Number,
  stockSaleValue: Number,          // auto-calculated
  stockPurchaseValue: Number,      // auto-calculated
  taxIncluded: Boolean,
  lowStockLimit: Number,
  stockHistory: [{
    type: String,                  // IN, OUT
    qty: Number,
    date: Date,
    note: String
  }],
  category: String,                // tiles, sanitary, wpc_doors, accessories
  hsnCode: String,
  isActive: Boolean,
  importedFromExcel: Boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { organizationId: 1, name: 1 }
- { organizationId: 1, isActive: 1 }
- { organizationId: 1, category: 1 }
- { organizationId: 1, createdAt: -1 }
```

### 4. Customer (Tenant-Isolated)
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId (Organization),  // REQUIRED
  name: String,
  phone: String,
  email: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  totalPurchases: Number,
  lastPurchaseDate: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { organizationId: 1, phone: 1 } (unique)
- { organizationId: 1, isActive: 1 }
- { organizationId: 1, name: 1 }
- { organizationId: 1, createdAt: -1 }
```

### 5. Invoice (Tenant-Isolated)
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId (Organization),  // REQUIRED
  invoiceNumber: String,           // Auto-generated: YYYYMM-001
  customer: ObjectId (Customer),
  
  buyerDetails: {
    name: String,
    address: String,
    mobile: String,
    gstin: String,
    state: String,
    stateCode: String
  },
  
  consigneeDetails: { ... },
  
  items: [{
    product: ObjectId (Product),
    quantity: Number,
    price: Number,
    discount: Number,
    discountType: String,          // amount, percentage
    taxableValue: Number,
    cgstRate: Number,
    sgstRate: Number,
    cgstAmount: Number,
    sgstAmount: Number,
    total: Number
  }],
  
  subtotal: Number,
  totalTaxableAmount: Number,
  totalCgst: Number,
  totalSgst: Number,
  tax: Number,
  discount: Number,
  discountType: String,
  applyGST: Boolean,
  roundOff: Number,
  grandTotal: Number,
  total: Number,
  amountInWords: String,
  
  paymentMethod: String,           // cash, card, upi, cheque
  status: String,                  // paid, pending, cancelled
  paymentStatus: String,           // paid, pending, partial
  paidAmount: Number,
  pendingAmount: Number,
  paymentDate: Date,
  
  notes: String,
  terms: String,
  dueDate: Date,
  
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { organizationId: 1, invoiceNumber: 1 } (unique)
- { organizationId: 1, status: 1 }
- { organizationId: 1, createdAt: -1 }
- { organizationId: 1, customer: 1 }
- { organizationId: 1, paymentStatus: 1 }
```

### 6. Expense (Tenant-Isolated)
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId (Organization),  // REQUIRED
  title: String,
  type: String,                    // salary, rent, utilities, travel, marketing, purchase, miscellaneous
  description: String,
  amount: Number,
  paymentMethod: String,           // cash, upi, bank, card
  expenseDate: Date,
  employee: ObjectId (Employee),
  product: ObjectId (Product),
  referenceFile: String,
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { organizationId: 1, expenseDate: -1 }
- { organizationId: 1, type: 1 }
- { organizationId: 1, createdAt: -1 }
```

### 7. Employee (Tenant-Isolated)
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId (Organization),  // REQUIRED
  name: String,
  email: String,
  phone: String,
  salary: Number,
  joiningDate: Date,
  department: String,
  status: String,                  // active, inactive
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { organizationId: 1, status: 1 }
- { organizationId: 1, email: 1 } (unique)
- { organizationId: 1, createdAt: -1 }
```

### 8. InventoryHistory (Tenant-Isolated)
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId (Organization),  // REQUIRED
  product: ObjectId (Product),
  type: String,                    // sale, purchase, adjustment
  quantity: Number,
  previousStock: Number,
  newStock: Number,
  reason: String,
  updatedBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { organizationId: 1, product: 1, createdAt: -1 }
```

### 9. SupportTicket (Tenant-Isolated)
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId (Organization),  // REQUIRED
  userId: ObjectId (User),
  userName: String,
  userEmail: String,
  organizationName: String,
  subject: String,
  status: String,                  // open, in-progress, resolved, closed
  priority: String,                // low, medium, high, urgent
  category: String,                // technical, billing, feature-request, bug, general
  messages: [{
    sender: String,                // user, admin
    senderName: String,
    message: String,
    timestamp: Date,
    read: Boolean
  }],
  lastMessageAt: Date,
  unreadCount: {
    user: Number,
    admin: Number
  },
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { organizationId: 1, status: 1 }
- { status: 1, lastMessageAt: -1 }
```

### 10. SubscriptionPlan (Global)
```javascript
{
  _id: ObjectId,
  name: String (unique),           // trial, basic, professional, enterprise
  displayName: String,
  description: String,
  price: Number,
  billingCycle: String,            // monthly, yearly
  trialDays: Number,
  
  limits: {
    maxUsers: Number,
    maxProducts: Number,
    maxInvoices: Number,
    maxCustomers: Number,
    maxStorage: Number
  },
  
  features: {
    whatsappIntegration: Boolean,
    aiInsights: Boolean,
    multiCurrency: Boolean,
    advancedReports: Boolean,
    apiAccess: Boolean,
    customBranding: Boolean,
    prioritySupport: Boolean,
    multiLocation: Boolean
  },
  
  isActive: Boolean,
  sortOrder: Number,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- name (unique)
- { isActive: 1, sortOrder: 1 }
```

### 11. SubscriptionInvoice (Tenant-Isolated)
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId (Organization),  // REQUIRED
  invoiceNumber: String (unique),
  plan: String,
  amount: Number,
  billingPeriod: {
    startDate: Date,
    endDate: Date
  },
  status: String,                  // pending, paid, failed, cancelled
  paymentId: ObjectId (Payment),
  paidAt: Date,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { organizationId: 1, createdAt: -1 }
- invoiceNumber (unique)
```

### 12. Payment (Tenant-Isolated)
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId (Organization),  // REQUIRED
  organizationName: String,
  planId: ObjectId (SubscriptionPlan),
  planName: String,
  amount: Number,
  currency: String,
  paymentMethod: String,           // razorpay, stripe, manual, bank_transfer
  paymentGateway: {
    orderId: String,
    paymentId: String,
    signature: String
  },
  status: String,                  // pending, processing, completed, failed, refunded
  type: String,                    // subscription, upgrade, renewal, addon
  billingPeriod: {
    startDate: Date,
    endDate: Date
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    notes: String
  },
  processedBy: ObjectId (User),
  processedAt: Date,
  failureReason: String,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { organizationId: 1, status: 1 }
- { status: 1, createdAt: -1 }
```

---

## Data Isolation Strategy

### Middleware Chain
```
Request → Authentication → Tenant Isolation → Subscription Check → API Handler
```

1. **Authentication**: Verifies JWT, loads user, sets `req.userId`, `req.organizationId`, `req.userRole`
2. **Tenant Isolation**: Validates organization is active and subscription is valid
3. **Subscription Check**: Enforces plan limits (products, invoices, users)
4. **API Handler**: All queries automatically filter by `req.organizationId`

### Query Pattern
```javascript
// ✅ CORRECT - Always filter by organizationId
const products = await Product.find({ 
  organizationId: req.organizationId,
  isActive: true 
});

// ❌ WRONG - Missing organizationId filter
const products = await Product.find({ isActive: true });
```

### Super Admin Access
- Super admin has `role: 'superadmin'` and `organizationId: null`
- Can access all organizations via admin API
- Bypasses tenant isolation middleware
- Cannot perform tenant-specific operations

---

## Subscription Limits Enforcement

### Product Limit
```javascript
// Before creating product
const currentCount = await Product.countDocuments({ 
  organizationId: org._id, 
  isActive: true 
});
if (currentCount >= org.subscription.maxProducts) {
  throw new Error('Product limit reached. Upgrade your plan.');
}
```

### Invoice Limit (Monthly)
```javascript
// Before creating invoice
const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const currentCount = await Invoice.countDocuments({ 
  organizationId: org._id, 
  createdAt: { $gte: startOfMonth } 
});
if (currentCount >= org.subscription.maxInvoices) {
  throw new Error('Monthly invoice limit reached. Upgrade your plan.');
}
```

### User Limit
```javascript
// Before creating user
const currentCount = await User.countDocuments({ 
  organizationId: org._id, 
  isActive: true 
});
if (currentCount >= org.subscription.maxUsers) {
  throw new Error('User limit reached. Upgrade your plan.');
}
```

---

## Data Migration & Maintenance

### Adding organizationId to Existing Data
```javascript
// Run this script to add organizationId to collections missing it
db.inventoryhistories.updateMany(
  { organizationId: { $exists: false } },
  [{ $set: { 
    organizationId: { 
      $let: {
        vars: { product: { $first: "$product" } },
        in: "$$product.organizationId"
      }
    }
  }}]
);
```

### Backup Strategy
- **Per-Tenant Backup**: Export all data for specific `organizationId`
- **Full Backup**: MongoDB dump with all collections
- **Automated**: Daily backups via cron job

### Data Cleanup
```javascript
// Delete organization and all related data
await Organization.findByIdAndDelete(orgId);
await User.deleteMany({ organizationId: orgId });
await Product.deleteMany({ organizationId: orgId });
await Customer.deleteMany({ organizationId: orgId });
await Invoice.deleteMany({ organizationId: orgId });
await Expense.deleteMany({ organizationId: orgId });
await Employee.deleteMany({ organizationId: orgId });
await InventoryHistory.deleteMany({ organizationId: orgId });
await SupportTicket.deleteMany({ organizationId: orgId });
await SubscriptionInvoice.deleteMany({ organizationId: orgId });
await Payment.deleteMany({ organizationId: orgId });
```

---

## Best Practices

1. **Always filter by organizationId** in all queries
2. **Use compound indexes** starting with organizationId
3. **Validate organizationId** matches authenticated user
4. **Never expose organizationId** in frontend URLs
5. **Use lean()** for read-only queries
6. **Enforce subscription limits** before create operations
7. **Log all data access** for audit trail
8. **Test data isolation** with multiple test organizations
9. **Monitor query performance** with slow query logs
10. **Regular index maintenance** to ensure optimal performance

---

## Security Checklist

- [x] All collections have organizationId (except global ones)
- [x] Compound indexes on organizationId + other fields
- [x] Unique constraints scoped to organizationId
- [x] Middleware enforces tenant isolation
- [x] Subscription limits checked before operations
- [x] Super admin access properly separated
- [x] JWT tokens include organizationId
- [x] No cross-tenant data leakage possible
- [x] Audit logs for sensitive operations
- [x] Data backup and restore per tenant

---

## Performance Optimization

### Index Strategy
- Primary: `{ organizationId: 1, ... }`
- Always query with organizationId first
- Add covering indexes for frequent queries

### Query Optimization
- Use `.lean()` for read-only operations
- Limit results with `.limit()`
- Project only needed fields with `.select()`
- Use aggregation for complex reports

### Caching Strategy
- Cache organization settings
- Cache subscription plan details
- Cache user permissions
- Invalidate on updates

---

## Monitoring

### Key Metrics
- Query response time per organization
- Storage usage per organization
- API calls per organization
- Subscription limit usage
- Failed authentication attempts

### Alerts
- Subscription expiring soon
- Limit approaching (80% usage)
- Unusual data access patterns
- Failed payment attempts
- High error rates

---

**Last Updated**: December 2025
**Database**: MongoDB Atlas
**Connection**: mongodb+srv://cloudritztech_db_user:***@cluster0.pouxy6j.mongodb.net/cloudritz_crm
