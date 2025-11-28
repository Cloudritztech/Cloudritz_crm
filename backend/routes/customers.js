const express = require('express');
const { 
  createCustomer, 
  getCustomers, 
  getCustomerById, 
  updateCustomer, 
  getCustomerPurchaseHistory 
} = require('../controllers/customerController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/', createCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.get('/:id/purchases', getCustomerPurchaseHistory);

module.exports = router;