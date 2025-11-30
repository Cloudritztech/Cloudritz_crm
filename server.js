import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

console.log('Environment variables loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Dynamic import API routes after env is loaded
const auth = (await import('./api/auth.js')).default;
const customers = (await import('./api/customers.js')).default;
const products = (await import('./api/products.js')).default;
const reports = (await import('./api/reports.js')).default;
const invoices = (await import('./api/invoices/index.js')).default;
const invoice = (await import('./api/invoice.js')).default;

// API Routes
app.all('/api/auth', auth);
app.all('/api/customers', customers);
app.all('/api/customers/:id', (req, res) => {
  req.params.id = req.params.id;
  customers(req, res);
});
app.all('/api/products', products);
app.all('/api/products/:id', (req, res) => {
  req.params.id = req.params.id;
  products(req, res);
});
app.all('/api/products/:id/:action', (req, res) => {
  req.params.id = req.params.id;
  req.params.action = req.params.action;
  products(req, res);
});
app.all('/api/reports', reports);
app.all('/api/invoices', invoices);
app.all('/api/invoice', invoice);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});