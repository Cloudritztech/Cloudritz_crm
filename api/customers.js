import connectDB from '../lib/mongodb.js';
import Customer from '../lib/models/Customer.js';
import { auth } from '../lib/middleware/auth.js';

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
    console.log('👥 Customer API called:', req.method);
    await connectDB();
    console.log('✅ Database connected');
    
    await runMiddleware(req, res, auth);
    console.log('✅ Authentication passed');

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
        console.error('❌ Error fetching customer:', error);
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
        console.error('❌ Error updating customer:', error);
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
          let queryObj = { isActive: true };
          
          if (search) {
            queryObj.$or = [
              { name: { $regex: search, $options: 'i' } },
              { phone: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } }
            ];
          }

          console.log('🔍 Fetching customers with query:', queryObj);
          const customers = await Customer.find(queryObj).sort({ createdAt: -1 });
          console.log(`✅ Found ${customers.length} customers`);
          
          return res.json({ success: true, customers });
        } catch (error) {
          console.error('❌ Error fetching customers:', error);
          return res.status(500).json({ 
            success: false,
            message: error.message 
          });
        }

      case 'POST':
        try {
          console.log('📝 Creating customer:', req.body);
          const customer = await Customer.create(req.body);
          console.log('✅ Customer created:', customer.name);
          return res.status(201).json({ success: true, customer });
        } catch (error) {
          console.error('❌ Error creating customer:', error);
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
        return res.status(405).json({ 
          success: false,
          message: 'Method not allowed' 
        });
    }
  } catch (error) {
    console.error('❌ Customer handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}