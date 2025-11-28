const express = require('express');
const { 
  getSalesReport, 
  getProfitReport, 
  getTopSellingProducts, 
  getDashboardStats 
} = require('../controllers/reportController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/sales', getSalesReport);
router.get('/profit', getProfitReport);
router.get('/top-products', getTopSellingProducts);
router.get('/dashboard', getDashboardStats);

module.exports = router;