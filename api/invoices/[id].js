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
    await connectDB();
    await runMiddleware(req, res, auth);

    const { method } = req;
    // Extract ID from query params (Vercel dynamic routes)
    const id = req.query.id || req.query.slug;

    console.log('🔍 Invoice ID requested:', id);
    console.log('🔍 Full query params:', req.query);

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
            return res.status(400).json({ 
              success: false,
              message: 'Invalid invoice ID format' 
            });
          }

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

export default function(req, res) {
  return handleCors(req, res, handler);
}