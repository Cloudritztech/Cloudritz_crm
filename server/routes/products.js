import express from 'express';
import productsHandler from '../../api/products.js';
const router = express.Router();
router.all('/', productsHandler);
export default router;
