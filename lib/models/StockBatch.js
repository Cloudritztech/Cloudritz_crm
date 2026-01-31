import mongoose from 'mongoose';

const stockBatchSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  purchasePrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 0 },
  remainingQuantity: { type: Number, required: true, min: 0 },
  purchaseDate: { type: Date, default: Date.now },
  supplier: String,
  batchNumber: String,
  expiryDate: Date,
  notes: String
}, { timestamps: true });

// Index for efficient FIFO queries
stockBatchSchema.index({ organizationId: 1, product: 1, purchaseDate: 1 });
stockBatchSchema.index({ organizationId: 1, product: 1, remainingQuantity: 1 });

export default mongoose.models.StockBatch || mongoose.model('StockBatch', stockBatchSchema);
