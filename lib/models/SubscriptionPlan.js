import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  
  limits: {
    maxUsers: { type: Number, required: true },
    maxProducts: { type: Number, required: true },
    maxInvoices: { type: Number, required: true },
    maxCustomers: { type: Number, required: true },
    storageGB: { type: Number, default: 5 }
  },
  
  features: {
    whatsappIntegration: { type: Boolean, default: false },
    aiInsights: { type: Boolean, default: false },
    multiCurrency: { type: Boolean, default: false },
    advancedReports: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false }
  },
  
  trialDays: { type: Number, default: 14 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
