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
  
  subscription: {
    plan: { type: String, enum: ['trial', 'basic', 'professional', 'enterprise'], default: 'trial' },
    status: { type: String, enum: ['active', 'suspended', 'cancelled', 'expired'], default: 'active' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    maxUsers: { type: Number, default: 2 },
    maxProducts: { type: Number, default: 100 },
    maxInvoices: { type: Number, default: 50 }
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
