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
  invoiceNumber: { type: String, unique: true, sparse: true },
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
  autoDiscount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['amount', 'percentage'], default: 'amount' },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  total: { type: Number, required: true },
  amountInWords: String,
  
  // Payment & Status
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'cheque'], default: 'cash' },
  status: { type: String, enum: ['paid', 'pending', 'cancelled'], default: 'paid' },
  
  // Additional
  notes: String,
  terms: String,
  dueDate: Date,
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Generate unique invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
export default Invoice;