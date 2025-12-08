import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  totalPurchases: { type: Number, default: 0 },
  lastPurchaseDate: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

customerSchema.index({ organizationId: 1, phone: 1 }, { unique: true });
customerSchema.index({ organizationId: 1, isActive: 1 });

export default mongoose.models.Customer || mongoose.model('Customer', customerSchema);