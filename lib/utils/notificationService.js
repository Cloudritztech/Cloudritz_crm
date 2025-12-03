import Notification from '../models/Notification.js';
import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';

export const createNotification = async (userId, { type, title, message, priority = 'medium', data = {}, link = null }) => {
  try {
    await Notification.create({ userId, type, title, message, priority, data, link });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

export const checkLowStock = async (userId) => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockLimit'] }
    }).limit(10);

    if (lowStockProducts.length > 0) {
      await createNotification(userId, {
        type: 'stock',
        title: 'Low Stock Alert',
        message: `${lowStockProducts.length} products are running low on stock`,
        priority: 'high',
        data: { count: lowStockProducts.length, products: lowStockProducts.map(p => p.name) },
        link: '/products'
      });
    }
  } catch (error) {
    console.error('Failed to check low stock:', error);
  }
};

export const checkPendingPayments = async (userId) => {
  try {
    const pendingInvoices = await Invoice.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    if (pendingInvoices.length > 0 && pendingInvoices[0].count > 0) {
      await createNotification(userId, {
        type: 'payment',
        title: 'Pending Payments',
        message: `₹${pendingInvoices[0].total.toLocaleString('en-IN')} pending from ${pendingInvoices[0].count} invoices`,
        priority: 'high',
        data: { amount: pendingInvoices[0].total, count: pendingInvoices[0].count },
        link: '/invoices'
      });
    }
  } catch (error) {
    console.error('Failed to check pending payments:', error);
  }
};

export const notifyNewSale = async (userId, invoice) => {
  await createNotification(userId, {
    type: 'sale',
    title: 'New Sale',
    message: `Invoice ${invoice.invoiceNumber} created for ₹${invoice.total.toLocaleString('en-IN')}`,
    priority: 'medium',
    data: { invoiceId: invoice._id, amount: invoice.total },
    link: `/invoices/view/${invoice._id}`
  });
};

export const notifyPaymentReceived = async (userId, invoice) => {
  await createNotification(userId, {
    type: 'payment',
    title: 'Payment Received',
    message: `Payment of ₹${invoice.total.toLocaleString('en-IN')} received for ${invoice.invoiceNumber}`,
    priority: 'medium',
    data: { invoiceId: invoice._id, amount: invoice.total },
    link: `/invoices/view/${invoice._id}`
  });
};

export const generateDailySalesReport = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySales = await Invoice.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    if (todaySales.length > 0) {
      await createNotification(userId, {
        type: 'report',
        title: 'Daily Sales Report',
        message: `Today's sales: ₹${todaySales[0].total.toLocaleString('en-IN')} from ${todaySales[0].count} invoices`,
        priority: 'low',
        data: { amount: todaySales[0].total, count: todaySales[0].count },
        link: '/sales-reports'
      });
    }
  } catch (error) {
    console.error('Failed to generate sales report:', error);
  }
};

export const notifyTopProducts = async (userId) => {
  try {
    const topProducts = await Invoice.aggregate([
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $group: {
        _id: '$items.product',
        name: { $first: '$product.name' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
      }},
      { $sort: { totalQuantity: -1 } },
      { $limit: 3 }
    ]);

    if (topProducts.length > 0) {
      const topProduct = topProducts[0];
      await createNotification(userId, {
        type: 'report',
        title: 'Top Selling Product',
        message: `${topProduct.name} - ${topProduct.totalQuantity} units sold (₹${topProduct.totalRevenue.toLocaleString('en-IN')})`,
        priority: 'low',
        data: { products: topProducts },
        link: '/products'
      });
    }
  } catch (error) {
    console.error('Failed to notify top products:', error);
  }
};
