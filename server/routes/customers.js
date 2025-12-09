import express from 'express';
import customersHandler from '../../api/customers.js';
const router = express.Router();
router.all('/', customersHandler);
export default router;
