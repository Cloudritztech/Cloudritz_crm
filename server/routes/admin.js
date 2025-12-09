import express from 'express';
import adminHandler from '../../api/admin.js';
const router = express.Router();
router.all('/', adminHandler);
export default router;
