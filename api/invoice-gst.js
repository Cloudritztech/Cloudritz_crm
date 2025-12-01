import connectDB from '../lib/mongodb.js';
import Invoice from '../lib/models/Invoice.js';
import Product from '../lib/models/Product.js';
import { auth } from '../lib/middleware/auth.js';

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

/**
 * Calculate GST and totals (server-side validation)
 */
function calculateInvoiceTotals(items, gstEnabled, gstCompensated, manualDiscount) {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  // Calculate GST
  let cgst = 0;
  let sgst = 0;
  let totalGst = 0;

  if (gstEnabled) {
    cgst = (subtotal * 9) / 100; // CGST 9%
    sgst = (subtotal * 9) / 100; // SGST 9%
    totalGst = cgst + sgst;
  }

  // Calculate discount
  let autoDiscount = 0;
  if (gstEnabled && gstCompensated) {
    autoDiscount = totalGst; // Compensate GST with equal discount
  }

  const totalDiscount = manualDiscount + autoDiscount;

  // Calculate final total
  const total = subtotal + totalGst - totalDiscount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    cgst: Math.round(cgst * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    totalGst: Math.round(totalGst * 100) / 100,
    manualDiscount: Math.round(manualDiscount * 100) / 100,
    autoDiscount: Math.round(autoDiscount * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    await runMiddleware(req, res, auth);

    if (req.method === 'POST') {
      return await createInvoice(req, res);
    }

    if (req.method === 'GET') {
      return await getInvoice(req, res);
    }

    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  } catch (error) {
    console.error('❌ Invoice API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
}

async function createInvoice(req, res) {
  try {
    const {
      customer,
      items,
      gstEnabled = false,
      gstCompensated = false,
      manualDiscount = 0,
      paymentMethod = 'cash',
      status = 'paid'
    } = req.body;

    // Validation
    if (!customer || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer and items are required'
      });
    }

    // Validate items and get product details
    const validatedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      validatedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: item.price || product.sellingPrice,
        total: item.quantity * (item.price || product.sellingPrice)
      });
    }

    // Calculate totals
    const calculations = calculateInvoiceTotals(
      validatedItems,
      gstEnabled,
      gstCompensated,
      manualDiscount
    );

    // Create invoice
    const invoice = new Invoice({
      customer,
      items: validatedItems,
      gstEnabled,
      gstCompensated,
      subtotal: calculations.subtotal,
      cgst: calculations.cgst,
      sgst: calculations.sgst,
      totalGst: calculations.totalGst,
      manualDiscount: calculations.manualDiscount,
      autoDiscount: calculations.autoDiscount,
      totalDiscount: calculations.totalDiscount,
      total: calculations.total,
      paymentMethod,
      status,
      createdBy: req.user._id
    });

    await invoice.save();

    // Update product stock
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Populate customer details
    await invoice.populate('customer', 'name phone email');
    await invoice.populate('items.product', 'name category');

    console.log('✅ Invoice created:', invoice.invoiceNumber);

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice
    });

  } catch (error) {
    console.error('❌ Create invoice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message
    });
  }
}

async function getInvoice(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID is required'
      });
    }

    const invoice = await Invoice.findById(id)
      .populate('customer', 'name phone email address')
      .populate('items.product', 'name category')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    return res.status(200).json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('❌ Get invoice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message
    });
  }
}