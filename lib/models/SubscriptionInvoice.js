import mongoose from 'mongoose';

const subscriptionInvoiceSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  plan: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  billingPeriod: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled'], default: 'pending' },
  paymentMethod: { type: String },
  paymentId: { type: String },
  paidAt: { type: Date },
  dueDate: { type: Date, required: true }
}, { timestamps: true });

subscriptionInvoiceSchema.index({ organization: 1, createdAt: -1 });
subscriptionInvoiceSchema.index({ status: 1, dueDate: 1 });

export default mongoose.models.SubscriptionInvoice || mongoose.model('SubscriptionInvoice', subscriptionInvoiceSchema);
