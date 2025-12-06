import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'upi', 'bank', 'card', 'cheque'], 
    required: true 
  },
  paymentDate: { type: Date, required: true },
  transactionId: { type: String },
  notes: { type: String },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

paymentSchema.index({ invoice: 1, customer: 1 });

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export default Payment;
