import express from 'express';
import expensesHandler from '../../api/expenses.js';
const router = express.Router();
router.all('/', expensesHandler);
export default router;
