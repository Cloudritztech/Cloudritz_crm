const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');

const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, customer });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCustomerPurchaseHistory = async (req, res) => {
  try {
    const invoices = await Invoice.find({ customer: req.params.id })
      .populate('items.product', 'name category')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCustomer, getCustomers, getCustomerById, updateCustomer, getCustomerPurchaseHistory };