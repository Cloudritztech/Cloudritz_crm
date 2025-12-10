import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  title: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['salary', 'rent', 'utilities', 'travel', 'marketing', 'purchase', 'miscellaneous']
  },
  description: { type: String },
  amount: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'upi', 'bank', 'card'], 
    default: 'cash' 
  },
  expenseDate: { type: Date, required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  referenceFile: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Compound indexes for multi-tenant isolation
expenseSchema.index({ organizationId: 1, expenseDate: -1 });
expenseSchema.index({ organizationId: 1, type: 1 });
expenseSchema.index({ organizationId: 1, createdAt: -1 });

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
export default Expense;
