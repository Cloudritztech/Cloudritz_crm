import connectDB from '../../lib/mongodb.js';
import Product from '../../lib/models/Product.js';
import { auth } from '../../lib/middleware/auth.js';
import formidable from 'formidable';
import xlsx from 'xlsx';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

function parseExcelFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet);
}

function normalizeColumnName(name) {
  return name.toLowerCase().trim().replace(/\s+/g, '');
}

function mapExcelRow(row) {
  const mapped = {};
  const columnMap = {
    'itemname': 'name',
    'stockcount': 'stock',
    'currentsaleprice': 'sellingPrice',
    'stockvalue(purchaseprice)': 'purchasePrice'
  };

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeColumnName(key);
    const mappedKey = columnMap[normalizedKey];
    if (mappedKey) {
      mapped[mappedKey] = value;
    }
  }

  return mapped;
}

function validateRow(row, index) {
  const errors = [];
  
  if (!row.name || row.name.toString().trim() === '') {
    errors.push(`Row ${index + 2}: Item Name is required`);
  }
  if (row.stock === undefined || row.stock === null || isNaN(row.stock)) {
    errors.push(`Row ${index + 2}: Stock Count must be a number`);
  }
  if (!row.sellingPrice || isNaN(row.sellingPrice)) {
    errors.push(`Row ${index + 2}: Current Sale Price must be a number`);
  }
  if (!row.purchasePrice || isNaN(row.purchasePrice)) {
    errors.push(`Row ${index + 2}: Purchase Price must be a number`);
  }

  return errors;
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

    const form = formidable({ multiples: false });
    
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file?.[0] || files.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = file.filepath;
    const rows = parseExcelFile(filePath);
    
    if (rows.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'Excel file is empty' });
    }

    const firstRow = rows[0];
    const normalizedKeys = Object.keys(firstRow).map(normalizeColumnName);
    const requiredColumns = ['itemname', 'stockcount', 'currentsaleprice', 'stockvalue(purchaseprice)'];
    const missingColumns = requiredColumns.filter(col => !normalizedKeys.includes(col));
    
    if (missingColumns.length > 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        success: false, 
        message: `Missing required columns: ${missingColumns.join(', ')}` 
      });
    }

    const results = {
      added: 0,
      updated: 0,
      unchanged: 0,
      errors: []
    };

    for (let i = 0; i < rows.length; i++) {
      const mappedRow = mapExcelRow(rows[i]);
      const validationErrors = validateRow(mappedRow, i);
      
      if (validationErrors.length > 0) {
        results.errors.push(...validationErrors);
        continue;
      }

      const name = mappedRow.name.toString().trim();
      const stock = parseFloat(mappedRow.stock);
      const sellingPrice = parseFloat(mappedRow.sellingPrice);
      const purchasePrice = parseFloat(mappedRow.purchasePrice);
      
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

    fs.unlinkSync(filePath);

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
