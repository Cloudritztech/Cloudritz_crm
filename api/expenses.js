import connectDB from '../lib/mongodb.js';
import Expense from '../lib/models/Expense.js';
import Employee from '../lib/models/Employee.js';
import SalaryHistory from '../lib/models/SalaryHistory.js';
import { auth } from '../lib/middleware/auth.js';

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
    await runMiddleware(req, res, auth);

    const { method, query } = req;

    switch (method) {
      case 'GET':
        if (query.action === 'summary') {
          const { startDate, endDate, type } = query;
          let matchQuery = {};
          
          if (startDate && endDate) {
            matchQuery.expenseDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
          }
          if (type) matchQuery.type = type;

          const summary = await Expense.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
          ]);

          const totalExpenses = await Expense.aggregate([
            { $match: matchQuery },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]);

          return res.status(200).json({
            success: true,
            summary,
            totalExpenses: totalExpenses[0]?.total || 0
          });
        }

        if (query.id) {
          const expense = await Expense.findById(query.id)
            .populate('employee', 'name')
            .populate('product', 'name')
            .populate('createdBy', 'name');
          if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
          return res.status(200).json({ success: true, expense });
        }

        const { startDate, endDate, type } = query;
        let filter = {};
        if (startDate && endDate) {
          filter.expenseDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (type) filter.type = type;

        const expenses = await Expense.find(filter)
          .populate({ path: 'employee', select: 'name', strictPopulate: false })
          .populate({ path: 'product', select: 'name', strictPopulate: false })
          .populate({ path: 'createdBy', select: 'name', strictPopulate: false })
          .sort({ expenseDate: -1 })
          .lean();
        
        return res.status(200).json({ success: true, expenses });

      case 'POST':
        const { type, employee: employeeId, amount, expenseDate, paymentMethod } = req.body;

        // Handle salary payment
        if (type === 'salary' && employeeId) {
          const employee = await Employee.findById(employeeId);
          if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

          const date = new Date(expenseDate);
          const month = date.getMonth() + 1;
          const year = date.getFullYear();

          // Check duplicate
          const existing = await SalaryHistory.findOne({ employee: employeeId, month, year });
          if (existing) {
            return res.status(400).json({ success: false, message: 'Salary already paid for this month' });
          }

          const expense = await Expense.create({
            ...req.body,
            createdBy: req.user._id
          });

          await SalaryHistory.create({
            employee: employeeId,
            amount,
            month,
            year,
            paymentDate: expenseDate,
            paymentMethod,
            expense: expense._id,
            paidBy: req.user._id
          });

          return res.status(201).json({ success: true, expense });
        }

        const expense = await Expense.create({ ...req.body, createdBy: req.user._id });
        return res.status(201).json({ success: true, expense });

      case 'PUT':
        if (!query.id) return res.status(400).json({ success: false, message: 'Expense ID required' });
        const updated = await Expense.findByIdAndUpdate(query.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Expense not found' });
        return res.status(200).json({ success: true, expense: updated });

      case 'DELETE':
        if (!query.id) return res.status(400).json({ success: false, message: 'Expense ID required' });
        const deleted = await Expense.findByIdAndDelete(query.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Expense not found' });
        
        // Delete salary history if it's a salary expense
        if (deleted.type === 'salary') {
          await SalaryHistory.deleteOne({ expense: query.id });
        }
        
        return res.status(200).json({ success: true, message: 'Expense deleted' });

      default:
        return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Expense API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
