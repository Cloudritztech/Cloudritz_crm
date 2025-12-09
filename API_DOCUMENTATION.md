# Cloudritz CRM - API Documentation

## Base URL
- **Production**: `https://your-app.vercel.app/api`
- **Development**: `http://localhost:3000/api`

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Response Format
All API responses follow this structure:
```json
{
  "success": true|false,
  "message": "Response message",
  "data": { ... }
}
```

---

## 1. Authentication API (`/api/auth`)

### Login
```http
POST /api/auth?action=login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "admin"
  },
  "organization": {
    "id": "org_id",
    "name": "Acme Corp",
    "subdomain": "acme",
    "subscription": { ... }
  }
}
```

### Register (Deprecated - Use Onboarding)
```http
POST /api/auth?action=register
```

---

## 2. Onboarding API (`/api/onboarding`)

### Check Subdomain Availability
```http
POST /api/onboarding?action=check-subdomain
Content-Type: application/json

{
  "subdomain": "acme"
}
```

**Response:**
```json
{
  "success": true,
  "available": true
}
```

### Register Organization
```http
POST /api/onboarding?action=register
Content-Type: application/json

{
  "organization": {
    "name": "Acme Corporation",
    "subdomain": "acme",
    "email": "contact@acme.com",
    "phone": "+91 98765 43210",
    "address": "Mumbai, India"
  },
  "admin": {
    "name": "John Doe",
    "email": "john@acme.com",
    "password": "password123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Organization registered successfully",
  "data": {
    "token": "jwt_token",
    "user": { ... },
    "organization": { ... }
  }
}
```

---

## 3. Products API (`/api/products`)

### List Products
```http
GET /api/products?search=tiles&category=tiles&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` (optional): Search by name or SKU
- `category` (optional): Filter by category
- `lowStock` (optional): true to get low stock items
- `limit` (optional): Number of results (default: 100)

### Create Product
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Premium Tiles",
  "sku": "TILE-001",
  "category": "tiles",
  "purchasePrice": 100,
  "sellingPrice": 150,
  "stock": 500,
  "unit": "box",
  "hsnCode": "6907",
  "brand": "Acme Tiles"
}
```

### Update Product
```http
PUT /api/products?id=<product_id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "sellingPrice": 160,
  "stock": 450
}
```

### Delete Product
```http
DELETE /api/products?id=<product_id>
Authorization: Bearer <token>
```

---

## 4. Customers API (`/api/customers`)

### List Customers
```http
GET /api/customers?search=john&limit=50
Authorization: Bearer <token>
```

### Create Customer
```http
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+91 98765 43210",
  "email": "john@example.com",
  "address": "123 Main St, Mumbai",
  "gstin": "27AABCU9603R1ZM"
}
```

### Get Customer Details
```http
GET /api/customers?id=<customer_id>
Authorization: Bearer <token>
```

### Update Customer
```http
PUT /api/customers?id=<customer_id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "+91 98765 00000",
  "address": "New Address"
}
```

---

## 5. Invoices API (`/api/invoices`)

### List Invoices
```http
GET /api/invoices?status=paid&startDate=2024-01-01&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `search`: Search by invoice number or customer
- `status`: Filter by status (paid, pending, cancelled)
- `customer`: Filter by customer ID
- `startDate`: Filter from date
- `endDate`: Filter to date
- `limit`: Number of results (default: 50)

### Create Invoice
```http
POST /api/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer": "customer_id",
  "items": [
    {
      "product": "product_id",
      "quantity": 10,
      "price": 150,
      "discount": 5,
      "discountType": "percentage"
    }
  ],
  "discount": 100,
  "discountType": "amount",
  "applyGST": true,
  "paymentMethod": "cash",
  "notes": "Thank you for your business"
}
```

### Get Invoice
```http
GET /api/invoices?id=<invoice_id>
Authorization: Bearer <token>
```

### Generate PDF
```http
GET /api/invoices?id=<invoice_id>&action=pdf
Authorization: Bearer <token>
```

### Record Payment
```http
PUT /api/invoices?id=<invoice_id>&action=payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5000,
  "method": "upi",
  "reference": "TXN123456"
}
```

---

## 6. Reports API (`/api/reports`)

### Dashboard Statistics
```http
GET /api/reports
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "todaySales": 15000,
    "weeklySales": 85000,
    "monthlySales": 350000,
    "totalCustomers": 150,
    "totalProducts": 500,
    "lowStockCount": 12,
    "pendingPayments": 25000,
    "recentInvoices": [ ... ]
  }
}
```

### Sales Analytics
```http
GET /api/reports?action=sales-analytics&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

---

## 7. Billing API (`/api/billing`)

### Get Subscription Plans
```http
GET /api/billing?action=plans
Authorization: Bearer <token>
```

### Get Current Subscription
```http
GET /api/billing?action=current
Authorization: Bearer <token>
```

### Get Billing History
```http
GET /api/billing?action=invoices
Authorization: Bearer <token>
```

### Create Payment Order
```http
POST /api/billing?action=create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "plan_id"
}
```

### Verify Payment
```http
POST /api/billing?action=verify-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_id",
  "paymentId": "payment_id",
  "signature": "razorpay_signature",
  "planId": "plan_id"
}
```

---

## 8. Branding API (`/api/branding`)

### Get Public Branding (No Auth)
```http
GET /api/branding?action=public
Host: acme.cloudritz.app
```

### Get Current Branding
```http
GET /api/branding?action=current
Authorization: Bearer <token>
```

### Update Branding (Admin Only)
```http
PUT /api/branding?action=update
Authorization: Bearer <token>
Content-Type: application/json

{
  "branding": {
    "primaryColor": "#2563eb",
    "secondaryColor": "#3b82f6",
    "logoUrl": "https://example.com/logo.png",
    "companyName": "Acme Corp",
    "customDomain": "crm.acme.com",
    "hideCloudiritzBranding": true
  }
}
```

---

## 9. Admin API (`/api/admin`) - Super Admin Only

### Seed Database
```http
GET /api/admin?type=seed
Authorization: Bearer <superadmin_token>
```

### List All Organizations
```http
GET /api/admin?type=organizations
Authorization: Bearer <superadmin_token>
```

### Get Organization Details
```http
GET /api/admin?type=organization&id=<org_id>
Authorization: Bearer <superadmin_token>
```

### Create Organization
```http
POST /api/admin?type=organization
Authorization: Bearer <superadmin_token>
Content-Type: application/json

{
  "name": "New Corp",
  "subdomain": "newcorp",
  "email": "contact@newcorp.com",
  "plan": "professional",
  "adminName": "Admin User",
  "adminEmail": "admin@newcorp.com",
  "adminPassword": "password123"
}
```

### Update Organization
```http
PUT /api/admin?type=organization&id=<org_id>
Authorization: Bearer <superadmin_token>
Content-Type: application/json

{
  "subscription": {
    "plan": "enterprise",
    "status": "active"
  }
}
```

### List Organization Users
```http
GET /api/admin?type=users&organizationId=<org_id>
Authorization: Bearer <superadmin_token>
```

---

## 10. Account API (`/api/account`)

### Get Profile
```http
GET /api/account?action=profile
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /api/account?action=profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+91 98765 43210"
}
```

### Change Password
```http
PUT /api/account?action=password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Rate Limiting
- **Free/Trial**: 100 requests/minute
- **Basic**: 200 requests/minute
- **Professional**: 500 requests/minute
- **Enterprise**: 1000 requests/minute

## Webhooks

### Razorpay Payment Webhook
```http
POST /api/billing?action=webhook
Content-Type: application/json

{
  "event": "payment.success",
  "payload": { ... }
}
```

## Subdomain Routing

Access your organization via subdomain:
- `https://acme.cloudritz.app` - Acme organization
- `https://demo.cloudritz.app` - Demo organization

Custom domains also supported (Enterprise plan).

## Multi-Tenant Architecture

All API requests are automatically scoped to the authenticated user's organization. Data isolation is enforced at the database level using `organizationId` filtering.

## Subscription Limits

API requests are subject to subscription limits:
- **Products**: Max products per plan
- **Invoices**: Max invoices per month
- **Users**: Max users per organization

Exceeding limits returns `403 Forbidden` with appropriate error message.

---

## Support

For API support, contact: support@cloudritz.com

## Changelog

### v1.0.0 (2024)
- Initial API release
- Multi-tenant architecture
- Payment gateway integration
- White-label branding
- Automated billing

---

**Built with ❤️ by Cloudritz Tech**
