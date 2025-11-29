import connectDB from '../../../lib/mongodb.js';
import Product from '../../../lib/models/Product.js';
import InventoryHistory from '../../../lib/models/InventoryHistory.js';
import { auth } from '../../../lib/middleware/auth.js';
import { handleCors } from '../../../lib/cors.js';

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
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await connectDB();
  await runMiddleware(req, res, auth);

  try {
    const { id } = req.query;
    const { adjustment, reason } = req.body;
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const previousStock = product.stock;
    const newStock = previousStock + adjustment;
    
    if (newStock < 0) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    product.stock = newStock;
    await product.save();

    await InventoryHistory.create({
      product: product._id,
      type: 'adjustment',
      quantity: adjustment,
      previousStock,
      newStock,
      reason: reason || (adjustment > 0 ? 'Stock increase' : 'Offline sale'),
      updatedBy: req.user._id
    });

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export default function(req, res) {
  return handleCors(req, res, handler);
}