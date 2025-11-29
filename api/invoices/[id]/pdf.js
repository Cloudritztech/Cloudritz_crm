import connectDB from '../../../lib/mongodb.js';
import Invoice from '../../../lib/models/Invoice.js';
import { auth } from '../../../lib/middleware/auth.js';
import { handleCors } from '../../../lib/cors.js';
import { generateInvoicePDF } from '../../../lib/pdfGenerator.js';

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
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        message: 'Method not allowed' 
      });
    }

    await connectDB();
    await runMiddleware(req, res, auth);

    const id = req.query.id;
    
    console.log('🔍 PDF generation - Invoice ID:', id);
    console.log('🔍 PDF generation - Query params:', req.query);
    console.log('🔍 PDF generation - URL:', req.url);
    
    console.log('🔍 PDF generation requested for invoice ID:', id);

    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'Invoice ID is required' 
      });
    }

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid invoice ID format' 
      });
    }
    
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
}

export default async function(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }
  
  return handleCors(req, res, handler);
}