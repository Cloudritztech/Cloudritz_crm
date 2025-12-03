# Settings API Documentation

## Overview
Complete API endpoints for CRM Settings module with MongoDB backend.

---

## API Endpoints

### 1. General Settings
```
GET    /api/settings/general
PUT    /api/settings/general
POST   /api/settings/upload-logo
```

**Schema:**
```json
{
  "companyName": "string",
  "email": "string",
  "phone": "string",
  "website": "string",
  "address": "string",
  "logo": "string (URL)",
  "autoSave": "boolean",
  "soundEffects": "boolean"
}
```

---

### 2. Appearance Settings
```
GET    /api/settings/appearance
PUT    /api/settings/appearance
```

**Schema:**
```json
{
  "theme": "light | dark | system",
  "accentColor": "string (hex)",
  "sidebarStyle": "expanded | collapsed",
  "fontSize": "small | medium | large"
}
```

---

### 3. Business Settings
```
GET    /api/settings/business
PUT    /api/settings/business
```

**Schema:**
```json
{
  "gstin": "string (validated)",
  "pan": "string (validated)",
  "businessType": "string",
  "registeredAddress": "string",
  "bankName": "string",
  "accountNumber": "string",
  "ifscCode": "string",
  "accountHolderName": "string",
  "upiId": "string"
}
```

**Validation:**
- GSTIN: `/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/`
- PAN: `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/`

---

### 4. Invoice Settings
```
GET    /api/settings/invoice
PUT    /api/settings/invoice
```

**Schema:**
```json
{
  "prefix": "string",
  "startingNumber": "number",
  "autoIncrement": "boolean",
  "termsAndConditions": "string",
  "footerNote": "string",
  "showLogo": "boolean",
  "showBankDetails": "boolean",
  "showSignature": "boolean"
}
```

---

### 5. Tax Settings
```
GET    /api/settings/tax
PUT    /api/settings/tax
```

**Schema:**
```json
{
  "taxIncluded": "boolean",
  "gstRates": [
    { "id": "number", "name": "string", "rate": "number" }
  ],
  "hsnCodes": [
    { "id": "number", "code": "string", "description": "string", "rate": "number" }
  ]
}
```

---

### 6. Product Settings
```
GET    /api/settings/product
PUT    /api/settings/product
```

**Schema:**
```json
{
  "defaultUnit": "string",
  "lowStockThreshold": "number",
  "maxImageSize": "number (MB)",
  "allowNegativeStock": "boolean",
  "autoCalculatePurchasePrice": "boolean",
  "showStockValue": "boolean"
}
```

---

### 7. Notification Settings
```
GET    /api/settings/notifications
PUT    /api/settings/notifications
```

**Schema:**
```json
{
  "lowStockEmail": "boolean",
  "lowStockSMS": "boolean",
  "newOrderEmail": "boolean",
  "newOrderSMS": "boolean",
  "paymentReceivedEmail": "boolean",
  "paymentReceivedSMS": "boolean",
  "customerMessageEmail": "boolean",
  "customerMessageSMS": "boolean",
  "soundAlerts": "boolean",
  "desktopNotifications": "boolean"
}
```

---

### 8. Backup Settings
```
GET    /api/settings/backup
PUT    /api/settings/backup
POST   /api/settings/backup/export
POST   /api/settings/backup/import
GET    /api/settings/backup/history
```

**Schema:**
```json
{
  "autoBackup": "boolean",
  "backupFrequency": "hourly | daily | weekly | monthly",
  "cloudBackup": "boolean",
  "cloudProvider": "google | dropbox | onedrive"
}
```

---

### 9. Integration Settings
```
GET    /api/settings/integrations
PUT    /api/settings/integrations
POST   /api/settings/integrations/test-email
```

**Schema:**
```json
{
  "whatsapp": {
    "enabled": "boolean",
    "apiKey": "string",
    "phoneNumber": "string"
  },
  "smtp": {
    "enabled": "boolean",
    "host": "string",
    "port": "number",
    "username": "string",
    "password": "string (encrypted)",
    "fromEmail": "string"
  },
  "cloudStorage": {
    "enabled": "boolean",
    "provider": "google | dropbox | onedrive",
    "apiKey": "string"
  }
}
```

---

### 10. Security Settings
```
GET    /api/settings/security
PUT    /api/settings/security
POST   /api/settings/security/change-password
GET    /api/settings/security/login-activity
```

**Schema:**
```json
{
  "twoFactorEnabled": "boolean",
  "sessionTimeout": "number (minutes)",
  "loginActivity": [
    {
      "date": "string",
      "device": "string",
      "location": "string",
      "status": "Success | Failed"
    }
  ]
}
```

---

## MongoDB Schema

```javascript
const settingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  general: {
    companyName: String,
    email: String,
    phone: String,
    website: String,
    address: String,
    logo: String,
    autoSave: { type: Boolean, default: true },
    soundEffects: { type: Boolean, default: true }
  },
  appearance: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    accentColor: { type: String, default: '#3B82F6' }
  },
  business: {
    gstin: String,
    pan: String,
    businessType: String,
    registeredAddress: String,
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    upiId: String
  },
  invoice: {
    prefix: { type: String, default: 'INV' },
    startingNumber: { type: Number, default: 1001 },
    autoIncrement: { type: Boolean, default: true },
    termsAndConditions: String,
    footerNote: String,
    showLogo: { type: Boolean, default: true },
    showBankDetails: { type: Boolean, default: true },
    showSignature: { type: Boolean, default: true }
  },
  tax: {
    taxIncluded: { type: Boolean, default: true },
    gstRates: [{ id: Number, name: String, rate: Number }],
    hsnCodes: [{ id: Number, code: String, description: String, rate: Number }]
  },
  product: {
    defaultUnit: { type: String, default: 'piece' },
    lowStockThreshold: { type: Number, default: 10 },
    maxImageSize: { type: Number, default: 2 },
    allowNegativeStock: { type: Boolean, default: false },
    autoCalculatePurchasePrice: { type: Boolean, default: true },
    showStockValue: { type: Boolean, default: true }
  },
  notifications: {
    lowStockEmail: { type: Boolean, default: true },
    lowStockSMS: { type: Boolean, default: false },
    newOrderEmail: { type: Boolean, default: true },
    newOrderSMS: { type: Boolean, default: true },
    paymentReceivedEmail: { type: Boolean, default: true },
    paymentReceivedSMS: { type: Boolean, default: false },
    customerMessageEmail: { type: Boolean, default: true },
    customerMessageSMS: { type: Boolean, default: false },
    soundAlerts: { type: Boolean, default: true },
    desktopNotifications: { type: Boolean, default: true }
  },
  backup: {
    autoBackup: { type: Boolean, default: true },
    backupFrequency: { type: String, enum: ['hourly', 'daily', 'weekly', 'monthly'], default: 'daily' },
    cloudBackup: { type: Boolean, default: false },
    cloudProvider: String
  },
  integrations: {
    whatsapp: {
      enabled: { type: Boolean, default: false },
      apiKey: String,
      phoneNumber: String
    },
    smtp: {
      enabled: { type: Boolean, default: false },
      host: String,
      port: Number,
      username: String,
      password: String,
      fromEmail: String
    },
    cloudStorage: {
      enabled: { type: Boolean, default: false },
      provider: String,
      apiKey: String
    }
  },
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 30 }
  }
}, { timestamps: true });
```

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": "Validation error message"
  }
}
```

**HTTP Status Codes:**
- 200: Success
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

---

## Authentication

All settings endpoints require JWT authentication:

```
Authorization: Bearer <token>
```

---

## Rate Limiting

- 100 requests per 15 minutes per user
- Logo upload: 10 requests per hour
- Backup export: 5 requests per hour
