import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subdomain: { type: String, required: true, unique: true, lowercase: true },
  email: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  gstin: { type: String },
  state: { type: String },
  stateCode: { type: String },
  logo: { type: String },
  
  // White-label branding
  branding: {
    primaryColor: { type: String, default: '#2563eb' },
    secondaryColor: { type: String, default: '#3b82f6' },
    logoUrl: { type: String },
    faviconUrl: { type: String },
    companyName: { type: String },
    customDomain: { type: String },
    hideCloudiritzBranding: { type: Boolean, default: false }
  },
  
  subscription: {
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    isBlocked: { type: Boolean, default: false },
    blockReason: { type: String },
    quarterlyMaintenanceFee: { type: Number, default: 2999 },
    lastPaymentDate: { type: Date },
    nextPaymentDue: { type: Date },
    maxUsers: { type: Number, default: 5 },
    maxProducts: { type: Number, default: 1000 },
    maxInvoices: { type: Number, default: 500 }
  },
  
  features: {
    whatsappIntegration: { type: Boolean, default: false },
    aiInsights: { type: Boolean, default: false },
    multiCurrency: { type: Boolean, default: false },
    advancedReports: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false }
  },
  
  settings: {
    invoicePrefix: { type: String, default: 'INV' },
    invoiceStartNumber: { type: Number, default: 1001 },
    template: { type: String, default: 'compact' },
    taxRate: { type: Number, default: 18 },
    currency: { type: String, default: 'INR' }
  },
  
  bankDetails: {
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    branch: { type: String },
    upiId: { type: String }
  },
  
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

organizationSchema.index({ subdomain: 1 });
organizationSchema.index({ 'subscription.status': 1 });

export default mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
