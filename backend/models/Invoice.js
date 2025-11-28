const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percentage', 'amount'], default: 'amount' },
  taxableValue: { type: Number, required: true },
  cgstRate: { type: Number, default: 9 },
  sgstRate: { type: Number, default: 9 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  
  // Company Details (auto-filled)
  companyDetails: {
    name: { type: String, default: 'ANVI TILES & DECORHUB' },
    address: { type: String, default: 'Shop No. 123, Tiles Market, Main Road, City Center' },
    gstin: { type: String, default: '09FTIPS4577P1ZD' },
    state: { type: String, default: 'UTTAR PRADESH' },
    stateCode: { type: String, default: '09' },
    email: { type: String, default: 'info@anvitiles.com' },
    mobile: { type: String, default: '+91 9876543210' }
  },
  
  // Buyer Details (from customer)
  buyerDetails: {
    name: String,
    address: String,
    mobile: String,
    gstin: String,
    state: String,
    stateCode: String
  },
  
  // Consignee Details (optional, defaults to buyer)
  consigneeDetails: {
    name: String,
    address: String,
    mobile: String,
    gstin: String,
    state: String,
    stateCode: String
  },
  
  // Invoice Information
  invoiceDate: { type: Date, default: Date.now },
  deliveryNote: String,
  referenceNo: String,
  buyerOrderNo: String,
  dispatchDocNo: String,
  lorryNo: String,
  modeOfPayment: { type: String, enum: ['cash', 'card', 'upi', 'cheque', 'credit'], default: 'cash' },
  destination: String,
  motorVehicleNo: String,
  termsOfDelivery: String,
  
  items: [invoiceItemSchema],
  
  // Totals
  totalTaxableAmount: { type: Number, required: true },
  totalCgst: { type: Number, default: 0 },
  totalSgst: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  amountInWords: String,
  
  // Legacy fields for compatibility
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percentage', 'amount'], default: 'amount' },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'cheque'], default: 'cash' },
  
  status: { type: String, enum: ['paid', 'pending', 'cancelled'], default: 'paid' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pdfPath: String,
  
  // Bank Details
  bankDetails: {
    bankName: { type: String, default: 'HDFC Bank' },
    accountNo: { type: String, default: '50200068337918' },
    ifscCode: { type: String, default: 'HDFC0004331' },
    branch: { type: String, default: 'Main Branch' }
  },
  
  notes: String,
  dueDate: Date,
  terms: String
}, { timestamps: true });

invoiceSchema.pre('save', function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.invoiceNumber = `INV-${year}${month}${day}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);