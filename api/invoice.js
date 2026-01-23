import invoicesHandler from './invoices.js';

export default async function handler(req, res) {
  return invoicesHandler(req, res);
}