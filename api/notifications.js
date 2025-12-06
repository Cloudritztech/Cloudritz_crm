import connectDB from '../lib/mongodb.js';
import Notification from '../lib/models/Notification.js';
import Invoice from '../lib/models/Invoice.js';
import Product from '../lib/models/Product.js';
import Customer from '../lib/models/Customer.js';
import Expense from '../lib/models/Expense.js';
import { auth } from '../lib/middleware/auth.js';
import { generateDailyInsights } from '../lib/notificationGenerator.js';

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
        if (query.action === 'generate-daily') {
          return await generateDaily(req, res);
        }
        
        if (query.action === 'unread-count') {
          const count = await Notification.countDocuments({ 
            userId: req.user._id, 
            isRead: false 
          });
          return res.status(200).json({ success: true, count });
        }

        const { limit = 20, unreadOnly } = query;
        const filter = { userId: req.user._id };
        if (unreadOnly === 'true') filter.isRead = false;

        const notifications = await Notification.find(filter)
          .sort({ createdAt: -1 })
          .limit(parseInt(limit));
        
        return res.status(200).json({ success: true, notifications });

      case 'POST':
        const notification = await Notification.create({
          ...req.body,
          userId: req.user._id
        });
        return res.status(201).json({ success: true, notification });

      case 'PUT':
        if (query.action === 'mark-read') {
          const { id } = query;
          if (id === 'all') {
            await Notification.updateMany(
              { userId: req.user._id, isRead: false },
              { isRead: true, readAt: new Date() }
            );
            return res.status(200).json({ success: true, message: 'All marked as read' });
          }
          
          const updated = await Notification.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            { isRead: true, readAt: new Date() },
            { new: true }
          );
          return res.status(200).json({ success: true, notification: updated });
        }
        break;

      case 'DELETE':
        if (query.id === 'all') {
          await Notification.deleteMany({ userId: req.user._id });
          return res.status(200).json({ success: true, message: 'All deleted' });
        }
        
        await Notification.findOneAndDelete({ _id: query.id, userId: req.user._id });
        return res.status(200).json({ success: true, message: 'Deleted' });

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Notification API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function generateDaily(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [todaySales, weeklySales, monthlySales, customers, lowStock, pending, expenses] = await Promise.all([
      Invoice.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Invoice.aggregate([
        { $match: { createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Invoice.aggregate([
        { $match: { createdAt: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Customer.countDocuments(),
      Product.countDocuments({ $expr: { $lte: ['$stock', '$minStock'] } }),
      Invoice.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Expense.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
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
    
    // Delete old AI insights
    await Notification.deleteMany({
      userId: req.user._id,
      category: 'ai-insight',
      createdAt: { $lt: today }
    });

    // Create new notifications
    const created = await Notification.insertMany(
      aiNotifications.map(n => ({
        ...n,
        userId: req.user._id,
        category: 'ai-insight',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }))
    );

    return res.status(200).json({ 
      success: true, 
      notifications: created,
      message: `Generated ${created.length} AI insights`
    });
  } catch (error) {
    console.error('Daily generation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
