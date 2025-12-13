import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Import API handlers
const importHandler = async (path) => {
  const module = await import(path);
  return module.default;
};

// API routes
app.all('/api/auth', async (req, res) => {
  const handler = await importHandler('./api/auth.js');
  return handler(req, res);
});

app.all('/api/admin', async (req, res) => {
  const handler = await importHandler('./api/admin.js');
  return handler(req, res);
});

app.all('/api/products', async (req, res) => {
  const handler = await importHandler('./api/products.js');
  return handler(req, res);
});

app.all('/api/customers', async (req, res) => {
  const handler = await importHandler('./api/customers.js');
  return handler(req, res);
});

app.all('/api/invoices', async (req, res) => {
  const handler = await importHandler('./api/invoices.js');
  return handler(req, res);
});

app.all('/api/reports', async (req, res) => {
  const handler = await importHandler('./api/reports.js');
  return handler(req, res);
});

app.all('/api/expenses', async (req, res) => {
  const handler = await importHandler('./api/expenses.js');
  return handler(req, res);
});

app.all('/api/notifications', async (req, res) => {
  const handler = await importHandler('./api/notifications.js');
  return handler(req, res);
});

app.all('/api/account', async (req, res) => {
  const handler = await importHandler('./api/account.js');
  return handler(req, res);
});

app.all('/api/support', async (req, res) => {
  const handler = await importHandler('./api/support.js');
  return handler(req, res);
});

app.all('/api/backup', async (req, res) => {
  const handler = await importHandler('./api/backup.js');
  return handler(req, res);
});

app.all('/api/health', async (req, res) => {
  const handler = await importHandler('./api/health.js');
  return handler(req, res);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Backend API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
