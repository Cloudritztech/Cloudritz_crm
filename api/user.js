import connectDB from '../lib/mongodb.js';
import User from '../lib/models/User.js';
import { authenticate } from '../lib/middleware/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await connectDB();

  if (req.method === 'PUT') {
    try {
      const authResult = await authenticate(req);
      if (!authResult.success) {
        return res.status(401).json({ message: authResult.message });
      }

      const { profileImage } = req.body;
      
      const user = await User.findByIdAndUpdate(
        authResult.userId,
        { profileImage },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage || ''
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
