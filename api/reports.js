import connectDB from '../lib/mongodb.js';
import Invoice from '../lib/models/Invoice.js';
import Customer from '../lib/models/Customer.js';
import Product from '../lib/models/Product.js';
import User from '../lib/models/User.js';
import { auth } from '../lib/middleware/auth.js';

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        message: 'Method not allowed' 
      });
    }

    await connectDB();
    await runMiddleware(req, res, auth);

    const { action } = req.query;

    if (action === 'sales-analytics') {
      return await handleSalesAnalytics(req, res);
    }

    console.log('📊 Fetching comprehensive dashboard statistics...');

    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todaySales,
      weeklySales,
      monthlySales,
      totalRevenue,
      totalCustomers,
      lowStockProducts,
      lowStockItems,
      totalProducts,
      totalInvoices,
      inventoryValue,
      recentInvoices,
      pendingPayments,
      totalTilesSold,
      topProducts
    ] = await Promise.all([
      // Today's sales
      Invoice.aggregate([
        { $match: { createdAt: { $gte: today, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      // Weekly sales
      Invoice.aggregate([
        { $match: { createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      // Monthly sales
      Invoice.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      // Total revenue
      Invoice.aggregate([
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]),
      // Total customers
      Customer.countDocuments({ isActive: true }),
      // Low stock count
      Product.countDocuments({ isActive: true, $expr: { $lte: ["$stock", "$minStock"] } }),
      // Low stock items details
      Product.find({ isActive: true, $expr: { $lte: ["$stock", "$minStock"] } })
        .select('name category stock minStock')
        .limit(10)
        .lean(),
      // Total products
      Product.countDocuments({ isActive: true }),
      // Total invoices
      Invoice.countDocuments(),
      // Inventory value
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ["$stock", "$purchasePrice"] } } } }
      ]),
      // Recent invoices
      Invoice.find()
        .populate('customer', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      // Pending payments
      Invoice.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      // Total tiles sold (from tiles category)
      Invoice.aggregate([
        { $unwind: "$items" },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
        { $unwind: "$product" },
        { $match: { "product.category": "tiles" } },
        { $group: { _id: null, totalQuantity: { $sum: "$items.quantity" } } }
      ]),
      // Top selling products
      Invoice.aggregate([
        { $unwind: "$items" },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
        { $unwind: "$product" },
        { $group: {
          _id: "$items.product",
          name: { $first: "$product.name" },
          category: { $first: "$product.category" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
        }},
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
      ])
    ]);

    const stats = {
      todaySales: todaySales[0] || { total: 0, count: 0 },
      weeklySales: weeklySales[0] || { total: 0, count: 0 },
      monthlySales: monthlySales[0] || { total: 0, count: 0 },
      totalRevenue: totalRevenue[0]?.total || 0,
      totalCustomers: totalCustomers || 0,
      totalInvoices: totalInvoices || 0,
      lowStockProducts: lowStockProducts || 0,
      lowStockItems: lowStockItems || [],
      totalProducts: totalProducts || 0,
      inventoryValue: inventoryValue[0]?.totalValue || 0,
      recentInvoices: recentInvoices || [],
      pendingPayments: pendingPayments[0]?.total || 0,
      pendingCount: pendingPayments[0]?.count || 0,
      totalTilesSold: totalTilesSold[0]?.totalQuantity || 0,
      topProducts: topProducts || []
    };

    console.log('✅ Comprehensive dashboard stats:', stats);

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

async function handleSalesAnalytics(req, res) {
  try {
    console.log('📈 Fetching sales analytics...');
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [todayData, yesterdayData] = await Promise.all([
      Invoice.aggregate([
        { $match: { createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)), $lte: new Date(today.setHours(23, 59, 59, 999)) } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      Invoice.aggregate([
        { $match: { createdAt: { $gte: new Date(yesterday.setHours(0, 0, 0, 0)), $lte: new Date(yesterday.setHours(23, 59, 59, 999)) } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ])
    ]);
    
    const todayTotal = todayData[0]?.total || 0;
    const yesterdayTotal = yesterdayData[0]?.total || 0;
    const percentChange = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal * 100) : 0;
    
    return res.status(200).json({
      success: true,
      todayVsYesterday: {
        today: todayTotal,
        yesterday: yesterdayTotal,
        percentChange: percentChange.toFixed(1)
      }
    });
  } catch (error) {
    console.error('❌ Sales analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch sales analytics',
      error: error.message
    });
  }
}