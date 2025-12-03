import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware - checking token...');
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('🔐 Auth header present:', !!authHeader);
    console.log('🔐 Token extracted:', !!token);
    
    if (!token) {
      console.log('❌ Auth failed: No token provided');
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded successfully, userId:', decoded.userId);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('❌ Auth failed: User not found');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token.' 
      });
    }

    console.log('✅ Auth successful for user:', user.name);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    res.status(401).json({ 
      success: false,
      message: 'Invalid token.',
      error: error.message 
    });
  }
};

