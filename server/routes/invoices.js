import express from 'express';
import invoicesHandler from '../../api/invoices.js';
const router = express.Router();
router.all('/', invoicesHandler);
export default router;
