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
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await connectDB();
  await runMiddleware(req, res, auth);

  try {
    const { id } = req.query;
    
    const invoice = await Invoice.findById(id)
      .populate('customer', 'name phone address')
      .populate('items.product', 'name category brand hsnCode')
      .populate('createdBy', 'name');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate PDF', 
      error: error.message 
    });
  }
}

export default function(req, res) {
  return handleCors(req, res, handler);
}