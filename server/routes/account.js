import express from 'express';
import accountHandler from '../../api/account.js';
const router = express.Router();
router.all('/', accountHandler);
export default router;
