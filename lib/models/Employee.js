import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  salary: { type: Number, required: true },
  joiningDate: { type: Date, required: true },
  department: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Compound indexes for multi-tenant isolation
employeeSchema.index({ organizationId: 1, status: 1 });
employeeSchema.index({ organizationId: 1, email: 1 }, { unique: true });
employeeSchema.index({ organizationId: 1, createdAt: -1 });

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
export default Employee;
