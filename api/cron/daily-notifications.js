import connectDB from '../../lib/mongodb.js';
import Notification from '../../lib/models/Notification.js';
import Invoice from '../../lib/models/Invoice.js';
import Product from '../../lib/models/Product.js';
import Customer from '../../lib/models/Customer.js';
import User from '../../lib/models/User.js';
import { generateDailyInsights } from '../../lib/notificationGenerator.js';

export default async function handler(req, res) {
  const cronSecret = req.headers['x-vercel-cron-secret'] || req.query.secret;
  if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await connectDB();
    const Expense = (await import('../../lib/models/Expense.js')).default;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const users = await User.find({ status: { $ne: 'inactive' } });
    
    for (const user of users) {
      const [todaySales, weeklySales, monthlySales, customers, lowStock, pending, expenses] = await Promise.all([
        Invoice.aggregate([{ $match: { createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
        Invoice.aggregate([{ $match: { createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
        Invoice.aggregate([{ $match: { createdAt: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
        Customer.countDocuments(),
        Product.countDocuments({ $expr: { $lte: ['$stock', '$minStock'] } }),
        Invoice.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
        Expense.aggregate([{ $match: { expenseDate: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) } } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
      ]);

      const businessData = {
        todaySales: todaySales[0]?.total || 0,
        weeklySales: weeklySales[0]?.total || 0,
        monthlySales: monthlySales[0]?.total || 0,
        totalCustomers: customers,
        lowStockCount: lowStock,
        pendingPayments: pending[0]?.total || 0,
        totalExpenses: expenses[0]?.total || 0,
        profitMargin: ((monthlySales[0]?.total || 0) - (expenses[0]?.total || 0)) / (monthlySales[0]?.total || 1) * 100
      };

      const aiNotifications = await generateDailyInsights(businessData);
      
      await Notification.deleteMany({ userId: user._id, category: 'ai-insight', createdAt: { $lt: today } });
      await Notification.insertMany(aiNotifications.map(n => ({ ...n, userId: user._id, category: 'ai-insight', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) })));
    }

    return res.status(200).json({ success: true, message: `Generated for ${users.length} users` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
