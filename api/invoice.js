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