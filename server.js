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
const authLogin = (await import('./api/auth/login.js')).default;
const authRegister = (await import('./api/auth/register.js')).default;
const customers = (await import('./api/customers/index.js')).default;
const products = (await import('./api/products/index.js')).default;
const invoices = (await import('./api/invoices/index.js')).default;
const invoiceById = (await import('./api/invoices/[id].js')).default;
const invoicePdf = (await import('./api/invoices/[id]/pdf.js')).default;
const dashboard = (await import('./api/reports/dashboard.js')).default;
const health = (await import('./api/health.js')).default;

// API Routes
app.all('/api/auth/login', authLogin);
app.all('/api/auth/register', authRegister);
app.all('/api/customers', customers);
app.all('/api/products', products);
app.all('/api/invoices', invoices);
app.all('/api/invoices/:id', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  invoiceById(req, res);
});
app.all('/api/invoices/:id/pdf', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  invoicePdf(req, res);
});
app.all('/api/reports/dashboard', dashboard);
app.all('/api/health', health);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});