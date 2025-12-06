import connectDB from '../../lib/mongodb.js';
import Invoice from '../../lib/models/Invoice.js';
import { auth } from '../../lib/middleware/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PUT') return res.status(405).json({ message: 'Method not allowed' });

  await connectDB();

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const { id } = req.query;
    const { paymentStatus, paidAmount, paymentNotes } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const totalAmount = invoice.grandTotal || invoice.total;
    
    invoice.paymentStatus = paymentStatus;
    invoice.paidAmount = paidAmount || 0;
    invoice.pendingAmount = totalAmount - (paidAmount || 0);
    invoice.paymentNotes = paymentNotes;
    
    if (paymentStatus === 'paid') {
      invoice.paidAmount = totalAmount;
      invoice.pendingAmount = 0;
      invoice.paymentDate = new Date();
    }

    await invoice.save();

    res.json({ success: true, invoice });
  } catch (error) {
    console.error('Payment update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
