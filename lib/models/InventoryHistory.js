import mongoose from 'mongoose';

const inventoryHistorySchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['sale', 'purchase', 'adjustment'], required: true },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  reason: String,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

inventoryHistorySchema.index({ organizationId: 1, product: 1, createdAt: -1 });

export default mongoose.models.InventoryHistory || mongoose.model('InventoryHistory', inventoryHistorySchema);