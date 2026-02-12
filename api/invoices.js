import connectDB from '../lib/mongodb.js';
import Invoice from '../lib/models/Invoice.js';
import Customer from '../lib/models/Customer.js';
import Product from '../lib/models/Product.js';
import InventoryHistory from '../lib/models/InventoryHistory.js';
import { authenticate, tenantIsolation, checkSubscriptionLimit } from '../lib/middleware/tenant.js';
import { generateInvoicePDF } from '../lib/pdfGenerator.js';
import { numberToWords } from '../lib/numberToWords.js';
import { notifyInvoiceCreated, notifyPaymentReceived } from '../lib/services/notificationService.js';


async function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    console.log('🚀 Invoice API called:', req.method, req.url);
    
    await connectDB();
    console.log('✅ Database connected');
    
    await authenticate(req, res, async () => {
      console.log('✅ Authentication passed, user:', req.userId);
      console.log('✅ Organization ID:', req.organizationId);
      
      await tenantIsolation(req, res, async () => {
        console.log('✅ Tenant isolation passed');

        const { method, query } = req;
        const { id, action } = query;

        // Payment operations
        if (action === 'payment') {
          if (method === 'PUT' && id) return await updateInvoicePayment(req, res, id);
          return res.status(405).json({ success: false, message: 'Method not allowed' });
        }

        // PDF generation
        if (action === 'pdf' && id) {
          if (method === 'GET') return await generatePDF(req, res, id);
          return res.status(405).json({ success: false, message: 'Method not allowed' });
        }

        // Single invoice operations
        if (id) {
          if (method === 'GET') return await getInvoice(req, res, id);
          if (method === 'PUT') return await updateInvoice(req, res, id);
          if (method === 'DELETE') return await deleteInvoice(req, res, id);
          return res.status(405).json({ success: false, message: 'Method not allowed' });
        }

        // List/Create invoices
        if (method === 'GET') {
          console.log('📋 Calling listInvoices...');
          return await listInvoices(req, res, query);
        }
        if (method === 'POST') {
          await checkSubscriptionLimit('invoices')(req, res, async () => {
            return await createInvoice(req, res);
          });
          return;
        }

        return res.status(405).json({ success: false, message: 'Method not allowed' });
      });
    });
  } catch (error) {
    console.error('❌ Invoice API error:', error);
    console.error('❌ Error stack:', error.stack);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}

// List invoices
async function listInvoices(req, res, query) {
  try {
    console.log('📋 Fetching invoices list...');
    console.log('🔍 Organization ID:', req.organizationId);
    console.log('🔍 Query params:', query);
    
    if (!req.organizationId) {
      console.error('❌ No organization ID found');
      return res.status(400).json({ success: false, message: 'Organization ID required' });
    }
    
    const { search, status, startDate, endDate, customer, limit = 50 } = query;
    const filter = { organizationId: req.organizationId };
    
    if (customer) filter.customer = customer;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    if (search) {
      try {
        console.log('🔍 Searching customers with term:', search);
        const customers = await Customer.find({
          organizationId: req.organizationId,
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
          ]
        }).select('_id').lean();
        
        console.log('✅ Found customers:', customers.length);
        
        filter.$or = [
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { customer: { $in: customers.map(c => c._id) } }
        ];
      } catch (searchError) {
        console.warn('⚠️ Search error, continuing without search:', searchError.message);
      }
    }

    console.log('🔍 Final query filter:', JSON.stringify(filter));

    const invoices = await Invoice.find(filter)
      .populate('customer', 'name phone')
      .select('invoiceNumber customer total grandTotal paymentStatus status paidAmount pendingAmount createdAt paymentDate paymentMethod')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    console.log(`✅ Found ${invoices.length} invoices`);

    return res.status(200).json({ success: true, invoices });
  } catch (error) {
    console.error('❌ List invoices error:', error);
    console.error('❌ Error stack:', error.stack);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch invoices', 
      error: error.message 
    });
  }
}

// Get single invoice
async function getInvoice(req, res, id) {
  try {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid invoice ID' });
    }

    const invoice = await Invoice.findById(id)
      .populate('customer', 'name phone address')
      .populate('items.product', 'name category hsnCode brand')
      .populate('createdBy', 'name')
      .lean();

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    return res.status(200).json({ success: true, invoice });
  } catch (error) {
    console.error('❌ Get invoice error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Generate PDF
async function generatePDF(req, res, id) {
  try {
    const invoice = await Invoice.findById(id)
      .populate('customer', 'name phone address')
      .populate('items.product', 'name category brand hsnCode')
      .populate('createdBy', 'name')
      .lean();

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Fetch business profile and settings
    const User = (await import('../lib/models/User.js')).default;
    const user = await User.findById(req.user._id).select('businessProfile settings').lean();
    const profile = user?.businessProfile || {};
    const settings = user?.settings || {};

    // Add company and bank details to invoice
    invoice.companyDetails = {
      name: profile.businessName || '',
      address: profile.address || '',
      gstin: profile.gstin || '',
      state: profile.state || '',
      stateCode: profile.stateCode || '',
      mobile: profile.phone || '',
      email: profile.email || '',
      logo: profile.logo || ''
    };

    invoice.bankDetails = {
      bankName: profile.bankName || '',
      accountNo: profile.accountNumber || '',
      ifscCode: profile.ifscCode || '',
      branch: profile.branch || ''
    };

    const template = settings.template || 'compact';
    const pdfBuffer = await generateInvoicePDF(invoice, template);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Create invoice
async function createInvoice(req, res) {
  try {
    if (!req.organizationId) {
      return res.status(400).json({ success: false, message: 'Organization ID is required. Please ensure you are logged in properly.' });
    }

    const {
      customer, items, discount = 0, discountType = 'amount', applyGST = true,
      paymentMethod = 'cash', paymentStatus = 'unpaid', paidAmount = 0, notes = '', dueDate, terms, buyerDetails,
      destination, deliveryNote, referenceNo, buyerOrderNo
    } = req.body;

    if (!customer || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer and items required' });
    }

    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    let grossAmount = 0;
    let itemDiscountTotal = 0;
    const processedItems = [];

    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity <= 0 || !item.price || item.price < 0) {
        return res.status(400).json({ success: false, message: 'Invalid item data' });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      const qty = parseFloat(item.quantity);
      const price = parseFloat(item.price);
      const itemGross = qty * price;
      grossAmount += itemGross;

      const itemDiscount = parseFloat(item.discount) || 0;
      const itemDiscountType = item.discountType || 'amount';
      let discountAmount = 0;

      if (itemDiscountType === 'percentage') {
        discountAmount = (itemGross * itemDiscount) / 100;
      } else {
        discountAmount = itemDiscount;
      }

      itemDiscountTotal += discountAmount;
      const taxableValue = itemGross - discountAmount;

      const cgstAmount = applyGST ? (taxableValue * 9) / 100 : 0;
      const sgstAmount = applyGST ? (taxableValue * 9) / 100 : 0;
      const itemTotal = taxableValue + cgstAmount + sgstAmount;

      processedItems.push({
        product: product._id,
        productRef: product, // Store product reference for later stock update
        quantity: qty,
        price: price,
        purchasePrice: product.purchasePrice, // Store purchase price at time of sale
        discount: itemDiscount,
        discountType: itemDiscountType,
        taxableValue: parseFloat(taxableValue.toFixed(2)),
        cgstRate: 9,
        sgstRate: 9,
        cgstAmount: parseFloat(cgstAmount.toFixed(2)),
        sgstAmount: parseFloat(sgstAmount.toFixed(2)),
        total: parseFloat(itemTotal.toFixed(2))
      });
    }

    let additionalDiscount = parseFloat(discount) || 0;
    let amountAfterItemDiscount = grossAmount - itemDiscountTotal;

    if (discountType === 'percentage') {
      additionalDiscount = (amountAfterItemDiscount * additionalDiscount) / 100;
    }

    let taxableAmount = grossAmount - itemDiscountTotal - additionalDiscount;

    let totalCgst = 0;
    let totalSgst = 0;
    let totalGst = 0;

    if (applyGST) {
      totalCgst = (taxableAmount * 9) / 100;
      totalSgst = (taxableAmount * 9) / 100;
      totalGst = totalCgst + totalSgst;
    }

    let subtotal = applyGST ? (taxableAmount + totalGst) : taxableAmount;
    const roundOff = Math.round(subtotal) - subtotal;
    const grandTotal = Math.round(subtotal);
    const amountInWords = numberToWords(grandTotal);

    // Create invoice items without productRef
    const invoiceItems = processedItems.map(({ productRef, ...item }) => item);

    // Generate invoice number manually as fallback
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;
    
    const startOfMonth = new Date(year, date.getMonth(), 1);
    const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);
    
    const monthCount = await Invoice.countDocuments({
      organizationId: req.organizationId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const invoiceNumber = `${yearMonth}-${String(monthCount + 1).padStart(3, '0')}`;

    const invoiceData = {
      invoiceNumber,
      organizationId: req.organizationId,
      customer,
      buyerDetails: {
        name: customerExists.name,
        address: buyerDetails?.street ?
          `${buyerDetails.street}, ${buyerDetails.city || ''}, ${buyerDetails.state || 'UTTAR PRADESH'} ${buyerDetails.pincode || ''}` :
          customerExists.address?.street || 'Address not provided',
        mobile: customerExists.phone,
        gstin: buyerDetails?.gstin || 'N/A',
        state: buyerDetails?.state || customerExists.address?.state || 'UTTAR PRADESH',
        stateCode: '09'
      },
      consigneeDetails: {
        name: customerExists.name,
        address: buyerDetails?.street ?
          `${buyerDetails.street}, ${buyerDetails.city || ''}, ${buyerDetails.state || 'UTTAR PRADESH'} ${buyerDetails.pincode || ''}` :
          customerExists.address?.street || 'Address not provided',
        mobile: customerExists.phone,
        gstin: buyerDetails?.gstin || 'N/A',
        state: buyerDetails?.state || customerExists.address?.state || 'UTTAR PRADESH',
        stateCode: '09'
      },
      modeOfPayment: paymentMethod,
      destination: destination || '',
      deliveryNote: deliveryNote || '',
      referenceNo: referenceNo || '',
      buyerOrderNo: buyerOrderNo || '',
      items: invoiceItems,
      subtotal: parseFloat(grossAmount.toFixed(2)),
      totalTaxableAmount: parseFloat(taxableAmount.toFixed(2)),
      totalCgst: parseFloat(totalCgst.toFixed(2)),
      totalSgst: parseFloat(totalSgst.toFixed(2)),
      tax: parseFloat(totalGst.toFixed(2)),
      discount: parseFloat(additionalDiscount.toFixed(2)),
      discountType: discountType,
      applyGST: applyGST,
      roundOff: parseFloat(roundOff.toFixed(2)),
      grandTotal: grandTotal,
      total: grandTotal,
      amountInWords: amountInWords,
      paymentMethod: paymentMethod,
      notes: notes || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      terms: terms || '',
      createdBy: req.userId || null
    };

    // Set payment status based on selection and amount
    const paidAmountValue = parseFloat(paidAmount) || 0;
    
    if (paymentStatus === 'paid' || paidAmountValue >= grandTotal) {
      invoiceData.paymentStatus = 'paid';
      invoiceData.status = 'paid';
      invoiceData.paidAmount = grandTotal;
      invoiceData.pendingAmount = 0;
      invoiceData.paymentDate = new Date();
      invoiceData.payments = [{
        amount: grandTotal,
        date: new Date(),
        method: paymentMethod,
        reference: 'Full payment',
        notes: 'Paid during invoice creation',
        collectedBy: req.userId
      }];
    } else if (paymentStatus === 'partial' || (paidAmountValue > 0 && paidAmountValue < grandTotal)) {
      invoiceData.paymentStatus = 'partial';
      invoiceData.status = 'partial';
      invoiceData.paidAmount = paidAmountValue;
      invoiceData.pendingAmount = grandTotal - paidAmountValue;
      invoiceData.paymentDate = paidAmountValue > 0 ? new Date() : null;
      invoiceData.payments = paidAmountValue > 0 ? [{
        amount: paidAmountValue,
        date: new Date(),
        method: paymentMethod,
        reference: 'Advance payment',
        notes: 'Partial payment during invoice creation',
        collectedBy: req.userId
      }] : [];
    } else {
      // paymentStatus is 'unpaid' or paidAmount is 0
      invoiceData.paymentStatus = 'unpaid';
      invoiceData.status = 'pending';
      invoiceData.paidAmount = 0;
      invoiceData.pendingAmount = grandTotal;
      invoiceData.payments = [];
    }

    const invoice = await Invoice.create(invoiceData);

    try {
      await Customer.findByIdAndUpdate(customer, {
        $inc: { totalPurchases: grandTotal },
        lastPurchaseDate: new Date()
      });
    } catch (custErr) {
      console.warn('⚠️ Failed to update customer:', custErr.message);
    }

    // Invoice created successfully - batch update stock, prices and log history
    const bulkProductOps = [];
    const inventoryHistoryOps = [];

    for (const item of processedItems) {
      if (item.productRef) {
        const previousStock = item.productRef.stock;
        const newStock = previousStock - item.quantity;
        
        // Batch product updates
        const updateFields = { stock: newStock };
        if (item.price !== item.productRef.sellingPrice) {
          updateFields.sellingPrice = item.price;
        }
        
        bulkProductOps.push({
          updateOne: {
            filter: { _id: item.product },
            update: { $set: updateFields }
          }
        });

        // Batch inventory history
        inventoryHistoryOps.push({
          organizationId: req.organizationId,
          product: item.product,
          type: 'sale',
          quantity: -item.quantity,
          previousStock: previousStock,
          newStock: newStock,
          reason: `Sale via invoice ${invoiceNumber}`,
          updatedBy: req.userId || null
        });
      }
    }

    // Execute batch operations
    if (bulkProductOps.length > 0) {
      await Product.bulkWrite(bulkProductOps);
    }
    if (inventoryHistoryOps.length > 0) {
      await InventoryHistory.insertMany(inventoryHistoryOps);
    }

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer', 'name phone address')
      .populate('items.product', 'name category')
      .populate('createdBy', 'name');

    // Create notification
    try {
      await notifyInvoiceCreated(req.organizationId, populatedInvoice, customerExists);
    } catch (notifErr) {
      console.warn('⚠️ Failed to create notification:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice: populatedInvoice
    });
  } catch (error) {
    console.error('❌ Create invoice error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Update invoice
async function updateInvoice(req, res, id) {
  try {
    console.log('🔄 Starting invoice update for ID:', id);
    
    const existingInvoice = await Invoice.findById(id);
    if (!existingInvoice) {
      console.log('❌ Invoice not found:', id);
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    console.log('✅ Found existing invoice:', existingInvoice.invoiceNumber);

    const {
      customer, items, discount = 0, discountType = 'amount', applyGST = true,
      paymentMethod = 'cash', paymentStatus = 'unpaid', paidAmount = 0, notes = '', dueDate, terms, buyerDetails,
      destination, deliveryNote, referenceNo, buyerOrderNo
    } = req.body;

    console.log('📝 Request data:', { customer, itemsCount: items?.length, discount, paymentStatus });

    if (!customer || !items || items.length === 0) {
      console.log('❌ Missing required data');
      return res.status(400).json({ success: false, message: 'Customer and items required' });
    }

    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      console.log('❌ Customer not found:', customer);
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    console.log('✅ Customer found:', customerExists.name);
    
    // Fetch current stock BEFORE any changes for accurate history
    const stockBeforeUpdate = new Map();
    for (const oldItem of existingInvoice.items) {
      const product = await Product.findById(oldItem.product);
      if (product) {
        stockBeforeUpdate.set(oldItem.product.toString(), product.stock);
      }
    }
    
    console.log('🔄 Restoring stock for old items...');

    // Restore stock for old items
    for (const oldItem of existingInvoice.items) {
      try {
        const product = await Product.findById(oldItem.product);
        if (product) {
          product.stock += oldItem.quantity;
          await product.save();
          console.log(`✅ Restored ${oldItem.quantity} units for ${product.name}`);
        }
      } catch (stockError) {
        console.error('❌ Error restoring stock:', stockError);
        throw stockError;
      }
    }

    console.log('🔄 Processing new items...');

    // Process new items (same logic as create)
    let grossAmount = 0;
    let itemDiscountTotal = 0;
    const processedItems = [];

    for (const item of items) {
      console.log('📝 Processing item:', { product: item.product, quantity: item.quantity, price: item.price });
      
      if (!item.product || !item.quantity || item.quantity <= 0 || !item.price || item.price < 0) {
        console.log('❌ Invalid item data:', item);
        return res.status(400).json({ success: false, message: 'Invalid item data' });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        console.log('❌ Product not found:', item.product);
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      }

      // Skip stock validation during update since we restored stock first
      console.log(`✅ Product found: ${product.name}, stock: ${product.stock}`);

      const qty = parseFloat(item.quantity);
      const price = parseFloat(item.price);
      const itemGross = qty * price;
      grossAmount += itemGross;

      const itemDiscount = parseFloat(item.discount) || 0;
      const itemDiscountType = item.discountType || 'amount';
      let discountAmount = 0;

      if (itemDiscountType === 'percentage') {
        discountAmount = (itemGross * itemDiscount) / 100;
      } else {
        discountAmount = itemDiscount;
      }

      itemDiscountTotal += discountAmount;
      const taxableValue = itemGross - discountAmount;

      const cgstAmount = applyGST ? (taxableValue * 9) / 100 : 0;
      const sgstAmount = applyGST ? (taxableValue * 9) / 100 : 0;
      const itemTotal = taxableValue + cgstAmount + sgstAmount;

      processedItems.push({
        product: product._id,
        productRef: product,
        quantity: qty,
        price: price,
        purchasePrice: product.purchasePrice, // Store purchase price at time of sale
        discount: itemDiscount,
        discountType: itemDiscountType,
        taxableValue: parseFloat(taxableValue.toFixed(2)),
        cgstRate: 9,
        sgstRate: 9,
        cgstAmount: parseFloat(cgstAmount.toFixed(2)),
        sgstAmount: parseFloat(sgstAmount.toFixed(2)),
        total: parseFloat(itemTotal.toFixed(2))
      });
    }

    console.log('🔄 Calculating totals...');

    // Calculate totals (same logic as create)
    let additionalDiscount = parseFloat(discount) || 0;
    let amountAfterItemDiscount = grossAmount - itemDiscountTotal;

    if (discountType === 'percentage') {
      additionalDiscount = (amountAfterItemDiscount * additionalDiscount) / 100;
    }

    let taxableAmount = grossAmount - itemDiscountTotal - additionalDiscount;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalGst = 0;

    if (applyGST) {
      totalCgst = (taxableAmount * 9) / 100;
      totalSgst = (taxableAmount * 9) / 100;
      totalGst = totalCgst + totalSgst;
    }

    let subtotal = applyGST ? (taxableAmount + totalGst) : taxableAmount;
    const roundOff = Math.round(subtotal) - subtotal;
    const grandTotal = Math.round(subtotal);
    const amountInWords = numberToWords(grandTotal);

    const invoiceItems = processedItems.map(({ productRef, ...item }) => item);

    console.log('🔄 Updating invoice in database...');

    // Update invoice data
    const updateData = {
      customer,
      items: invoiceItems,
      subtotal: parseFloat(grossAmount.toFixed(2)),
      totalTaxableAmount: parseFloat(taxableAmount.toFixed(2)),
      totalCgst: parseFloat(totalCgst.toFixed(2)),
      totalSgst: parseFloat(totalSgst.toFixed(2)),
      tax: parseFloat(totalGst.toFixed(2)),
      discount: parseFloat(additionalDiscount.toFixed(2)),
      discountType: discountType,
      applyGST: applyGST,
      roundOff: parseFloat(roundOff.toFixed(2)),
      grandTotal: grandTotal,
      total: grandTotal,
      amountInWords: amountInWords,
      paymentMethod: paymentMethod,
      notes: notes || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      terms: terms || '',
      updatedBy: req.userId || null,
      updatedAt: new Date()
    };

    // Update payment status if changed - preserve existing payments
    const paidAmountValue = parseFloat(paidAmount) || 0;
    
    console.log('💰 Payment calculation:', {
      existingPaidAmount: existingInvoice.paidAmount,
      newPaidAmount: paidAmountValue,
      grandTotal: grandTotal,
      paymentStatus: paymentStatus
    });
    
    if (paymentStatus === 'paid' || paidAmountValue >= grandTotal) {
      updateData.paymentStatus = 'paid';
      updateData.status = 'paid';
      updateData.paidAmount = grandTotal;
      updateData.pendingAmount = 0;
      updateData.paymentDate = updateData.paymentDate || new Date();
      
      // If no existing payments and we're marking as paid, create a payment record
      if (!existingInvoice.payments || existingInvoice.payments.length === 0) {
        updateData.payments = [{
          amount: grandTotal,
          date: new Date(),
          method: paymentMethod,
          reference: 'Marked as paid during update',
          notes: 'Full payment recorded during invoice update',
          collectedBy: req.userId
        }];
      } else {
        // Keep existing payments
        updateData.payments = existingInvoice.payments;
      }
    } else if (paymentStatus === 'partial' || (paidAmountValue > 0 && paidAmountValue < grandTotal)) {
      updateData.paymentStatus = 'partial';
      updateData.status = 'partial';
      updateData.paidAmount = paidAmountValue;
      updateData.pendingAmount = grandTotal - paidAmountValue;
      updateData.paymentDate = paidAmountValue > 0 ? (updateData.paymentDate || new Date()) : null;
      
      // If we have a new paid amount and no existing payments, create a payment record
      if (paidAmountValue > 0 && (!existingInvoice.payments || existingInvoice.payments.length === 0)) {
        updateData.payments = [{
          amount: paidAmountValue,
          date: new Date(),
          method: paymentMethod,
          reference: 'Partial payment during update',
          notes: 'Partial payment recorded during invoice update',
          collectedBy: req.userId
        }];
      } else {
        // Keep existing payments
        updateData.payments = existingInvoice.payments;
      }
    } else {
      updateData.paymentStatus = 'unpaid';
      updateData.status = 'pending';
      updateData.paidAmount = 0;
      updateData.pendingAmount = grandTotal;
      updateData.payments = existingInvoice.payments || [];
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(id, updateData, { new: true })
      .populate('customer', 'name phone address')
      .populate('items.product', 'name category')
      .populate('createdBy', 'name');

    console.log('🔄 Updating product stocks...');

    // Update stock for new items - batch operations
    const bulkProductOps = [];
    const inventoryHistoryOps = [];

    for (const item of processedItems) {
      if (item.productRef) {
        const previousStock = item.productRef.stock;
        const newStock = previousStock - item.quantity;
        
        // Batch product updates
        const updateFields = { stock: newStock };
        if (item.price !== item.productRef.sellingPrice) {
          updateFields.sellingPrice = item.price;
        }
        
        bulkProductOps.push({
          updateOne: {
            filter: { _id: item.product },
            update: { $set: updateFields }
          }
        });

        // Batch inventory history
        inventoryHistoryOps.push({
          organizationId: req.organizationId,
          product: item.product,
          type: 'sale_update',
          quantity: -item.quantity,
          previousStock: previousStock,
          newStock: newStock,
          reason: `Invoice ${existingInvoice.invoiceNumber} updated`,
          updatedBy: req.userId || null
        });
      }
    }

    // Execute batch operations
    if (bulkProductOps.length > 0) {
      await Product.bulkWrite(bulkProductOps);
      console.log('✅ Updated product stocks');
    }
    if (inventoryHistoryOps.length > 0) {
      await InventoryHistory.insertMany(inventoryHistoryOps);
      console.log('✅ Created inventory history');
    }

    console.log('✅ Invoice update completed successfully');

    return res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('❌ Update invoice error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Update invoice payment - FIXED for partial payments
async function updateInvoicePayment(req, res, id) {
  try {
    const { amount, method = 'cash', reference, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount required' });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const totalAmount = invoice.grandTotal || invoice.total;
    const currentPending = invoice.pendingAmount || totalAmount;

    // Prevent overpayment
    if (amount > currentPending) {
      return res.status(400).json({ 
        success: false, 
        message: `Payment amount (₹${amount}) exceeds pending amount (₹${currentPending})` 
      });
    }

    // Add new payment entry
    invoice.payments.push({
      amount: parseFloat(amount),
      date: new Date(),
      method,
      reference: reference || '',
      notes: notes || '',
      collectedBy: req.userId
    });

    // Recalculate payment status manually
    invoice.recalculatePaymentStatus();
    
    // Save without triggering pre-save hook payment calculations
    await invoice.save();

    const updatedInvoice = await Invoice.findById(id)
      .populate('customer', 'name phone')
      .populate('createdBy', 'name');

    // Create payment notification
    try {
      const isPartial = updatedInvoice.paymentStatus === 'partial';
      await notifyPaymentReceived(req.organizationId, updatedInvoice, amount, isPartial);
    } catch (notifErr) {
      console.warn('⚠️ Failed to create notification:', notifErr.message);
    }

    return res.json({ 
      success: true, 
      message: 'Payment recorded successfully',
      invoice: updatedInvoice 
    });
  } catch (error) {
    console.error('❌ Payment update error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Delete invoice
async function deleteInvoice(req, res, id) {
  try {
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Restore stock for all items and log history
    for (const item of invoice.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const previousStock = product.stock;
        product.stock += item.quantity;
        await product.save();
        
        // Log inventory history for deletion
        await InventoryHistory.create({
          organizationId: req.organizationId,
          product: item.product,
          type: 'sale_deletion',
          quantity: item.quantity,
          previousStock: previousStock,
          newStock: product.stock,
          reason: `Invoice ${invoice.invoiceNumber} deleted`,
          updatedBy: req.userId || null
        });
      }
    }

    await Invoice.findByIdAndDelete(id);
    
    return res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete invoice error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

