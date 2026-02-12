import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  purchasePrice: { type: Number, required: false, default: 0 }, // Store purchase price at time of sale
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['amount', 'percentage'], default: 'amount' },
  taxableValue: { type: Number, default: 0 },
  cgstRate: { type: Number, default: 9 },
  sgstRate: { type: Number, default: 9 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

const paymentEntrySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  method: { type: String, enum: ['cash', 'card', 'upi', 'cheque', 'bank_transfer'], default: 'cash' },
  reference: { type: String },
  notes: { type: String },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: true, timestamps: true });

const invoiceSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  invoiceNumber: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },

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

  deliveryNote: String,
  referenceNo: String,
  buyerOrderNo: String,
  destination: String,
  modeOfPayment: { type: String, default: 'cash' },

  items: [invoiceItemSchema],

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

  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'cheque', 'bank_transfer'], default: 'cash' },
  status: { type: String, enum: ['paid', 'pending', 'cancelled'], default: 'paid' },
  paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'paid' },
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  payments: [paymentEntrySchema],
  paymentDate: { type: Date },
  paymentNotes: { type: String },

  notes: String,
  terms: String,
  dueDate: Date,

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

invoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ organizationId: 1, status: 1 });
invoiceSchema.index({ organizationId: 1, createdAt: -1 });
invoiceSchema.index({ organizationId: 1, customer: 1 });
invoiceSchema.index({ organizationId: 1, paymentStatus: 1 });

// ---------- PRE SAVE ----------
invoiceSchema.pre('save', async function(next) {

  // auto-generate invoice no
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;

    const startOfMonth = new Date(year, date.getMonth(), 1);
    const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);

    const monthCount = await mongoose.model('Invoice').countDocuments({
      organizationId: this.organizationId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    this.invoiceNumber = `${yearMonth}-${String(monthCount + 1).padStart(3, '0')}`;
  }

  const totalAmount = Number(this.grandTotal || this.total || 0);

  // ensure numeric
  this.paidAmount = Number(this.paidAmount || 0);

  // ----- IF USER SELECTED PAID DURING CREATION -----
  if (this.isNew && (this.paymentStatus === 'paid' || this.status === 'paid')) {

    this.paidAmount = totalAmount;
    this.pendingAmount = 0;
    this.paymentStatus = 'paid';
    this.status = 'paid';

    if (!this.paymentDate) this.paymentDate = new Date();

    return next();
  }

  // ----- OTHERWISE — AUTO CALCULATE -----
  if (this.payments && this.payments.length > 0) {
    this.paidAmount = this.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }

  this.pendingAmount = Math.max(totalAmount - this.paidAmount, 0);

  if (this.paidAmount <= 0) {
    this.paymentStatus = 'unpaid';
    this.status = 'pending';
  } else if (this.paidAmount >= totalAmount) {
    this.paymentStatus = 'paid';
    this.status = 'paid';
    this.paidAmount = totalAmount;
    this.pendingAmount = 0;
    if (!this.paymentDate) this.paymentDate = new Date();
  } else {
    this.paymentStatus = 'partial';
    this.status = 'pending';
  }

  next();
});

// Virtual for COGS calculation
invoiceItemSchema.virtual('cogs').get(function() {
  return this.quantity * this.purchasePrice;
});

// keep your method unchanged
invoiceSchema.methods.recalculatePaymentStatus = function() {
  const totalAmount = this.grandTotal || this.total;

  if (this.payments && this.payments.length > 0) {
    this.paidAmount = this.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  } else {
    this.paidAmount = this.paidAmount || 0;
  }

  if (this.paidAmount > totalAmount) {
    this.paidAmount = totalAmount;
  }

  this.pendingAmount = totalAmount - this.paidAmount;

  if (this.paidAmount === 0) {
    this.paymentStatus = 'unpaid';
    this.status = 'pending';
  } else if (this.paidAmount >= totalAmount) {
    this.paymentStatus = 'paid';
    this.status = 'paid';
    this.pendingAmount = 0;
    this.paidAmount = totalAmount;
    if (!this.paymentDate) this.paymentDate = new Date();
  } else {
    this.paymentStatus = 'partial';
    this.status = 'pending';
  }
};

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
export default Invoice;
