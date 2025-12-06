import mongoose from 'mongoose';

const salaryHistorySchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  amount: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  paymentDate: { type: Date, required: true },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'bank', 'card'], default: 'bank' },
  expense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

salaryHistorySchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

const SalaryHistory = mongoose.models.SalaryHistory || mongoose.model('SalaryHistory', salaryHistorySchema);
export default SalaryHistory;
