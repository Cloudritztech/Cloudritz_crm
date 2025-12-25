import connectDB from '../lib/mongodb.js';
import Invoice from '../lib/models/Invoice.js';
import Customer from '../lib/models/Customer.js';
import Product from '../lib/models/Product.js';
import User from '../lib/models/User.js';
import { authenticate, tenantIsolation } from '../lib/middleware/tenant.js';
import { notifyPendingPayments } from '../lib/services/notificationService.js';

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

  await connectDB();
  
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        message: 'Method not allowed' 
      });
    }

    await authenticate(req, res, async () => {
      await tenantIsolation(req, res, async () => {
        try {

    const { action } = req.query;

    if (action === 'sales-analytics') {
      return await handleSalesAnalytics(req, res);
    }

    if (action === 'sales-reports') {
      return await handleSalesReports(req, res);
    }

    if (action === 'financial-trends') {
      return await handleFinancialTrends(req, res);
    }

    if (action === 'gst-summary') {
      return await handleGSTSummary(req, res);
    }

    // Dashboard statistics

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
      totalItemSold,
      topProducts,
      totalExpenses,
      monthlyExpenses
    ] = await Promise.all([
      // Today's sales
      Invoice.aggregate([
        { $match: { organizationId: req.organizationId, createdAt: { $gte: today, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      // Weekly sales
      Invoice.aggregate([
        { $match: { organizationId: req.organizationId, createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      // Monthly sales
      Invoice.aggregate([
        { $match: { organizationId: req.organizationId, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      // Total revenue
      Invoice.aggregate([
        { $match: { organizationId: req.organizationId } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]),
      // Total customers
      Customer.countDocuments({ organizationId: req.organizationId }),
      // Low stock count
      Product.countDocuments({ organizationId: req.organizationId, $expr: { $lte: ["$stock", "$lowStockLimit"] } }),
      // Low stock items details
      Product.find({ organizationId: req.organizationId, $expr: { $lte: ["$stock", "$lowStockLimit"] } })
        .select('name category stock lowStockLimit')
        .sort({ stock: 1 })
        .limit(20)
        .lean(),
      // Total products
      Product.countDocuments({ organizationId: req.organizationId }),
      // Total invoices
      Invoice.countDocuments({ organizationId: req.organizationId }),
      // Inventory value
      Product.aggregate([
        { $match: { organizationId: req.organizationId } },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ["$stock", "$purchasePrice"] } } } }
      ]),
      // Recent invoices
      Invoice.find({ organizationId: req.organizationId })
        .populate('customer', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      // Pending payments - FIXED: Sum pendingAmount instead of total
      Invoice.aggregate([
        { $match: { 
          organizationId: req.organizationId, 
          paymentStatus: { $in: ['unpaid', 'partial'] } 
        }},
        { $group: { 
          _id: null, 
          totalPending: { $sum: "$pendingAmount" }, 
          count: { $sum: 1 } 
        }}
      ]),
      // Total tiles sold (from tiles category)
      Invoice.aggregate([
        { $match: { organizationId: req.organizationId } },
        { $unwind: "$items" },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
        { $unwind: "$product" },
        { $match: { "product.category": "tiles" } },
        { $group: { _id: null, totalQuantity: { $sum: "$items.quantity" } } }
      ]),
      // Top selling products
      Invoice.aggregate([
        { $match: { organizationId: req.organizationId } },
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
      // Total expenses (all time)
      Expense.aggregate([
        { $match: { organizationId: req.organizationId } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      // Monthly expenses (filtered by date)
      Expense.aggregate([
        { $match: { organizationId: req.organizationId, expenseDate: { $gte: startOfMonth, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    const stats = {
      todaySales: todaySales[0] || { total: 0, count: 0 },
      weeklySales: weeklySales[0] || { total: 0, count: 0 },
      monthlySales: monthlySales[0] || { total: 0, count: 0 },
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlySales[0]?.total || 0,
      totalCustomers: totalCustomers || 0,
      totalInvoices: totalInvoices || 0,
      lowStockProducts: lowStockProducts || 0,
      lowStockItems: lowStockItems || [],
      totalProducts: totalProducts || 0,
      inventoryValue: inventoryValue[0]?.totalValue || 0,
      recentInvoices: recentInvoices || [],
      pendingPayments: pendingPayments[0]?.totalPending || 0,
      pendingCount: pendingPayments[0]?.count || 0,
      totalItemSold: totalItemSold[0]?.totalQuantity || 0,
      topProducts: topProducts || [],
      totalExpenses: totalExpenses[0]?.total || 0,
      monthlyExpenses: monthlyExpenses[0]?.total || 0,
      profit: (totalRevenue[0]?.total || 0) - (totalExpenses[0]?.total || 0),
      // Note: This dashboard profit is simplified. Use Sales Reports for accurate COGS-based calculations.
    };

    // Dashboard stats ready

    // Send notification for pending payments
    if (pendingPayments[0]?.count > 0) {
      const pendingInvoices = await Invoice.find({ 
        organizationId: req.organizationId, 
        paymentStatus: { $in: ['unpaid', 'partial'] } 
      }).select('_id invoiceNumber pendingAmount').limit(10).lean();
      
      notifyPendingPayments(req.organizationId, pendingInvoices).catch(err => 
        console.warn('Failed to send pending payment notification:', err)
      );
    }

    return res.status(200).json({ 
      success: true, 
      stats 
    });
        } catch (innerError) {
          console.error('❌ Dashboard inner error:', innerError);
          return res.status(500).json({ 
            success: false,
            message: 'Failed to fetch dashboard data',
            error: innerError.message 
          });
        }
      });
    });
  } catch (error) {
    console.error('❌ Reports API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
}

async function handleSalesReports(req, res) {
  try {
    // Sales reports calculation
    
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
    
    // Date filter applied
    
    const Expense = (await import('../lib/models/Expense.js')).default;
    
    const [salesData, previousPeriodData, expensesData, cogsData] = await Promise.all([
      // Current period sales (Revenue)
      Invoice.aggregate([
        { $match: { organizationId: req.organizationId, createdAt: { $gte: filterStartDate, $lte: filterEndDate } } },
        { $group: { 
          _id: null, 
          totalRevenue: { $sum: "$total" }, 
          totalOrders: { $sum: 1 },
          averageOrder: { $avg: "$total" }
        }}
      ]),
      // Previous period for growth calculation
      Invoice.aggregate([
        { $match: { 
          organizationId: req.organizationId,
          createdAt: { 
            $gte: new Date(filterStartDate.getTime() - (filterEndDate.getTime() - filterStartDate.getTime())),
            $lt: filterStartDate
          }
        }},
        { $group: { _id: null, totalRevenue: { $sum: "$total" } }}
      ]),
      // Extra Expenses (operational costs only)
      Expense.aggregate([
        { $match: { organizationId: req.organizationId, expenseDate: { $gte: filterStartDate, $lte: filterEndDate } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
      ]),
      // COGS - Cost of Goods Sold (purchase cost of ONLY sold products)
      Invoice.aggregate([
        { $match: { organizationId: req.organizationId, createdAt: { $gte: filterStartDate, $lte: filterEndDate } } },
        { $unwind: "$items" },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
        { $unwind: "$product" },
        { $group: { 
          _id: null, 
          totalCOGS: { $sum: { $multiply: ["$items.quantity", "$product.purchasePrice"] } }
        }}
      ])
    ]);
    
    const currentData = salesData[0] || { totalRevenue: 0, totalOrders: 0, averageOrder: 0 };
    const previousData = previousPeriodData[0] || { totalRevenue: 0 };
    const expensesCurrentData = expensesData[0] || { total: 0, count: 0 };
    const cogsCurrentData = cogsData[0] || { totalCOGS: 0 };
    
    const growthRate = previousData.totalRevenue > 0 
      ? ((currentData.totalRevenue - previousData.totalRevenue) / previousData.totalRevenue * 100)
      : 0;
    
    // Correct Financial Calculations
    const totalSales = currentData.totalRevenue;
    const cogs = cogsCurrentData.totalCOGS;
    const extraExpenses = expensesCurrentData.total;
    const netProfit = totalSales - cogs - extraExpenses;
    
    const result = {
      // Revenue metrics
      totalSales: totalSales,
      totalOrders: currentData.totalOrders,
      averageOrder: currentData.averageOrder || 0,
      growthRate: growthRate.toFixed(1),
      
      // Cost breakdown
      cogs: cogs,
      extraExpenses: extraExpenses,
      netProfit: netProfit,
      
      // Legacy fields for compatibility
      totalAmount: totalSales,
      expenses: {
        total: extraExpenses,
        count: expensesCurrentData.count
      },
      
      // Pie chart data (parts of sales)
      pieChartData: {
        cogs: cogs,
        extraExpenses: extraExpenses,
        netProfit: Math.max(0, netProfit), // Show 0 if loss
        totalSales: totalSales
      },
      
      period: period || 'today',
      dateRange: {
        start: filterStartDate,
        end: filterEndDate
      }
    };
    
    // Sales reports ready
    
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

async function handleFinancialTrends(req, res) {
  try {
    console.log('📈 Fetching financial trends for org:', req.organizationId);
    
    if (!req.organizationId) {
      return res.status(400).json({ success: false, message: 'Organization ID required' });
    }
    
    const { period = 'monthly', months = 12 } = req.query;
    const Expense = (await import('../lib/models/Expense.js')).default;
    
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    
    if (period === 'monthly') {
      // Monthly trends
      const [revenueData, cogsData, expenseData] = await Promise.all([
        // Monthly Revenue
        Invoice.aggregate([
          { $match: { organizationId: req.organizationId, createdAt: { $gte: startDate } } },
          { $group: {
            _id: { 
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            revenue: { $sum: "$total" }
          }},
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]),
        // Monthly COGS - TENANT ISOLATED
        Invoice.aggregate([
          { $match: { organizationId: req.organizationId, createdAt: { $gte: startDate } } },
          { $unwind: "$items" },
          { $lookup: { 
            from: 'products', 
            localField: 'items.product', 
            foreignField: '_id', 
            as: 'product',
            pipeline: [{ $match: { organizationId: req.organizationId } }]
          }},
          { $unwind: "$product" },
          { $group: {
            _id: { 
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            cogs: { $sum: { $multiply: ["$items.quantity", "$product.purchasePrice"] } }
          }},
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]),
        // Monthly Expenses
        Expense.aggregate([
          { $match: { organizationId: req.organizationId, expenseDate: { $gte: startDate } } },
          { $group: {
            _id: { 
              year: { $year: "$expenseDate" },
              month: { $month: "$expenseDate" }
            },
            extraExpenses: { $sum: "$amount" }
          }},
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ])
      ]);
      
      // Merge data by month
      const trendsMap = new Map();
      
      // Generate all months in range
      for (let i = 0; i < months; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        trendsMap.set(key, {
          period: key,
          revenue: 0,
          cogs: 0,
          extraExpenses: 0,
          netProfit: 0
        });
      }
      
      // Add revenue data
      revenueData.forEach(item => {
        const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
        if (trendsMap.has(key)) {
          trendsMap.get(key).revenue = item.revenue;
        }
      });
      
      // Add COGS data
      cogsData.forEach(item => {
        const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
        if (trendsMap.has(key)) {
          trendsMap.get(key).cogs = item.cogs;
        }
      });
      
      // Add expense data
      expenseData.forEach(item => {
        const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
        if (trendsMap.has(key)) {
          trendsMap.get(key).extraExpenses = item.extraExpenses;
        }
      });
      
      // Calculate net profit
      const trends = Array.from(trendsMap.values()).map(item => ({
        ...item,
        netProfit: item.revenue - item.cogs - item.extraExpenses
      }));
      
      return res.status(200).json({ success: true, trends, period: 'monthly' });
      
    } else {
      // Yearly trends
      const years = 5;
      const yearStartDate = new Date(now.getFullYear() - (years - 1), 0, 1);
      
      const [revenueData, cogsData, expenseData] = await Promise.all([
        // Yearly Revenue
        Invoice.aggregate([
          { $match: { organizationId: req.organizationId, createdAt: { $gte: yearStartDate } } },
          { $group: {
            _id: { year: { $year: "$createdAt" } },
            revenue: { $sum: "$total" }
          }},
          { $sort: { "_id.year": 1 } }
        ]),
        // Yearly COGS - TENANT ISOLATED
        Invoice.aggregate([
          { $match: { organizationId: req.organizationId, createdAt: { $gte: yearStartDate } } },
          { $unwind: "$items" },
          { $lookup: { 
            from: 'products', 
            localField: 'items.product', 
            foreignField: '_id', 
            as: 'product',
            pipeline: [{ $match: { organizationId: req.organizationId } }]
          }},
          { $unwind: "$product" },
          { $group: {
            _id: { year: { $year: "$createdAt" } },
            cogs: { $sum: { $multiply: ["$items.quantity", "$product.purchasePrice"] } }
          }},
          { $sort: { "_id.year": 1 } }
        ]),
        // Yearly Expenses
        Expense.aggregate([
          { $match: { organizationId: req.organizationId, expenseDate: { $gte: yearStartDate } } },
          { $group: {
            _id: { year: { $year: "$expenseDate" } },
            extraExpenses: { $sum: "$amount" }
          }},
          { $sort: { "_id.year": 1 } }
        ])
      ]);
      
      // Merge data by year
      const trendsMap = new Map();
      
      // Generate all years in range
      for (let i = 0; i < years; i++) {
        const year = now.getFullYear() - (years - 1 - i);
        const key = String(year);
        trendsMap.set(key, {
          period: key,
          revenue: 0,
          cogs: 0,
          extraExpenses: 0,
          netProfit: 0
        });
      }
      
      // Add data
      revenueData.forEach(item => {
        const key = String(item._id.year);
        if (trendsMap.has(key)) trendsMap.get(key).revenue = item.revenue;
      });
      
      cogsData.forEach(item => {
        const key = String(item._id.year);
        if (trendsMap.has(key)) trendsMap.get(key).cogs = item.cogs;
      });
      
      expenseData.forEach(item => {
        const key = String(item._id.year);
        if (trendsMap.has(key)) trendsMap.get(key).extraExpenses = item.extraExpenses;
      });
      
      // Calculate net profit
      const trends = Array.from(trendsMap.values()).map(item => ({
        ...item,
        netProfit: item.revenue - item.cogs - item.extraExpenses
      }));
      
      return res.status(200).json({ success: true, trends, period: 'yearly' });
    }
  } catch (error) {
    console.error('❌ Financial trends error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch financial trends',
      error: error.message
    });
  }
}

async function handleSalesAnalytics(req, res) {
  try {
    console.log('📈 Fetching sales analytics for org:', req.organizationId);
    
    if (!req.organizationId) {
      return res.status(400).json({ success: false, message: 'Organization ID required' });
    }
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [todayData, yesterdayData] = await Promise.all([
      Invoice.aggregate([
        { $match: { organizationId: req.organizationId, createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)), $lte: new Date(today.setHours(23, 59, 59, 999)) } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
      ]),
      Invoice.aggregate([
        { $match: { organizationId: req.organizationId, createdAt: { $gte: new Date(yesterday.setHours(0, 0, 0, 0)), $lte: new Date(yesterday.setHours(23, 59, 59, 999)) } } },
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

async function handleGSTSummary(req, res) {
  try {
    console.log('📊 Fetching GST summary for org:', req.organizationId);
    
    if (!req.organizationId) {
      return res.status(400).json({ success: false, message: 'Organization ID required' });
    }
    
    const { period, startDate, endDate, month, year } = req.query;
    const Expense = (await import('../lib/models/Expense.js')).default;
    
    let filterStartDate, filterEndDate;
    
    if (period === 'custom' && startDate && endDate) {
      filterStartDate = new Date(startDate + 'T00:00:00.000Z');
      filterEndDate = new Date(endDate + 'T23:59:59.999Z');
    } else if (month && year) {
      filterStartDate = new Date(year, month - 1, 1);
      filterEndDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      filterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    
    console.log('📅 GST Period:', { filterStartDate, filterEndDate });
    
    const [gstData, cogsData, expensesData, invoicesList] = await Promise.all([
      // GST Summary
      Invoice.aggregate([
        { $match: { organizationId: req.organizationId, createdAt: { $gte: filterStartDate, $lte: filterEndDate } } },
        { $group: {
          _id: null,
          totalSales: { $sum: "$grandTotal" },
          totalTaxableAmount: { $sum: "$totalTaxableAmount" },
          totalCGST: { $sum: "$totalCgst" },
          totalSGST: { $sum: "$totalSgst" },
          totalGST: { $sum: { $add: ["$totalCgst", "$totalSgst"] } },
          totalInvoices: { $sum: 1 }
        }}
      ]),
      // COGS
      Invoice.aggregate([
        { $match: { organizationId: req.organizationId, createdAt: { $gte: filterStartDate, $lte: filterEndDate } } },
        { $unwind: "$items" },
        { $lookup: { 
          from: 'products', 
          localField: 'items.product', 
          foreignField: '_id', 
          as: 'product',
          pipeline: [{ $match: { organizationId: req.organizationId } }]
        }},
        { $unwind: "$product" },
        { $group: { 
          _id: null, 
          totalCOGS: { $sum: { $multiply: ["$items.quantity", "$product.purchasePrice"] } }
        }}
      ]),
      // Expenses
      Expense.aggregate([
        { $match: { organizationId: req.organizationId, expenseDate: { $gte: filterStartDate, $lte: filterEndDate } } },
        { $group: { _id: null, totalExpenses: { $sum: "$amount" } } }
      ]),
      // Sales Register (Invoice List)
      Invoice.find({ 
        organizationId: req.organizationId, 
        createdAt: { $gte: filterStartDate, $lte: filterEndDate } 
      })
      .populate('customer', 'name gstin phone')
      .select('invoiceNumber createdAt customer totalTaxableAmount totalCgst totalSgst grandTotal')
      .sort({ createdAt: 1 })
      .lean()
    ]);
    
    const gst = gstData[0] || { 
      totalSales: 0, 
      totalTaxableAmount: 0, 
      totalCGST: 0, 
      totalSGST: 0, 
      totalGST: 0,
      totalInvoices: 0
    };
    const cogs = cogsData[0]?.totalCOGS || 0;
    const expenses = expensesData[0]?.totalExpenses || 0;
    
    // Calculate Profit After Tax
    const grossProfit = gst.totalSales - cogs;
    const profitBeforeTax = grossProfit - expenses;
    const profitAfterTax = profitBeforeTax; // GST is output tax, not income tax
    
    const result = {
      period: {
        start: filterStartDate,
        end: filterEndDate,
        month: filterStartDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      },
      gstSummary: {
        totalSales: gst.totalSales,
        taxableSales: gst.totalTaxableAmount,
        cgst: gst.totalCGST,
        sgst: gst.totalSGST,
        igst: 0, // IGST for inter-state (not implemented yet)
        totalGST: gst.totalGST,
        totalInvoices: gst.totalInvoices
      },
      financials: {
        totalSales: gst.totalSales,
        cogs: cogs,
        grossProfit: grossProfit,
        expenses: expenses,
        profitBeforeTax: profitBeforeTax,
        profitAfterTax: profitAfterTax,
        profitMargin: gst.totalSales > 0 ? ((profitAfterTax / gst.totalSales) * 100).toFixed(2) : '0.00'
      },
      salesRegister: invoicesList.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        date: inv.createdAt,
        customerName: inv.customer?.name || 'N/A',
        gstin: inv.customer?.gstin || '-',
        taxableAmount: inv.totalTaxableAmount || 0,
        cgst: inv.totalCgst || 0,
        sgst: inv.totalSgst || 0,
        totalGST: (inv.totalCgst || 0) + (inv.totalSgst || 0),
        invoiceTotal: inv.grandTotal || 0
      }))
    };
    
    console.log('✅ GST Summary:', result.gstSummary);
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ GST summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch GST summary',
      error: error.message
    });
  }
}