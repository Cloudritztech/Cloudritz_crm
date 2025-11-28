const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;
    
    let matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let groupStage;
    switch (period) {
      case 'daily':
        groupStage = {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            totalSales: { $sum: "$total" },
            totalInvoices: { $sum: 1 },
            averageOrderValue: { $avg: "$total" }
          }
        };
        break;
      case 'monthly':
        groupStage = {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            totalSales: { $sum: "$total" },
            totalInvoices: { $sum: 1 },
            averageOrderValue: { $avg: "$total" }
          }
        };
        break;
      default:
        groupStage = {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
            totalInvoices: { $sum: 1 },
            averageOrderValue: { $avg: "$total" }
          }
        };
    }

    const salesData = await Invoice.aggregate([
      { $match: matchStage },
      groupStage,
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, salesData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfitReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const profitData = await Invoice.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      {
        $project: {
          revenue: "$items.total",
          cost: { $multiply: ["$items.quantity", "$productInfo.purchasePrice"] },
          profit: {
            $subtract: [
              "$items.total",
              { $multiply: ["$items.quantity", "$productInfo.purchasePrice"] }
            ]
          },
          date: "$createdAt"
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$revenue" },
          totalCost: { $sum: "$cost" },
          totalProfit: { $sum: "$profit" }
        }
      }
    ]);

    res.json({ success: true, profitData: profitData[0] || { totalRevenue: 0, totalCost: 0, totalProfit: 0 } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTopSellingProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const topProducts = await Invoice.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.total" }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          name: "$product.name",
          category: "$product.category",
          totalQuantity: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({ success: true, topProducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDashboardStats = async (req, res) => {
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
};

module.exports = { getSalesReport, getProfitReport, getTopSellingProducts, getDashboardStats };