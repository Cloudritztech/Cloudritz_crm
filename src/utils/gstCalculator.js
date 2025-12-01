/**
 * Professional GST & Discount Calculator
 * Follows Indian GST rules (CGST 9% + SGST 9% = 18%)
 */

export const GST_RATE = {
  CGST: 9, // Central GST
  SGST: 9, // State GST
  TOTAL: 18 // Combined GST
};

/**
 * Calculate invoice totals with GST and discount
 * @param {Array} items - Invoice items [{quantity, price}]
 * @param {Boolean} gstEnabled - Apply GST or not
 * @param {Boolean} gstCompensated - Auto-discount to offset GST
 * @param {Number} manualDiscount - User-entered discount amount
 * @returns {Object} Complete calculation breakdown
 */
export const calculateInvoice = (items = [], gstEnabled = false, gstCompensated = false, manualDiscount = 0) => {
  // Step 1: Calculate subtotal (sum of all items)
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);

  // Step 2: Calculate GST (only if enabled)
  let cgst = 0;
  let sgst = 0;
  let totalGst = 0;

  if (gstEnabled) {
    cgst = (subtotal * GST_RATE.CGST) / 100;
    sgst = (subtotal * GST_RATE.SGST) / 100;
    totalGst = cgst + sgst;
  }

  // Step 3: Calculate discount
  let autoDiscount = 0;
  
  if (gstEnabled && gstCompensated) {
    // Auto-discount equals GST amount to keep total same
    autoDiscount = totalGst;
  }

  const totalDiscount = manualDiscount + autoDiscount;

  // Step 4: Calculate final total
  const total = subtotal + totalGst - totalDiscount;

  // Return complete breakdown
  return {
    subtotal: roundToTwo(subtotal),
    cgst: roundToTwo(cgst),
    sgst: roundToTwo(sgst),
    totalGst: roundToTwo(totalGst),
    manualDiscount: roundToTwo(manualDiscount),
    autoDiscount: roundToTwo(autoDiscount),
    totalDiscount: roundToTwo(totalDiscount),
    total: roundToTwo(total),
    
    // Additional info
    taxableValue: roundToTwo(subtotal), // For GST calculation base
    gstRate: gstEnabled ? GST_RATE.TOTAL : 0
  };
};

/**
 * Round to 2 decimal places
 */
const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount) => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Validate invoice data
 */
export const validateInvoice = (items, gstEnabled, gstCompensated, manualDiscount) => {
  const errors = [];

  if (!items || items.length === 0) {
    errors.push('At least one item is required');
  }

  items.forEach((item, index) => {
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Invalid quantity`);
    }
    if (!item.price || item.price <= 0) {
      errors.push(`Item ${index + 1}: Invalid price`);
    }
  });

  if (manualDiscount < 0) {
    errors.push('Discount cannot be negative');
  }

  if (gstCompensated && !gstEnabled) {
    errors.push('Cannot compensate GST when GST is not enabled');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};