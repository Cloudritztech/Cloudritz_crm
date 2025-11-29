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

  const { method, query: { id } } = req;

  switch (method) {
    case 'PUT':
      try {
        const product = await Product.findById(id);
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }

        const previousStock = product.stock;
        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });

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

        res.json({ success: true, product: updatedProduct });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
      break;

    case 'DELETE':
      try {
        await runMiddleware(req, res, adminOnly);
        await Product.findByIdAndUpdate(id, { isActive: false });
        res.json({ success: true, message: 'Product deleted successfully' });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default function(req, res) {
  return handleCors(req, res, handler);
}