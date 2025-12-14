import connectDB from '../lib/mongodb.js';
import Customer from '../lib/models/Customer.js';
import { authenticate, tenantIsolation } from '../lib/middleware/tenant.js';

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    
    await authenticate(req, res, async () => {
      await tenantIsolation(req, res, async () => {

    const { method, query } = req;
    const { id } = query;
    
    // Handle both Express params and Vercel query params
    const customerId = id || req.params?.id;
    
    if (customerId && method === 'GET') {
      try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
          return res.status(404).json({ 
            success: false,
            message: 'Customer not found' 
          });
        }
        return res.json({ success: true, customer });
      } catch (error) {
        return res.status(500).json({ 
          success: false,
          message: error.message 
        });
      }
    }

    if (customerId && method === 'PUT') {
      try {
        const customer = await Customer.findByIdAndUpdate(customerId, req.body, { new: true });
        if (!customer) {
          return res.status(404).json({ 
            success: false,
            message: 'Customer not found' 
          });
        }
        return res.json({ success: true, customer });
      } catch (error) {
        return res.status(500).json({ 
          success: false,
          message: error.message 
        });
      }
    }

    // Handle customer list operations
    switch (method) {
      case 'GET':
        try {
          const { search } = query;
          let queryObj = {};
          
          if (search) {
            queryObj.$or = [
              { name: { $regex: search, $options: 'i' } },
              { phone: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } }
            ];
          }

          if (req.organizationId) {
            queryObj.organizationId = req.organizationId;
          }
          const customers = await Customer.find(queryObj).sort({ createdAt: -1 });
          
          return res.json({ success: true, customers });
        } catch (error) {
          return res.status(500).json({ 
            success: false,
            message: error.message 
          });
        }

      case 'POST':
        try {
          const customer = await Customer.create({ ...req.body, organizationId: req.organizationId });
          
          return res.status(201).json({ success: true, customer });
        } catch (error) {
          if (error.code === 11000) {
            return res.status(400).json({ 
              success: false,
              message: 'Phone number already exists' 
            });
          } else {
            return res.status(500).json({ 
              success: false,
              message: error.message 
            });
          }
        }

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}