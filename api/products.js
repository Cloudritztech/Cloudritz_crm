import connectDB from '../lib/mongodb.js';
import Product from '../lib/models/Product.js';
import User from '../lib/models/User.js';
import InventoryHistory from '../lib/models/InventoryHistory.js';
import { auth, adminOnly } from '../lib/middleware/auth.js';

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
  await runMiddleware(req, res, auth);

  const { method, query } = req;
  const { id, action } = query;
  
  // Handle both Express params and Vercel query params
  const productId = id || req.params?.id;
  const productAction = action || req.params?.action;

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
          product: product._id,
          type: 'adjustment',
          quantity: adjustment,
          previousStock,
          newStock: product.stock,
          reason: reason || 'Manual adjustment',
          updatedBy: req.user._id
        });

        return res.json({ success: true, product });
      } else {
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }

        const previousStock = product.stock;
        const updatedProduct = await Product.findByIdAndUpdate(productId, req.body, { new: true });

        if (previousStock !== updatedProduct.stock) {
          await InventoryHistory.create({
            product: updatedProduct._id,
            type: 'adjustment',
            quantity: updatedProduct.stock - previousStock,
            previousStock,
            newStock: updatedProduct.stock,
            reason: 'Manual adjustment',
            updatedBy: req.user._id
          });
        }

        return res.json({ success: true, product: updatedProduct });
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (productId && method === 'DELETE') {
    try {
      await runMiddleware(req, res, adminOnly);
      await Product.findByIdAndUpdate(productId, { isActive: false });
      return res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Handle product list operations
  switch (method) {
    case 'GET':
      try {
        const { category, lowStock, search } = query;
        let queryObj = { isActive: true };
        
        if (category) queryObj.category = category;
        if (lowStock === 'true') queryObj.$expr = { $lte: ['$stock', '$minStock'] };
        if (search) {
          queryObj.$or = [
            { name: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } }
          ];
        }

        const products = await Product.find(queryObj).sort({ createdAt: -1 });
        return res.json({ success: true, products });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    case 'POST':
      try {
        const product = await Product.create(req.body);
        
        await InventoryHistory.create({
          product: product._id,
          type: 'adjustment',
          quantity: product.stock,
          previousStock: 0,
          newStock: product.stock,
          reason: 'Initial stock',
          updatedBy: req.user._id
        });

        return res.status(201).json({ success: true, product });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}