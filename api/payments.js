import connectDB from '../lib/mongodb.js';
import Payment from '../lib/models/Payment.js';
import Invoice from '../lib/models/Invoice.js';
import Customer from '../lib/models/Customer.js';
import { auth } from '../lib/middleware/auth.js';

async function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();
    await runMiddleware(req, res, auth);

    const { method, query } = req;

    switch (method) {
      case 'GET':
        if (query.invoiceId) {
          const payments = await Payment.find({ invoice: query.invoiceId })
            .populate('receivedBy', 'name')
            .sort({ paymentDate: -1 });
          return res.status(200).json({ success: true, payments });
        }

        if (query.customerId) {
          const payments = await Payment.find({ customer: query.customerId })
            .populate('invoice', 'invoiceNumber grandTotal')
            .populate('receivedBy', 'name')
            .sort({ paymentDate: -1 });
          return res.status(200).json({ success: true, payments });
        }

        const payments = await Payment.find()
          .populate('invoice', 'invoiceNumber grandTotal')
          .populate('customer', 'name phone')
          .populate('receivedBy', 'name')
          .sort({ paymentDate: -1 })
          .limit(100);
        
        return res.status(200).json({ success: true, payments });

      case 'POST':
        const { invoice: invoiceId, amount, paymentMethod, paymentDate, transactionId, notes } = req.body;

        if (!invoiceId || !amount || !paymentMethod || !paymentDate) {
          return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
          return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        const paymentAmount = parseFloat(amount);
        const newPaidAmount = invoice.paidAmount + paymentAmount;
        const newPendingAmount = invoice.grandTotal - newPaidAmount;

        if (newPaidAmount > invoice.grandTotal) {
          return res.status(400).json({ 
            success: false, 
            message: `Payment amount exceeds pending amount. Pending: ₹${invoice.pendingAmount.toFixed(2)}` 
          });
        }

        // Create payment record
        const payment = await Payment.create({
          invoice: invoiceId,
          customer: invoice.customer,
          amount: paymentAmount,
          paymentMethod,
          paymentDate: new Date(paymentDate),
          transactionId,
          notes,
          receivedBy: req.user._id
        });

        // Update invoice payment status
        let paymentStatus = 'pending';
        if (newPendingAmount <= 0) {
          paymentStatus = 'paid';
        } else if (newPaidAmount > 0) {
          paymentStatus = 'partial';
        }

        await Invoice.findByIdAndUpdate(invoiceId, {
          paidAmount: newPaidAmount,
          pendingAmount: newPendingAmount,
          paymentStatus,
          status: paymentStatus === 'paid' ? 'paid' : 'pending'
        });

        const populatedPayment = await Payment.findById(payment._id)
          .populate('invoice', 'invoiceNumber grandTotal')
          .populate('customer', 'name phone')
          .populate('receivedBy', 'name');

        return res.status(201).json({ 
          success: true, 
          payment: populatedPayment,
          message: `Payment of ₹${paymentAmount.toFixed(2)} recorded successfully`
        });

      case 'DELETE':
        if (!query.id) {
          return res.status(400).json({ success: false, message: 'Payment ID required' });
        }

        const paymentToDelete = await Payment.findById(query.id);
        if (!paymentToDelete) {
          return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Update invoice amounts
        const invoiceToUpdate = await Invoice.findById(paymentToDelete.invoice);
        if (invoiceToUpdate) {
          const updatedPaidAmount = invoiceToUpdate.paidAmount - paymentToDelete.amount;
          const updatedPendingAmount = invoiceToUpdate.grandTotal - updatedPaidAmount;
          
          let updatedStatus = 'pending';
          if (updatedPendingAmount <= 0) {
            updatedStatus = 'paid';
          } else if (updatedPaidAmount > 0) {
            updatedStatus = 'partial';
          }

          await Invoice.findByIdAndUpdate(paymentToDelete.invoice, {
            paidAmount: updatedPaidAmount,
            pendingAmount: updatedPendingAmount,
            paymentStatus: updatedStatus,
            status: updatedStatus === 'paid' ? 'paid' : 'pending'
          });
        }

        await Payment.findByIdAndDelete(query.id);
        return res.status(200).json({ success: true, message: 'Payment deleted' });

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Payment API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
