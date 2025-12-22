# 🏢 Multi-Tenant SaaS CRM Architecture

## 🎯 Overview
Enterprise-grade, white-label CRM with multi-tenant architecture, role-based access control, and GST compliance for India.

---

## 🗄️ Database Architecture

### Multi-Tenant Data Isolation

**Every collection includes:**
```javascript
{
  organizationId: ObjectId,  // Tenant isolation
  // ... other fields
}
```

**Indexed for Performance:**
```javascript
// Compound indexes for tenant isolation
{ organizationId: 1, createdAt: -1 }
{ organizationId: 1, status: 1 }
```

### Collections

#### 1. **Organizations** (Tenants)
```javascript
{
  _id: ObjectId,
  name: String,
  subdomain: String (unique),
  email: String,
  
  // White-label branding
  branding: {
    primaryColor: String,
    secondaryColor: String,
    logoUrl: String,
    faviconUrl: String,
    companyName: String,
    customDomain: String,
    hideCloudiritzBranding: Boolean
  },
  
  // Subscription management
  subscription: {
    status: 'active' | 'blocked',
    isBlocked: Boolean,
    blockReason: String,
    quarterlyMaintenanceFee: Number,
    maxUsers: Number,
    maxProducts: Number,
    maxInvoices: Number
  },
  
  // Feature flags
  features: {
    whatsappIntegration: Boolean,
    aiInsights: Boolean,
    multiCurrency: Boolean,
    advancedReports: Boolean,
    apiAccess: Boolean
  }
}
```

#### 2. **Users**
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId,  // Tenant link
  name: String,
  email: String,
  password: String (hashed),
  role: 'superadmin' | 'admin' | 'manager' | 'staff',
  isActive: Boolean
}
```

#### 3. **Products, Customers, Invoices, Expenses**
```javascript
{
  _id: ObjectId,
  organizationId: ObjectId,  // CRITICAL: Tenant isolation
  // ... entity-specific fields
}
```

---

## 👥 Role-Based Access Control (RBAC)

### Roles Hierarchy

```
┌─────────────────┐
│   Super Admin   │  → Manages all organizations
└────────┬────────┘
         │
    ┌────▼────┐
    │  Admin  │  → Full access to own organization
    └────┬────┘
         │
    ┌────▼────┐
    │ Manager │  → Limited management access
    └────┬────┘
         │
    ┌────▼────┐
    │  Staff  │  → Basic operations only
    └─────────┘
```

### Permission Matrix

| Feature | Super Admin | Admin | Manager | Staff |
|---------|-------------|-------|---------|-------|
| Manage Organizations | ✅ | ❌ | ❌ | ❌ |
| Block Organizations | ✅ | ❌ | ❌ | ❌ |
| Manage Features | ✅ | ❌ | ❌ | ❌ |
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Analytics | ✅ | ✅ | ✅ | ❌ |
| Create/Edit Products | ✅ | ✅ | ✅ | ❌ |
| Delete Products | ✅ | ✅ | ❌ | ❌ |
| Create Invoices | ✅ | ✅ | ✅ | ✅ |
| Delete Invoices | ✅ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ❌ |
| Export Reports | ✅ | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ |
| Manage Subscription | ✅ | ✅ | ❌ | ❌ |

---

## 🔐 Security Architecture

### 1. **Authentication**
- JWT-based authentication
- Token includes: `userId`, `organizationId`, `role`
- Expiry: 7 days (configurable)

### 2. **Tenant Isolation Middleware**
```javascript
// Every API request goes through:
authenticate() → tenantIsolation() → handler()

// Ensures:
- Valid JWT token
- organizationId extracted from token
- All DB queries filtered by organizationId
```

### 3. **MongoDB Query Security**
```javascript
// ✅ SECURE - Always includes organizationId
Invoice.find({ organizationId: req.organizationId })

// ❌ INSECURE - Missing tenant filter
Invoice.find({})  // NEVER DO THIS

// ✅ SECURE - Aggregation with tenant isolation
Invoice.aggregate([
  { $match: { organizationId: req.organizationId } },
  // ... rest of pipeline
])

// ✅ SECURE - Lookup with pipeline filtering
{
  $lookup: {
    from: 'products',
    pipeline: [{ $match: { organizationId: req.organizationId } }]
  }
}
```

---

## 🎨 White-Label Features

### 1. **Branding Customization**
- Custom logo and favicon
- Primary and secondary colors
- Company name override
- Hide platform branding

### 2. **Subdomain Support**
```
company1.cloudritz.com
company2.cloudritz.com
```

### 3. **Custom Domain (Future)**
```
crm.clientcompany.com → company1.cloudritz.com
```

### 4. **Branded Exports**
- PDF invoices with client logo
- Excel reports with branding
- Email templates with custom colors

---

## 💳 SaaS Monetization

### Subscription Plans

```javascript
{
  free: {
    maxUsers: 2,
    maxProducts: 100,
    maxInvoices: 50,
    features: {
      advancedReports: false,
      whatsappIntegration: false,
      aiInsights: false
    }
  },
  basic: {
    price: 2999,  // Quarterly
    maxUsers: 5,
    maxProducts: 1000,
    maxInvoices: 500,
    features: {
      advancedReports: true,
      whatsappIntegration: false,
      aiInsights: false
    }
  },
  premium: {
    price: 9999,  // Quarterly
    maxUsers: 20,
    maxProducts: 10000,
    maxInvoices: 5000,
    features: {
      advancedReports: true,
      whatsappIntegration: true,
      aiInsights: true
    }
  }
}
```

### Feature Gating

```javascript
// Backend
if (!canAccessFeature(organization, 'advancedReports')) {
  return res.status(403).json({ 
    success: false, 
    message: 'Upgrade to access advanced reports' 
  });
}

// Frontend
{hasFeature('advancedReports') && <AdvancedReportsButton />}
```

---

## 📊 Financial Compliance (India)

### GST Calculations
```javascript
Taxable Amount = Item Total - Discount
CGST = Taxable Amount × 9%
SGST = Taxable Amount × 9%
Invoice Total = Taxable Amount + CGST + SGST
```

### Reports
- Monthly GST Summary
- Sales Register with GSTIN
- Output Tax Liability
- Profit After Tax
- COGS-based profit calculation

---

## 🚀 API Architecture

### Endpoint Structure
```
/api/auth          → Authentication
/api/products      → Product management (tenant-isolated)
/api/customers     → Customer management (tenant-isolated)
/api/invoices      → Invoice management (tenant-isolated)
/api/expenses      → Expense tracking (tenant-isolated)
/api/reports       → Analytics & reports (tenant-isolated)
/api/admin         → Super admin operations
/api/account       → Organization settings
```

### Request Flow
```
Client Request
    ↓
CORS Headers
    ↓
authenticate() → Extract JWT, validate user
    ↓
tenantIsolation() → Check subscription, extract organizationId
    ↓
Handler → Process with organizationId filter
    ↓
Response
```

---

## 🎯 Key Features

### ✅ Multi-Tenant
- Complete data isolation
- Subdomain-based routing
- Organization-level settings

### ✅ White-Label
- Custom branding
- Logo and colors
- Branded exports

### ✅ Role-Based Access
- 4 role levels
- Granular permissions
- Feature-level control

### ✅ SaaS Controls
- Subscription management
- Feature flags
- Usage limits
- Block/unblock organizations

### ✅ GST Compliant
- CGST/SGST tracking
- Sales register
- Tax reports
- Accountant-ready exports

### ✅ Financial Accuracy
- COGS calculation
- Profit after tax
- Multi-period trends
- Donut chart breakdowns

---

## 🔧 Implementation Files

### Backend
- `/lib/models/Organization.js` - Tenant model
- `/lib/models/User.js` - User with roles
- `/lib/middleware/tenant.js` - Tenant isolation
- `/lib/permissions.js` - RBAC logic
- `/api/admin.js` - Super admin API
- `/api/reports.js` - Financial reports

### Frontend
- `/src/hooks/usePermissions.js` - Permission hook
- `/src/components/ProtectedRoute.jsx` - Route guard
- `/src/pages/SuperAdminDashboard.jsx` - Admin panel
- `/src/pages/GSTReports.jsx` - GST compliance
- `/src/components/FinancialTrends.jsx` - Analytics

---

## 🎓 Best Practices

### 1. **Always Filter by organizationId**
```javascript
// ✅ CORRECT
const products = await Product.find({ organizationId: req.organizationId });

// ❌ WRONG
const products = await Product.find({});
```

### 2. **Use Middleware**
```javascript
// Every protected route
await authenticate(req, res, async () => {
  await tenantIsolation(req, res, async () => {
    // Your handler code
  });
});
```

### 3. **Check Permissions**
```javascript
// Backend
if (!hasPermission(req.userRole, 'DELETE_INVOICE')) {
  return res.status(403).json({ message: 'Access denied' });
}

// Frontend
{hasPermission('DELETE_INVOICE') && <DeleteButton />}
```

---

## 📈 Scalability

- **Horizontal Scaling**: Add more servers
- **Database Sharding**: By organizationId
- **Caching**: Redis for session/data
- **CDN**: Static assets and media
- **Load Balancer**: Distribute traffic

---

## 🎉 Enterprise Ready

✅ Multi-tenant architecture
✅ Role-based access control
✅ White-label branding
✅ SaaS monetization
✅ GST compliance (India)
✅ Financial accuracy
✅ Subscription management
✅ Feature gating
✅ Secure by design
✅ Investor-ready codebase
