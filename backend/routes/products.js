const express = require('express');
const { 
  createProduct, 
  getProducts, 
  updateProduct, 
  deleteProduct, 
  getLowStockProducts,
  adjustStock 
} = require('../controllers/productController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/', createProduct);
router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.put('/:id', updateProduct);
router.put('/:id/adjust-stock', adjustStock);
router.delete('/:id', adminOnly, deleteProduct);

module.exports = router;