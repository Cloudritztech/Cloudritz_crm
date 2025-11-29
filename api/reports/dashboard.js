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
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await connectDB();
  await runMiddleware(req, res, auth);

  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      todaySales,
      totalCustomers,
      lowStockProducts,
      totalProducts,
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
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ["$stock", "$purchasePrice"] } } } }
      ]),
      Invoice.find().populate('customer', 'name').sort({ createdAt: -1 }).limit(5)
    ]);

    const stats = {
      todaySales: todaySales[0] || { total: 0, count: 0 },
      totalCustomers,
      lowStockProducts,
      totalProducts,
      inventoryValue: inventoryValue[0]?.totalValue || 0,
      recentInvoices
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export default function(req, res) {
  return handleCors(req, res, handler);
}