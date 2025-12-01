import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // Base price per unit
  total: { type: Number, required: true } // quantity * price
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  
  items: [invoiceItemSchema],
  
  // GST Configuration
  gstEnabled: { type: Boolean, default: false }, // Toggle for GST
  gstCompensated: { type: Boolean, default: false }, // Auto-discount to compensate GST
  
  // Calculation Fields
  subtotal: { type: Number, required: true }, // Sum of all items (before GST/discount)
  
  // GST Breakdown (only if gstEnabled = true)
  cgst: { type: Number, default: 0 }, // 9% of subtotal
  sgst: { type: Number, default: 0 }, // 9% of subtotal
  totalGst: { type: Number, default: 0 }, // cgst + sgst
  
  // Discount
  manualDiscount: { type: Number, default: 0 }, // User-entered discount
  autoDiscount: { type: Number, default: 0 }, // Auto-applied to compensate GST
  totalDiscount: { type: Number, default: 0 }, // manualDiscount + autoDiscount
  
  // Final Total
  total: { type: Number, required: true }, // subtotal + totalGst - totalDiscount
  
  // Payment & Status
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'cheque'], default: 'cash' },
  status: { type: String, enum: ['paid', 'pending', 'cancelled'], default: 'paid' },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Auto-generate invoice number
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

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
export default Invoice;