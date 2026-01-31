import StockBatch from '../models/StockBatch.js';

/**
 * Add new stock batch when purchasing inventory
 */
export async function addStockBatch(organizationId, productId, quantity, purchasePrice, metadata = {}) {
  const batch = await StockBatch.create({
    organizationId,
    product: productId,
    purchasePrice,
    quantity,
    remainingQuantity: quantity,
    supplier: metadata.supplier,
    batchNumber: metadata.batchNumber,
    expiryDate: metadata.expiryDate,
    notes: metadata.notes
  });
  
  return batch;
}

/**
 * Deduct stock using FIFO method and return COGS breakdown
 */
export async function deductStockFIFO(organizationId, productId, quantityToDeduct) {
  const batches = await StockBatch.find({
    organizationId,
    product: productId,
    remainingQuantity: { $gt: 0 }
  }).sort({ purchaseDate: 1 });

  if (batches.length === 0) {
    throw new Error('No stock batches available');
  }

  let remainingToDeduct = quantityToDeduct;
  const usedBatches = [];
  let totalCOGS = 0;

  for (const batch of batches) {
    if (remainingToDeduct <= 0) break;

    const quantityFromBatch = Math.min(batch.remainingQuantity, remainingToDeduct);
    const cogsFromBatch = quantityFromBatch * batch.purchasePrice;

    batch.remainingQuantity -= quantityFromBatch;
    await batch.save();

    usedBatches.push({
      batchId: batch._id,
      quantity: quantityFromBatch,
      purchasePrice: batch.purchasePrice,
      cogs: cogsFromBatch
    });

    totalCOGS += cogsFromBatch;
    remainingToDeduct -= quantityFromBatch;
  }

  if (remainingToDeduct > 0) {
    throw new Error(`Insufficient stock. Short by ${remainingToDeduct} units`);
  }

  return {
    usedBatches,
    totalCOGS,
    averageCOGS: totalCOGS / quantityToDeduct
  };
}

/**
 * Restore stock to batches (for invoice cancellation/update)
 */
export async function restoreStockFIFO(usedBatches) {
  for (const used of usedBatches) {
    const batch = await StockBatch.findById(used.batchId);
    if (batch) {
      batch.remainingQuantity += used.quantity;
      await batch.save();
    }
  }
}

/**
 * Get weighted average purchase price for a product
 */
export async function getAveragePurchasePrice(organizationId, productId) {
  const batches = await StockBatch.find({
    organizationId,
    product: productId,
    remainingQuantity: { $gt: 0 }
  });

  if (batches.length === 0) return 0;

  let totalValue = 0;
  let totalQuantity = 0;

  for (const batch of batches) {
    totalValue += batch.remainingQuantity * batch.purchasePrice;
    totalQuantity += batch.remainingQuantity;
  }

  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
}
