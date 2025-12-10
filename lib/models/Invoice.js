import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['amount', 'percentage'], default: 'amount' },
  taxableValue: { type: Number, default: 0 },
  cgstRate: { type: Number, default: 9 },
  sgstRate: { type: Number, default: 9 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  invoiceNumber: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  
  // Buyer & Consignee Details
  buyerDetails: {
    name: String,
    address: String,
    mobile: String,
    gstin: String,
    state: String,
    stateCode: String
  },
  consigneeDetails: {
    name: String,
    address: String,
    mobile: String,
    gstin: String,
    state: String,
    stateCode: String
  },
  
  // Invoice Details
  deliveryNote: String,
  referenceNo: String,
  buyerOrderNo: String,
  destination: String,
  modeOfPayment: { type: String, default: 'cash' },
  
  // Items
  items: [invoiceItemSchema],
  
  // Calculations
  subtotal: { type: Number, default: 0 },
  totalTaxableAmount: { type: Number, default: 0 },
  totalCgst: { type: Number, default: 0 },
  totalSgst: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['amount', 'percentage'], default: 'amount' },
  applyGST: { type: Boolean, default: false },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  total: { type: Number, required: true },
  amountInWords: String,
  
  // Payment tracking
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'cheque'], default: 'cash' },
  status: { type: String, enum: ['paid', 'pending', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['paid', 'pending', 'partial'], default: 'pending' },
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  paymentDate: { type: Date },
  paymentNotes: { type: String },
  
  // Additional
  notes: String,
  terms: String,
  dueDate: Date,
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Compound indexes for multi-tenant isolation and performance
invoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ organizationId: 1, status: 1 });
invoiceSchema.index({ organizationId: 1, createdAt: -1 });
invoiceSchema.index({ organizationId: 1, customer: 1 });
invoiceSchema.index({ organizationId: 1, paymentStatus: 1 });

// Generate unique invoice number and set payment amounts
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;
    
    // Count invoices for current month and organization
    const startOfMonth = new Date(year, date.getMonth(), 1);
    const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);
    
    const monthCount = await mongoose.model('Invoice').countDocuments({
      organizationId: this.organizationId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    this.invoiceNumber = `${yearMonth}-${String(monthCount + 1).padStart(3, '0')}`;
  }
  
  // Auto-calculate payment amounts if not set
  const totalAmount = this.grandTotal || this.total;
  
  if (this.isNew) {
    // New invoice - set initial values
    if (this.paymentStatus === 'paid') {
      this.paidAmount = totalAmount;
      this.pendingAmount = 0;
      this.status = 'paid';
      if (!this.paymentDate) this.paymentDate = new Date();
    } else {
      this.paidAmount = this.paidAmount || 0;
      this.pendingAmount = totalAmount - (this.paidAmount || 0);
      this.status = this.paidAmount > 0 ? 'pending' : 'pending';
    }
  } else {
    // Existing invoice - recalculate pending
    this.pendingAmount = totalAmount - (this.paidAmount || 0);
    
    // Update status based on payment
    if (this.pendingAmount <= 0) {
      this.paymentStatus = 'paid';
      this.status = 'paid';
      this.paidAmount = totalAmount;
      this.pendingAmount = 0;
    } else if (this.paidAmount > 0) {
      this.paymentStatus = 'partial';
      this.status = 'pending';
    } else {
      this.paymentStatus = 'pending';
      this.status = 'pending';
    }
  }
  
  next();
});

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
export default Invoice;