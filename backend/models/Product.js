const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['tiles', 'sanitary', 'wpc_doors', 'accessories']
  },
  hsnCode: { type: String, default: '6907' }, // Default HSN for tiles
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  minStock: { type: Number, default: 10 },
  description: String,
  brand: String,
  size: String,
  color: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.virtual('profit').get(function() {
  return this.sellingPrice - this.purchasePrice;
});

productSchema.virtual('profitPercentage').get(function() {
  return ((this.sellingPrice - this.purchasePrice) / this.purchasePrice) * 100;
});

module.exports = mongoose.model('Product', productSchema);