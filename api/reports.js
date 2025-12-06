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

    if (action === 'sales-reports') {
      return await handleSalesReports(req, res);
    }

    console.log('📊 Fetching comprehensive dashboard statistics...');

    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const Expense = (await import('../lib/models/Expense.js')).default;

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
      topProducts,
      totalExpenses,
      monthlyExpenses
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
      Customer.countDocuments(),
      // Low stock count
      Product.countDocuments({ $expr: { $lte: ["$stock", "$minStock"] } }),
      // Low stock items details
      Product.find({ $expr: { $lte: ["$stock", "$minStock"] } })
        .select('name category stock minStock')
        .limit(10)
        .lean(),
      // Total products
      Product.countDocuments(),
      // Total invoices
      Invoice.countDocuments(),
      // Inventory value
      Product.aggregate([

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
      ]),
      // Total expenses
      Expense.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      // Monthly expenses
      Expense.aggregate([
        { $match: { expenseDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
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
      topProducts: topProducts || [],
      totalExpenses: totalExpenses[0]?.total || 0,
      monthlyExpenses: monthlyExpenses[0]?.total || 0,
      profit: (totalRevenue[0]?.total || 0) - (totalExpenses[0]?.total || 0)
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

async function handleSalesReports(req, res) {
  try {
    console.log('📊 Fetching sales reports with filters...');
    
    const { period, startDate, endDate } = req.query;
    
    // Get IST timezone offset (+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const now = new Date(Date.now() + istOffset);
    
    let filterStartDate, filterEndDate;
    
    if (period === 'custom' && startDate && endDate) {
      filterStartDate = new Date(startDate + 'T00:00:00.000Z');
      filterEndDate = new Date(endDate + 'T23:59:59.999Z');
    } else {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (period) {
        case 'today':
          filterStartDate = today;
          filterEndDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          filterStartDate = yesterday;
          filterEndDate = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1);
          break;
        case 'last7days':
          filterStartDate = new Date(today);
          filterStartDate.setDate(filterStartDate.getDate() - 7);
          filterEndDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
          break;
        case 'thisMonth':
          filterStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
          filterEndDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
          break;
        case 'lastMonth':
          filterStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          filterEndDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
          break;
        case 'thisYear':
          filterStartDate = new Date(today.getFullYear(), 0, 1);
          filterEndDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
          break;
        default:
          filterStartDate = today;
          filterEndDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
      }
    }
    
    console.log('📅 Date filter:', { period, filterStartDate, filterEndDate });
    
    const [salesData, previousPeriodData] = await Promise.all([
      // Current period sales
      Invoice.aggregate([
        { $match: { createdAt: { $gte: filterStartDate, $lte: filterEndDate } } },
        { $group: { 
          _id: null, 
          totalAmount: { $sum: "$total" }, 
          totalOrders: { $sum: 1 },
          averageOrder: { $avg: "$total" }
        }}
      ]),
      // Previous period for growth calculation
      Invoice.aggregate([
        { $match: { 
          createdAt: { 
            $gte: new Date(filterStartDate.getTime() - (filterEndDate.getTime() - filterStartDate.getTime())),
            $lt: filterStartDate
          }
        }},
        { $group: { _id: null, totalAmount: { $sum: "$total" } }}
      ])
    ]);
    
    const currentData = salesData[0] || { totalAmount: 0, totalOrders: 0, averageOrder: 0 };
    const previousData = previousPeriodData[0] || { totalAmount: 0 };
    
    const growthRate = previousData.totalAmount > 0 
      ? ((currentData.totalAmount - previousData.totalAmount) / previousData.totalAmount * 100)
      : 0;
    
    const result = {
      totalAmount: currentData.totalAmount,
      totalOrders: currentData.totalOrders,
      averageOrder: currentData.averageOrder || 0,
      growthRate: growthRate.toFixed(1),
      period: period || 'today',
      dateRange: {
        start: filterStartDate,
        end: filterEndDate
      }
    };
    
    console.log('✅ Sales reports result:', result);
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Sales reports error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch sales reports',
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