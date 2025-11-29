import connectDB from '../../lib/mongodb.js';
import Invoice from '../../lib/models/Invoice.js';
import { auth } from '../../lib/middleware/auth.js';
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
  try {
    console.log('🔍 Starting invoice handler...');
    await connectDB();
    console.log('✅ Database connected');
    
    await runMiddleware(req, res, auth);
    console.log('✅ Authentication passed');

    const { method } = req;
    // Extract ID from query params (Vercel dynamic routes)
    // In Vercel, [id].js receives the parameter as req.query.id
    const id = req.query.id;

    console.log('🔍 Invoice ID requested:', id);
    console.log('🔍 Full query params:', req.query);
    console.log('🔍 Request URL:', req.url);
    console.log('🔍 Request method:', req.method);

    switch (method) {
      case 'GET':
        try {
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
          
          console.log('✅ Valid ObjectId format:', id);

          console.log('🔍 Searching for invoice in database...');
          
          // First try to find the invoice without population
          const basicInvoice = await Invoice.findById(id).lean();
          
          if (!basicInvoice) {
            console.log('❌ Invoice not found in database for ID:', id);
            return res.status(404).json({ 
              success: false,
              message: 'Invoice not found' 
            });
          }
          
          console.log('✅ Basic invoice found:', basicInvoice.invoiceNumber);
          
          // Now try with population
          const invoice = await Invoice.findById(id)
            .populate('customer', 'name phone address')
            .populate('items.product', 'name category hsnCode brand')
            .populate('createdBy', 'name')
            .lean();

          if (!invoice) {
            console.log('❌ Invoice not found for ID:', id);
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

      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({
          success: false,
          message: `Method ${method} Not Allowed`
        });
    }
  } catch (error) {
    console.error('❌ Handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
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