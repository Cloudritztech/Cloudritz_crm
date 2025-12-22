import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: function() { return this.role !== 'superadmin'; } },
  name: { type: String, required: true },
  email: { type: String, required: true },
  username: { type: String },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'manager', 'staff'], default: 'staff' },
  profileImage: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
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
}, { timestamps: true });

userSchema.index({ organizationId: 1, email: 1 }, { unique: true, sparse: true });
userSchema.index({ organizationId: 1, username: 1 }, { unique: true, sparse: true });
userSchema.index({ organizationId: 1, phone: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1, role: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { userId: this._id, organizationId: this.organizationId, role: this.role, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

export default mongoose.models.User || mongoose.model('User', userSchema);