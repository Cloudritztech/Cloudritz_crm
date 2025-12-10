const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  organizationName: String,
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan'
  },
  planName: String,
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'stripe', 'manual', 'bank_transfer'],
    default: 'razorpay'
  },
  paymentGateway: {
    orderId: String,
    paymentId: String,
    signature: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['subscription', 'upgrade', 'renewal', 'addon'],
    default: 'subscription'
  },
  billingPeriod: {
    startDate: Date,
    endDate: Date
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionInvoice'
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    notes: String
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date,
  failureReason: String
}, {
  timestamps: true
});

paymentSchema.index({ organizationId: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ 'paymentGateway.orderId': 1 });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
