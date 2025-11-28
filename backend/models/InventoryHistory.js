const mongoose = require('mongoose');

const inventoryHistorySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['purchase', 'sale', 'adjustment'], required: true },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  reason: String,
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('InventoryHistory', inventoryHistorySchema);