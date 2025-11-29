import { handleCors } from '../../lib/cors.js';

async function handler(req, res) {
  console.log('🧪 Dynamic test endpoint called');
  console.log('🧪 Method:', req.method);
  console.log('🧪 Query:', req.query);
  console.log('🧪 URL:', req.url);
  console.log('🧪 ID from query:', req.query.id);
  
  return res.status(200).json({
    success: true,
    message: 'Dynamic test endpoint working',
    id: req.query.id,
    method: req.method,
    query: req.query,
    url: req.url,
    timestamp: new Date().toISOString()
  });
}

export default function(req, res) {
  return handleCors(req, res, handler);
}