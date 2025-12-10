import mongoose from 'mongoose';

const subscriptionInvoiceSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  plan: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  billingPeriod: {
    startDate: Date,
    endDate: Date
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  paidAt: Date
}, {
  timestamps: true
});

subscriptionInvoiceSchema.index({ organizationId: 1, createdAt: -1 });
subscriptionInvoiceSchema.index({ invoiceNumber: 1 });

export default mongoose.models.SubscriptionInvoice || mongoose.model('SubscriptionInvoice', subscriptionInvoiceSchema);
