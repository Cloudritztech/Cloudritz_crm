import { handleCors } from '../lib/cors.js';

async function handler(req, res) {
  console.log('🧪 Test endpoint called');
  console.log('🧪 Method:', req.method);
  console.log('🧪 Query:', req.query);
  console.log('🧪 URL:', req.url);
  
  return res.status(200).json({
    success: true,
    message: 'Test endpoint working',
    method: req.method,
    query: req.query,
    url: req.url,
    timestamp: new Date().toISOString()
  });
}

export default function(req, res) {
  return handleCors(req, res, handler);
}