import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  type: { type: String, enum: ['trial_expiry', 'subscription_invoice', 'payment_success', 'payment_failed', 'subscription_expired'], required: true },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  error: { type: String },
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

emailLogSchema.index({ organization: 1, createdAt: -1 });
emailLogSchema.index({ type: 1, sentAt: -1 });

export default mongoose.models.EmailLog || mongoose.model('EmailLog', emailLogSchema);
