const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  trialDays: {
    type: Number,
    default: 0
  },
  limits: {
    maxUsers: { type: Number, default: 1 },
    maxProducts: { type: Number, default: 100 },
    maxInvoices: { type: Number, default: 50 },
    maxCustomers: { type: Number, default: 100 },
    maxStorage: { type: Number, default: 1024 } // MB
  },
  features: {
    whatsappIntegration: { type: Boolean, default: false },
    aiInsights: { type: Boolean, default: false },
    multiCurrency: { type: Boolean, default: false },
    advancedReports: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    customBranding: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    multiLocation: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  stripePriceId: String,
  razorpayPlanId: String
}, {
  timestamps: true
});

subscriptionPlanSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
