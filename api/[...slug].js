const app = require('../backend/server');

export default (req, res) => {
  // Set the request URL to match Express routing
  req.url = req.url.replace('/api', '');
  return app(req, res);
};