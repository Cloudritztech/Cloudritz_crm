import mongoose from 'mongoose';

const businessProfileSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true,
    default: 'Anvi Tiles & Decorhub'
  },
  ownerName: {
    type: String,
    required: true,
    default: 'Business Owner'
  },
  businessAddress: {
    type: String,
    required: true,
    default: 'Shop No. 123, Tiles Market\nMain Road, City Center\nState: UTTAR PRADESH, 273001'
  },
  gstin: {
    type: String,
    required: true,
    default: '09FTIPS4577P1ZD'
  },
  phone: {
    type: String,
    default: '+91 9876543210'
  },
  email: {
    type: String,
    default: 'info@anvitiles.com'
  },
  // Cloudinary URLs (strings only)
  logoUrl: {
    type: String,
    default: null
  },
  signatureUrl: {
    type: String,
    default: null
  },
  // Bank Details
  bankDetails: {
    bankName: { type: String, default: '' },
    accountNo: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    branch: { type: String, default: '' }
  },
  // UPI Details
  upiId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

export default mongoose.models.BusinessProfile || mongoose.model('BusinessProfile', businessProfileSchema);