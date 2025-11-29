import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['tiles', 'sanitary', 'wpc_doors', 'accessories']
  },
  hsnCode: { type: String, default: '6907' },
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

export default mongoose.models.Product || mongoose.model('Product', productSchema);