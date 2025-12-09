import express from 'express';
import reportsHandler from '../../api/reports.js';
const router = express.Router();
router.all('/', reportsHandler);
export default router;
