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
  await connectDB();
  await runMiddleware(req, res, auth);

  const { method, query: { id } } = req;

  switch (method) {
    case 'GET':
      try {
        const invoice = await Invoice.findById(id)
          .populate('customer', 'name phone address')
          .populate('items.product', 'name category hsnCode')
          .populate('createdBy', 'name');

        if (!invoice) {
          return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json({ success: true, invoice });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default function(req, res) {
  return handleCors(req, res, handler);
}