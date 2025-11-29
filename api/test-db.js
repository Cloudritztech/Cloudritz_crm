import connectDB from '../lib/mongodb.js';
import Invoice from '../lib/models/Invoice.js';
import { handleCors } from '../lib/cors.js';

async function handler(req, res) {
  try {
    console.log('🧪 Testing database connection...');
    await connectDB();
    console.log('✅ Database connected');
    
    const count = await Invoice.countDocuments();
    console.log('✅ Invoice count:', count);
    
    const sampleInvoice = await Invoice.findOne().lean();
    console.log('✅ Sample invoice ID:', sampleInvoice?._id);
    
    return res.status(200).json({
      success: true,
      message: 'Database test successful',
      invoiceCount: count,
      sampleInvoiceId: sampleInvoice?._id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message
    });
  }
}

export default function(req, res) {
  return handleCors(req, res, handler);
}