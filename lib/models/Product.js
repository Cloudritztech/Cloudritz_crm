import mongoose from 'mongoose';

const stockHistorySchema = new mongoose.Schema({
  type: { type: String, enum: ['IN', 'OUT'], required: true },
  qty: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  note: { type: String }
}, { _id: false });

const productSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true, trim: true },
  image: { type: String },
  unit: { 
    type: String, 
    enum: ['piece', 'box', 'set', 'kg', 'meter', 'packet', 'bundle', 'litre', 'sqft', 'sqm'],
    default: 'piece'
  },
  sellingPrice: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  stockSaleValue: { type: Number, default: 0 },
  stockPurchaseValue: { type: Number, default: 0 },
  taxIncluded: { type: Boolean, default: false },
  lowStockLimit: { type: Number, default: 10 },
  stockHistory: [stockHistorySchema],
  category: { 
    type: String, 
    enum: ['tiles', 'sanitary', 'wpc_doors', 'accessories'],
    default: 'accessories'
  },
  hsnCode: { type: String, default: '6907' },
  isActive: { type: Boolean, default: true },
  importedFromExcel: { type: Boolean, default: false }
}, { timestamps: true });

// Compound indexes for multi-tenant isolation and performance
productSchema.index({ organizationId: 1, name: 1 });
productSchema.index({ organizationId: 1, isActive: 1 });
productSchema.index({ organizationId: 1, category: 1 });
productSchema.index({ organizationId: 1, createdAt: -1 });

productSchema.pre('save', function(next) {
  this.stockSaleValue = this.stock * this.sellingPrice;
  this.stockPurchaseValue = this.stock * this.purchasePrice;
  next();
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;