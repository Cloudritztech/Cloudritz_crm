import connectDB from '../../lib/mongodb.js';
import Product from '../../lib/models/Product.js';
import InventoryHistory from '../../lib/models/InventoryHistory.js';
import { auth, adminOnly } from '../../lib/middleware/auth.js';
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
  await connectDB();
  await runMiddleware(req, res, auth);

  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { category, lowStock, search } = req.query;
        let query = { isActive: true };
        
        if (category) query.category = category;
        if (lowStock === 'true') query.$expr = { $lte: ['$stock', '$minStock'] };
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } }
          ];
        }

        const products = await Product.find(query).sort({ createdAt: -1 });
        res.json({ success: true, products });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
      break;

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

        res.status(201).json({ success: true, product });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default function(req, res) {
  return handleCors(req, res, handler);
}