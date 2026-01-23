import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// Import API handlers
const apiHandlers = {
  auth: (await import('./api/auth.js')).default,
  products: (await import('./api/products.js')).default,
  customers: (await import('./api/customers.js')).default,
  invoices: (await import('./api/invoices.js')).default,
  invoice: (await import('./api/invoice.js')).default,
  expenses: (await import('./api/expenses.js')).default,
  reports: (await import('./api/reports.js')).default,
  support: (await import('./api/support.js')).default,
  notifications: (await import('./api/notifications.js')).default,
  account: (await import('./api/account.js')).default,
  admin: (await import('./api/admin.js')).default,
};

// Route all API requests
Object.entries(apiHandlers).forEach(([route, handler]) => {
  app.use(`/api/${route}`, handler);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});
