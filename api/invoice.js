import connectDB from '../lib/mongodb.js';
import Invoice from '../lib/models/Invoice.js';
import Customer from '../lib/models/Customer.js';
import Product from '../lib/models/Product.js';
import User from '../lib/models/User.js';
import { auth } from '../lib/middleware/auth.js';
import { generateInvoicePDF } from '../lib/pdfGenerator.js';

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

  try {
    console.log('📄 Invoice API called:', req.method, req.url);
    await connectDB();
    console.log('✅ Database connected');
    
    await runMiddleware(req, res, auth);
    console.log('✅ Authentication passed');

    const { method, query } = req;
    const { id, action } = query;

    console.log('📄 Invoice ID:', id, 'Action:', action);

    // Handle GST invoice operations (merged from invoice-gst.js)
    if (action === 'gst' && !id) {
      if (method === 'POST') {
        return await createGSTInvoice(req, res);
      }
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID is required'
      });
    }

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('❌ Invalid ObjectId format:', id);
      return res.status(400).json({
        success: false,
        message: `Invalid invoice ID format: ${id}`
      });
    }

    if (method === 'GET') {
      if (action === 'pdf') {
        // PDF Generation
        try {
          console.log('📄 Generating PDF for invoice:', id);
          
          const invoice = await Invoice.findById(id)
            .populate('customer', 'name phone address')
            .populate('items.product', 'name category brand hsnCode')
            .populate('createdBy', 'name')
            .lean();

          if (!invoice) {
            console.log('❌ Invoice not found for PDF generation:', id);
            return res.status(404).json({
              success: false,
              message: 'Invoice not found'
            });
          }

          console.log('✅ Generating PDF for invoice:', invoice.invoiceNumber);

          const pdfBuffer = await generateInvoicePDF(invoice);
          
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
          res.setHeader('Content-Length', pdfBuffer.length);
          
          return res.send(pdfBuffer);
        } catch (error) {
          console.error('❌ PDF generation error:', error);
          return res.status(500).json({
            success: false,
            message: 'Failed to generate PDF',
            error: error.message
          });
        }
      } else {
        // Get Single Invoice
        try {
          console.log('📄 Fetching invoice:', id);
          
          const invoice = await Invoice.findById(id)
            .populate('customer', 'name phone address')
            .populate('items.product', 'name category hsnCode brand')
            .populate('createdBy', 'name')
            .lean();

          if (!invoice) {
            console.log('❌ Invoice not found:', id);
            return res.status(404).json({
              success: false,
              message: 'Invoice not found'
            });
          }

          console.log('✅ Invoice found:', invoice.invoiceNumber);

          return res.status(200).json({
            success: true,
            invoice
          });
        } catch (error) {
          console.error('❌ Error fetching invoice:', error);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch invoice',
            error: error.message
          });
        }
      }
    }

    return res.status(405).json({
      success: false,
      message: `Method ${method} Not Allowed`
    });
  } catch (error) {
    console.error('❌ Invoice handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// GST Invoice Functions (merged from invoice-gst.js)
function calculateInvoiceTotals(items, gstEnabled, gstCompensated, manualDiscount) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  let cgst = 0, sgst = 0, totalGst = 0;
  if (gstEnabled) {
    cgst = (subtotal * 9) / 100;
    sgst = (subtotal * 9) / 100;
    totalGst = cgst + sgst;
  }
  let autoDiscount = 0;
  if (gstEnabled && gstCompensated) {
    autoDiscount = totalGst;
  }
  const totalDiscount = manualDiscount + autoDiscount;
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

async function createGSTInvoice(req, res) {
  try {
    const { customer, items, gstEnabled = false, gstCompensated = false, manualDiscount = 0, paymentMethod = 'cash', status = 'paid' } = req.body;
    if (!customer || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer and items are required' });
    }
    const validatedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.product}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      }
      validatedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: item.price || product.sellingPrice,
        total: item.quantity * (item.price || product.sellingPrice)
      });
    }
    const calculations = calculateInvoiceTotals(validatedItems, gstEnabled, gstCompensated, manualDiscount);
    const invoice = new Invoice({
      customer, items: validatedItems, gstEnabled, gstCompensated,
      subtotal: calculations.subtotal, cgst: calculations.cgst, sgst: calculations.sgst,
      totalGst: calculations.totalGst, manualDiscount: calculations.manualDiscount,
      autoDiscount: calculations.autoDiscount, totalDiscount: calculations.totalDiscount,
      total: calculations.total, paymentMethod, status, createdBy: req.user._id
    });
    await invoice.save();
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }
    await invoice.populate('customer', 'name phone email');
    await invoice.populate('items.product', 'name category');
    return res.status(201).json({ success: true, message: 'Invoice created successfully', invoice });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create invoice', error: error.message });
  }
}