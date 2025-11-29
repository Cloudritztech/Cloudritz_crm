import connectDB from '../../lib/mongodb.js';
import Customer from '../../lib/models/Customer.js';
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

  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { search } = req.query;
        let query = { isActive: true };
        
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ];
        }

        const customers = await Customer.find(query).sort({ createdAt: -1 });
        res.json({ success: true, customers });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
      break;

    case 'POST':
      try {
        const customer = await Customer.create(req.body);
        res.status(201).json({ success: true, customer });
      } catch (error) {
        if (error.code === 11000) {
          res.status(400).json({ message: 'Phone number already exists' });
        } else {
          res.status(500).json({ message: error.message });
        }
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default function(req, res) {
  return handleCors(req, res, handler);
}