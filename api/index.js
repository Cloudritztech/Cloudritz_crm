import authHandler from './auth.js';
import adminHandler from './admin.js';
import productsHandler from './products.js';
import customersHandler from './customers.js';
import invoicesHandler from './invoices.js';
import reportsHandler from './reports.js';
import expensesHandler from './expenses.js';
import notificationsHandler from './notifications.js';
import accountHandler from './account.js';
import supportHandler from './support.js';
import backupHandler from './backup.js';

export default async function handler(req, res) {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  
  // Route to appropriate handler
  if (pathname.startsWith('/api/auth')) return authHandler(req, res);
  if (pathname.startsWith('/api/admin')) return adminHandler(req, res);
  if (pathname.startsWith('/api/products')) return productsHandler(req, res);
  if (pathname.startsWith('/api/customers')) return customersHandler(req, res);
  if (pathname.startsWith('/api/invoices')) return invoicesHandler(req, res);
  if (pathname.startsWith('/api/reports')) return reportsHandler(req, res);
  if (pathname.startsWith('/api/expenses')) return expensesHandler(req, res);
  if (pathname.startsWith('/api/notifications')) return notificationsHandler(req, res);
  if (pathname.startsWith('/api/account')) return accountHandler(req, res);
  if (pathname.startsWith('/api/support')) return supportHandler(req, res);
  if (pathname.startsWith('/api/backup')) return backupHandler(req, res);
  
  res.status(404).json({ error: 'Not found' });
}
