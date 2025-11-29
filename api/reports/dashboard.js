import connectDB from '../../lib/mongodb.js';
import Invoice from '../../lib/models/Invoice.js';
import Customer from '../../lib/models/Customer.js';
import Product from '../../lib/models/Product.js';
import { auth } from '../../lib/middleware/auth.js';
import { handleCors } from '../../lib/cors.js';

async function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        message: 'Method not allowed' 
      });
    }

    await connectDB();
    await runMiddleware(req, res, auth);

    console.log('📊 Fetching dashboard statistics...');

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      todaySales,
      totalCustomers,
      lowStockProducts,
      totalProducts,
      totalInvoices,
      inventoryValue,
      recentInvoices
    ] = await Promise.all([
      Invoice.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      Customer.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, $expr: { $lte: ["$stock", "$minStock"] } }),
      Product.countDocuments({ isActive: true }),
      Invoice.countDocuments(),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ["$stock", "$purchasePrice"] } } } }
      ]),
      Invoice.find()
        .populate('customer', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    const stats = {
      todaySales: todaySales[0] || { total: 0, count: 0 },
      totalCustomers: totalCustomers || 0,
      totalInvoices: totalInvoices || 0,
      lowStockProducts: lowStockProducts || 0,
      totalProducts: totalProducts || 0,
      inventoryValue: inventoryValue[0]?.totalValue || 0,
      recentInvoices: recentInvoices || []
    };

    console.log('✅ Dashboard stats:', stats);

    return res.status(200).json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message 
    });
  }
}

export default function(req, res) {
  return handleCors(req, res, handler);
}