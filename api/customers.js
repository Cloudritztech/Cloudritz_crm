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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await connectDB();
  await runMiddleware(req, res, auth);

  const { method, query } = req;
  const { id } = query;

  // Handle specific customer operations (for both Express and Vercel routing)
  const customerId = id || req.params?.id;
  
  if (customerId && method === 'GET') {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      return res.json({ success: true, customer });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (customerId && method === 'PUT') {
    try {
      const customer = await Customer.findByIdAndUpdate(customerId, req.body, { new: true });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      return res.json({ success: true, customer });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Handle customer list operations
  switch (method) {
    case 'GET':
      try {
        const { search } = query;
        let queryObj = { isActive: true };
        
        if (search) {
          queryObj.$or = [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ];
        }

        const customers = await Customer.find(queryObj).sort({ createdAt: -1 });
        return res.json({ success: true, customers });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    case 'POST':
      try {
        const customer = await Customer.create(req.body);
        return res.status(201).json({ success: true, customer });
      } catch (error) {
        if (error.code === 11000) {
          return res.status(400).json({ message: 'Phone number already exists' });
        } else {
          return res.status(500).json({ message: error.message });
        }
      }

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}