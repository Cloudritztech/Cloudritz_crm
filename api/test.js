import connectDB from '../lib/mongodb.js';
import User from '../lib/models/User.js';

export default async function handler(req, res) {
  try {
    await connectDB();
    const count = await User.countDocuments();
    const superadmin = await User.findOne({ role: 'superadmin' });
    
    res.json({ 
      success: true, 
      message: 'DB connected',
      userCount: count,
      hasSuperadmin: !!superadmin,
      env: {
        hasMongoUri: !!process.env.MONGODB_URI,
        hasJwtSecret: !!process.env.JWT_SECRET
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
