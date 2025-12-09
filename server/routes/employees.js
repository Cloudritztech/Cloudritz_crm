import express from 'express';
import employeesHandler from '../../api/employees.js';
const router = express.Router();
router.all('/', employeesHandler);
export default router;
