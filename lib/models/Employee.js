import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const employeeSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  salary: { type: Number, required: true },
  joiningDate: { type: Date, required: true },
  department: { type: String, required: true },
  role: { type: String, enum: ['employee'], default: 'employee' },
  
  // Granular permissions
  permissions: {
    invoiceCreate: { type: Boolean, default: true },
    invoiceView: { type: Boolean, default: true },
    invoiceEdit: { type: Boolean, default: false },
    invoiceDelete: { type: Boolean, default: false },
    expenseCreate: { type: Boolean, default: true },
    expenseView: { type: Boolean, default: true },
    expenseEdit: { type: Boolean, default: false },
    expenseDelete: { type: Boolean, default: false },
    customerCreate: { type: Boolean, default: true },
    customerView: { type: Boolean, default: true },
    customerEdit: { type: Boolean, default: false },
    productView: { type: Boolean, default: true },
    productCreate: { type: Boolean, default: false },
    dashboardAccess: { type: Boolean, default: false },
    reportAccess: { type: Boolean, default: false },
    analyticsAccess: { type: Boolean, default: false },
    settingsAccess: { type: Boolean, default: false }
  },
  
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Compound indexes for multi-tenant isolation
employeeSchema.index({ organizationId: 1, status: 1 });
employeeSchema.index({ organizationId: 1, email: 1 }, { unique: true });
employeeSchema.index({ organizationId: 1, createdAt: -1 });

// Hash password before save
employeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
employeeSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
export default Employee;
