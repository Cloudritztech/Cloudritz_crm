import { handleCors } from '../lib/cors.js';

async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      res.json({ 
        success: true, 
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
      break;

    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default function(req, res) {
  return handleCors(req, res, handler);
}