const Product = require('../models/Product');
const InventoryHistory = require('../models/InventoryHistory');

const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    
    await InventoryHistory.create({
      product: product._id,
      type: 'adjustment',
      quantity: product.stock,
      previousStock: 0,
      newStock: product.stock,
      reason: 'Initial stock',
      updatedBy: req.user._id
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const { category, lowStock, search } = req.query;
    let query = { isActive: true };
    
    if (category) query.category = category;
    if (lowStock === 'true') query.$expr = { $lte: ['$stock', '$minStock'] };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const previousStock = product.stock;
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (previousStock !== updatedProduct.stock) {
      await InventoryHistory.create({
        product: updatedProduct._id,
        type: 'adjustment',
        quantity: updatedProduct.stock - previousStock,
        previousStock,
        newStock: updatedProduct.stock,
        reason: 'Manual adjustment',
        updatedBy: req.user._id
      });
    }

    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$minStock'] }
    });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const adjustStock = async (req, res) => {
  try {
    const { adjustment, reason } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const previousStock = product.stock;
    const newStock = previousStock + adjustment;
    
    if (newStock < 0) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    product.stock = newStock;
    await product.save();

    await InventoryHistory.create({
      product: product._id,
      type: 'adjustment',
      quantity: adjustment,
      previousStock,
      newStock,
      reason: reason || (adjustment > 0 ? 'Stock increase' : 'Offline sale'),
      updatedBy: req.user._id
    });

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createProduct, getProducts, updateProduct, deleteProduct, getLowStockProducts, adjustStock };