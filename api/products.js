import connectDB from '../lib/mongodb.js';
import Product from '../lib/models/Product.js';
import User from '../lib/models/User.js';
import InventoryHistory from '../lib/models/InventoryHistory.js';
import { authenticate, tenantIsolation } from '../lib/middleware/tenant.js';
import { deleteImage } from '../lib/cloudinary.js';
import { notifyLowStock } from '../lib/services/notificationService.js';

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
    await authenticate(req, res, async () => {
      await tenantIsolation(req, res, async () => {

  const { method, query } = req;
  const { id, action } = query;
  
  // Handle both Express params and Vercel query params
  const productId = id || req.params?.id;
  const productAction = action || req.params?.action;

        // Get single product
        if (productId && method === 'GET' && !productAction) {
    try {
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      return res.json({ success: true, product });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Stock update
  if (productId && method === 'POST' && productAction === 'stock') {
    try {
      const { type, qty, note } = req.body;
      console.log('📦 Stock update request:', { productId, type, qty, organizationId: req.organizationId });
      
      if (!type || !qty) return res.status(400).json({ success: false, message: 'Type and quantity required' });
      
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      
      if (type === 'OUT' && product.stock < qty) {
        return res.status(400).json({ success: false, message: 'Insufficient stock' });
      }
      
      const previousStock = product.stock;
      product.stock = type === 'IN' ? product.stock + qty : product.stock - qty;
      await product.save();
      
      console.log(`✅ Stock updated: ${previousStock} → ${product.stock}, lowStockLimit: ${product.lowStockLimit}`);
      
      // Create inventory history
      await InventoryHistory.create({
        organizationId: req.organizationId,
        product: product._id,
        type: type === 'IN' ? 'purchase' : 'sale',
        quantity: type === 'IN' ? qty : -qty,
        previousStock,
        newStock: product.stock,
        reason: note || `Manual ${type} adjustment`,
        updatedBy: req.userId
      });
      
      // Check for low stock and send notification
      if (product.stock <= product.lowStockLimit) {
        console.log('⚠️ Low stock detected! Fetching all low stock products...');
        
        const lowStockProducts = await Product.find({ 
          organizationId: req.organizationId, 
          $expr: { $lte: ['$stock', '$lowStockLimit'] } 
        }).select('name stock lowStockLimit').limit(10).lean();
        
        console.log(`📦 Found ${lowStockProducts.length} low stock products:`, lowStockProducts.map(p => p.name));
        
        if (lowStockProducts.length > 0) {
          console.log('🔔 Calling notifyLowStock...');
          await notifyLowStock(req.organizationId, lowStockProducts);
          console.log('✅ Low stock notification sent!');
        }
      } else {
        console.log('✓ Stock level OK, no notification needed');
      }
      
      return res.json({ success: true, product });
    } catch (error) {
      console.error('❌ Stock update error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get inventory history for a product
  if (productId && method === 'GET' && productAction === 'history') {
    try {
      const history = await InventoryHistory.find({ 
        organizationId: req.organizationId,
        product: productId 
      })
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
      
      return res.json({ success: true, history });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Excel sync (merged from products/sync-excel.js)
  if (method === 'POST' && productAction === 'sync-excel') {
    try {
      const { products } = req.body;
      if (!products || !Array.isArray(products)) {
        return res.status(400).json({ success: false, message: 'Invalid data format' });
      }
      const results = { added: 0, updated: 0, unchanged: 0, errors: [] };
      const existingProducts = await Product.find({ organizationId: req.organizationId });
      const existingMap = new Map();
      existingProducts.forEach(p => existingMap.set(p.name.toLowerCase().trim(), p));
      const bulkOps = [];
      for (let i = 0; i < products.length; i++) {
        const item = products[i];
        if (!item.name) {
          results.errors.push(`Row ${i + 2}: Missing product name`);
          continue;
        }
        const name = item.name.toString().trim();
        const stock = parseFloat(item.stock) || 0;
        const sellingPrice = parseFloat(item.sellingPrice) || 0;
        let purchasePrice = parseFloat(item.purchasePrice) || 0;
        if (!purchasePrice && item.stockPurchaseValue && stock > 0) {
          purchasePrice = parseFloat(item.stockPurchaseValue) / stock;
        }
        if (!purchasePrice) {
          purchasePrice = sellingPrice * 0.7;
        }
        const stockSaleValue = stock * sellingPrice;
        const stockPurchaseValue = stock * purchasePrice;
        const existing = existingMap.get(name.toLowerCase());
        if (existing && existing.organizationId.toString() === req.organizationId.toString()) {
          const hasChanges = Math.abs(existing.stock - stock) > 0.01 || Math.abs(existing.sellingPrice - sellingPrice) > 0.01 || Math.abs(existing.purchasePrice - purchasePrice) > 0.01;
          if (hasChanges) {
            bulkOps.push({ updateOne: { filter: { _id: existing._id, organizationId: req.organizationId }, update: { $set: { stock, sellingPrice, purchasePrice, stockSaleValue, stockPurchaseValue, importedFromExcel: true } } } });
            results.updated++;
          } else {
            results.unchanged++;
          }
        } else {
          bulkOps.push({ insertOne: { document: { organizationId: req.organizationId, name, stock, sellingPrice, purchasePrice, stockSaleValue, stockPurchaseValue, unit: 'piece', category: 'accessories', lowStockLimit: 5, taxIncluded: false, importedFromExcel: true, stockHistory: [] } } });
          results.added++;
        }
      }
      if (bulkOps.length > 0) {
        await Product.bulkWrite(bulkOps, { ordered: false });
      }
      return res.status(200).json({ success: true, message: `✅ Sync complete: ${results.added} added, ${results.updated} updated, ${results.unchanged} unchanged`, results });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to sync inventory', error: error.message });
    }
  }

  // Handle specific product operations
  if (productId && method === 'PUT') {
    try {
      if (productAction === 'adjust-stock') {
        const { adjustment, reason } = req.body;
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }

        const previousStock = product.stock;
        product.stock += adjustment;
        await product.save();

        await InventoryHistory.create({
          organizationId: req.organizationId,
          product: product._id,
          type: 'adjustment',
          quantity: adjustment,
          previousStock,
          newStock: product.stock,
          reason: reason || 'Manual adjustment',
          updatedBy: req.userId
        });

        return res.json({ success: true, product });
      } else {
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }

        // Delete old image if new one is uploaded
        if (req.body.image && req.body.image !== product.image && product.image) {
          await deleteImage(product.image);
        }

        const previousStock = product.stock;
        Object.assign(product, req.body);
        await product.save();

        if (previousStock !== product.stock) {
          await InventoryHistory.create({
            organizationId: req.organizationId,
            product: product._id,
            type: 'adjustment',
            quantity: product.stock - previousStock,
            previousStock,
            newStock: product.stock,
            reason: 'Manual adjustment',
            updatedBy: req.userId
          });
        }

        return res.json({ success: true, product });
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (productId && method === 'DELETE') {
    try {
      const product = await Product.findOne({ _id: productId, organizationId: req.organizationId });
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      await Product.findByIdAndDelete(productId);
      return res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Handle product list operations
  switch (method) {
    case 'GET':
      try {
        const { category, lowStock, search } = query;
        let queryObj = {};
        
        if (category) queryObj.category = category;
        if (lowStock === 'true') queryObj.$expr = { $lte: ['$stock', '$minStock'] };
        if (search) {
          queryObj.$or = [
            { name: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } }
          ];
        }

        if (req.organizationId) {
          queryObj.organizationId = req.organizationId;
        }
        const products = await Product.find(queryObj)
          .select('name sellingPrice purchasePrice stock stockSaleValue stockPurchaseValue category lowStockLimit isActive')
          .sort({ createdAt: -1 })
          .lean();
        return res.json({ success: true, products });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    case 'POST':
      try {
        const product = await Product.create({ ...req.body, organizationId: req.organizationId });
        
        await InventoryHistory.create({
          organizationId: req.organizationId,
          product: product._id,
          type: 'adjustment',
          quantity: product.stock,
          previousStock: 0,
          newStock: product.stock,
          reason: 'Initial stock',
          updatedBy: req.userId
        });

        return res.status(201).json({ success: true, product });
      } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
      }
      break;

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
