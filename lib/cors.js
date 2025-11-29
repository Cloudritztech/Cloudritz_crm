export function setCorsHeaders(res) {
  // Allow all origins in production (Vercel handles this securely)
  const origin = '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false'); // Set to false when origin is *
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
}

export function handleCors(req, res, handler) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return handler(req, res);
}