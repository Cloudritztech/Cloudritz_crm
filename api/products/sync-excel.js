import connectDB from '../../lib/mongodb.js';
import Product from '../../lib/models/Product.js';
import { auth } from '../../lib/middleware/auth.js';

async function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();
    await runMiddleware(req, res, auth);

    const { products } = req.body;
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    const results = { added: 0, updated: 0, unchanged: 0, errors: [] };

    for (let i = 0; i < products.length; i++) {
      const item = products[i];
      
      if (!item.name || !item.stock || !item.sellingPrice || !item.purchasePrice) {
        results.errors.push(`Row ${i + 2}: Missing required fields`);
        continue;
      }

      const name = item.name.toString().trim();
      const stock = parseFloat(item.stock);
      const sellingPrice = parseFloat(item.sellingPrice);
      const purchasePrice = parseFloat(item.purchasePrice);
      
      const stockSaleValue = stock * sellingPrice;
      const stockPurchaseValue = stock * purchasePrice;

      const existingProduct = await Product.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') } 
      });

      if (existingProduct) {
        const hasChanges = 
          existingProduct.stock !== stock ||
          existingProduct.sellingPrice !== sellingPrice ||
          existingProduct.purchasePrice !== purchasePrice;

        if (hasChanges) {
          existingProduct.stock = stock;
          existingProduct.sellingPrice = sellingPrice;
          existingProduct.purchasePrice = purchasePrice;
          existingProduct.stockSaleValue = stockSaleValue;
          existingProduct.stockPurchaseValue = stockPurchaseValue;
          existingProduct.importedFromExcel = true;
          await existingProduct.save();
          results.updated++;
        } else {
          results.unchanged++;
        }
      } else {
        await Product.create({
          name,
          stock,
          sellingPrice,
          purchasePrice,
          stockSaleValue,
          stockPurchaseValue,
          category: 'accessories',
          importedFromExcel: true
        });
        results.added++;
      }
    }

    return res.status(200).json({
      success: true,
      message: results.added === 0 && results.updated === 0 
        ? 'Inventory already up-to-date' 
        : 'Inventory synced successfully',
      results
    });

  } catch (error) {
    console.error('Excel sync error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync inventory',
      error: error.message
    });
  }
}
