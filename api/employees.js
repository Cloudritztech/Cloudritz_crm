import connectDB from '../lib/mongodb.js';
import Employee from '../lib/models/Employee.js';
import { authenticate, tenantIsolation } from '../lib/middleware/tenant.js';

async function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();
    await authenticate(req, res, async () => {
      await tenantIsolation(req, res, async () => {

    const { method, query } = req;

    switch (method) {
      case 'GET':
        if (query.id) {
          const employee = await Employee.findById(query.id);
          if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
          return res.status(200).json({ success: true, employee });
        }
        
        const employees = await Employee.find({ organizationId: req.organizationId }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, employees });

      case 'POST':
        const employee = await Employee.create({ ...req.body, organizationId: req.organizationId, createdBy: req.user._id });
        return res.status(201).json({ success: true, employee });

      case 'PUT':
        if (!query.id) return res.status(400).json({ success: false, message: 'Employee ID required' });
        const updated = await Employee.findByIdAndUpdate(query.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Employee not found' });
        return res.status(200).json({ success: true, employee: updated });

      case 'DELETE':
        if (!query.id) return res.status(400).json({ success: false, message: 'Employee ID required' });
        const deleted = await Employee.findByIdAndDelete(query.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Employee not found' });
        return res.status(200).json({ success: true, message: 'Employee deleted' });

      default:
        return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
    }
      });
    });
  } catch (error) {
    console.error('Employee API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
