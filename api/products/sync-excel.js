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

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    await connectDB();
    await runMiddleware(req, res, auth);

    const { products } = req.body;
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    const results = { added: 0, updated: 0, unchanged: 0, errors: [] };
    
    // Fetch all existing products once
    const existingProducts = await Product.find({});
    const existingMap = new Map();
    existingProducts.forEach(p => existingMap.set(p.name.toLowerCase().trim(), p));

    const bulkOps = [];

    for (let i = 0; i < products.length; i++) {
      const item = products[i];
      
      // Validate required fields
      if (!item.name) {
        results.errors.push(`Row ${i + 2}: Missing product name`);
        continue;
      }

      const name = item.name.toString().trim();
      const stock = parseFloat(item.stock) || 0;
      const sellingPrice = parseFloat(item.sellingPrice) || 0;
      let purchasePrice = parseFloat(item.purchasePrice) || 0;

      // Auto-calculate purchase price if missing
      if (!purchasePrice && item.stockPurchaseValue && stock > 0) {
        purchasePrice = parseFloat(item.stockPurchaseValue) / stock;
      }
      if (!purchasePrice) {
        purchasePrice = sellingPrice * 0.7; // Default 30% margin
      }

      const stockSaleValue = stock * sellingPrice;
      const stockPurchaseValue = stock * purchasePrice;

      const existing = existingMap.get(name.toLowerCase());

      if (existing) {
        // Check if any field changed
        const hasChanges = 
          Math.abs(existing.stock - stock) > 0.01 ||
          Math.abs(existing.sellingPrice - sellingPrice) > 0.01 ||
          Math.abs(existing.purchasePrice - purchasePrice) > 0.01;

        if (hasChanges) {
          bulkOps.push({
            updateOne: {
              filter: { _id: existing._id },
              update: { 
                $set: {
                  stock, 
                  sellingPrice, 
                  purchasePrice, 
                  stockSaleValue, 
                  stockPurchaseValue,
                  importedFromExcel: true
                }
              }
            }
          });
          results.updated++;
        } else {
          results.unchanged++;
        }
      } else {
        // New product
        bulkOps.push({
          insertOne: {
            document: {
              name,
              stock,
              sellingPrice,
              purchasePrice,
              stockSaleValue,
              stockPurchaseValue,
              unit: 'piece',
              category: 'accessories',
              lowStockLimit: 5,
              taxIncluded: false,
              importedFromExcel: true,
              stockHistory: []
            }
          }
        });
        results.added++;
      }
    }

    // Execute bulk operations
    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps, { ordered: false });
    }

    return res.status(200).json({
      success: true,
      message: `✅ Sync complete: ${results.added} added, ${results.updated} updated, ${results.unchanged} unchanged`,
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
