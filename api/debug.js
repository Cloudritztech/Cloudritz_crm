export default function handler(req, res) {
  res.status(200).json({
    message: 'Debug endpoint',
    hasMongoUri: !!process.env.MONGODB_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV
  });
}