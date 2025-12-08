import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: '' },
  settings: {
    invoicePrefix: { type: String, default: 'INV' },
    invoiceStartNumber: { type: Number, default: 1001 },
    template: { type: String, default: 'compact' },
    termsAndConditions: { type: String, default: 'Payment due within 30 days.\nGoods once sold will not be taken back.\nSubject to local jurisdiction.' },
    footerNote: { type: String, default: 'Thank you for your business!' },
    showLogo: { type: Boolean, default: true },
    showBankDetails: { type: Boolean, default: true },
    showSignature: { type: Boolean, default: true },
    taxRate: { type: Number, default: 18 }
  },
  businessProfile: {
    businessName: String,
    address: String,
    phone: String,
    email: String,
    gstin: String,
    state: String,
    stateCode: String,
    logo: String,
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    branch: String
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);