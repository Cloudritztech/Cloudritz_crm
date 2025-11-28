const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const InventoryHistory = require('../models/InventoryHistory');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { numberToWords } = require('../utils/numberToWords');

const createInvoice = async (req, res) => {
  try {
    console.log('Received invoice data:', req.body);
    const { customer, items, tax, discount, paymentMethod, shippingAddress, notes, dueDate, terms } = req.body;
    
    // Validation
    if (!customer) {
      return res.status(400).json({ message: 'Customer is required' });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }
    
    // Check if customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    let totalTaxableAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    const processedItems = [];

    for (const item of items) {
      // Validate item data
      if (!item.product || !item.quantity || !item.price) {
        return res.status(400).json({ 
          message: 'Each item must have product, quantity, and price' 
        });
      }
      
      if (item.quantity <= 0 || item.price <= 0) {
        return res.status(400).json({ 
          message: 'Quantity and price must be greater than 0' 
        });
      }
      
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }

      const itemDiscount = item.discount || 0;
      const discountType = item.discountType || 'amount';
      let discountAmount = 0;
      
      if (discountType === 'percentage') {
        discountAmount = (item.quantity * item.price * itemDiscount) / 100;
      } else {
        discountAmount = itemDiscount;
      }
      
      const taxableValue = (item.quantity * item.price) - discountAmount;
      const cgstRate = 9; // 9% CGST
      const sgstRate = 9; // 9% SGST
      const cgstAmount = (taxableValue * cgstRate) / 100;
      const sgstAmount = (taxableValue * sgstRate) / 100;
      const itemTotal = taxableValue + cgstAmount + sgstAmount;
      
      totalTaxableAmount += taxableValue;
      totalCgst += cgstAmount;
      totalSgst += sgstAmount;
      
      processedItems.push({
        product: product._id,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        discount: itemDiscount,
        discountType: discountType,
        taxableValue,
        cgstRate,
        sgstRate,
        cgstAmount,
        sgstAmount,
        total: itemTotal
      });

      // Update product stock
      product.stock -= item.quantity;
      await product.save();

      // Log inventory history
      await InventoryHistory.create({
        product: product._id,
        type: 'sale',
        quantity: -item.quantity,
        previousStock: product.stock + item.quantity,
        newStock: product.stock,
        updatedBy: req.user._id
      });
    }

    // Handle overall discount
    const overallDiscountType = req.body.discountType || 'amount';
    let overallDiscountAmount = discount || 0;
    
    if (overallDiscountType === 'percentage') {
      overallDiscountAmount = (totalTaxableAmount * (discount || 0)) / 100;
    }
    
    const subtotalBeforeRound = totalTaxableAmount + totalCgst + totalSgst - overallDiscountAmount;
    const roundOff = Math.round(subtotalBeforeRound) - subtotalBeforeRound;
    const grandTotal = Math.round(subtotalBeforeRound);
    const amountInWords = numberToWords(grandTotal);
    
    // Legacy total for compatibility
    const total = grandTotal;

    // Generate invoice number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const invoiceNumber = `INV-${year}${month}${day}-${random}`;

    // Get customer details for buyer info
    const customerData = await Customer.findById(customer);
    
    const invoice = await Invoice.create({
      invoiceNumber,
      customer,
      
      // Buyer details - use form data if provided, otherwise customer data
      buyerDetails: {
        name: customerData.name,
        address: (() => {
          const formAddress = req.body.buyerDetails;
          if (formAddress && (formAddress.street || formAddress.city)) {
            return `${formAddress.street || ''}, ${formAddress.city || ''}, ${formAddress.state || 'UTTAR PRADESH'} ${formAddress.pincode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
          } else if (customerData.address && (customerData.address.street || customerData.address.city)) {
            return `${customerData.address.street || ''}, ${customerData.address.city || ''}, ${customerData.address.state || 'UTTAR PRADESH'} ${customerData.address.pincode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
          }
          return 'Address not provided';
        })(),
        mobile: customerData.phone,
        gstin: req.body.buyerDetails?.gstin || 'N/A',
        state: req.body.buyerDetails?.state || customerData.address?.state || 'UTTAR PRADESH',
        stateCode: '09'
      },
      
      // Consignee same as buyer by default
      consigneeDetails: {
        name: customerData.name,
        address: (() => {
          const formAddress = req.body.buyerDetails;
          if (formAddress && (formAddress.street || formAddress.city)) {
            return `${formAddress.street || ''}, ${formAddress.city || ''}, ${formAddress.state || 'UTTAR PRADESH'} ${formAddress.pincode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
          } else if (customerData.address && (customerData.address.street || customerData.address.city)) {
            return `${customerData.address.street || ''}, ${customerData.address.city || ''}, ${customerData.address.state || 'UTTAR PRADESH'} ${customerData.address.pincode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
          }
          return 'Address not provided';
        })(),
        mobile: customerData.phone,
        gstin: req.body.buyerDetails?.gstin || 'N/A',
        state: req.body.buyerDetails?.state || customerData.address?.state || 'UTTAR PRADESH',
        stateCode: '09'
      },
      
      modeOfPayment: paymentMethod || 'cash',
      destination: customerData.address?.city || 'Gorakhpur',
      
      items: processedItems,
      
      // GST totals
      totalTaxableAmount,
      totalCgst,
      totalSgst,
      roundOff,
      grandTotal,
      amountInWords,
      
      // Legacy fields for compatibility
      subtotal: totalTaxableAmount,
      tax: totalCgst + totalSgst,
      discount: discount || 0,
      discountType: overallDiscountType,
      total,
      paymentMethod: paymentMethod || 'cash',
      
      notes: notes || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      terms: terms || 'Payment due within 30 days',
      createdBy: req.user._id
    });

    // Update customer's total purchases
    await Customer.findByIdAndUpdate(customer, {
      $inc: { totalPurchases: total },
      lastPurchaseDate: new Date()
    });

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer', 'name phone address')
      .populate('items.product', 'name category')
      .populate('createdBy', 'name');

    res.status(201).json({ 
      success: true, 
      message: 'Invoice created successfully',
      invoice: populatedInvoice 
    });
  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create invoice', 
      error: error.message 
    });
  }
};

const getInvoices = async (req, res) => {
  try {
    const { search, startDate, endDate, customer } = req.query;
    let query = {};
    
    if (search) {
      query.invoiceNumber = { $regex: search, $options: 'i' };
    }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (customer) {
      query.customer = customer;
    }

    const invoices = await Invoice.find(query)
      .populate('customer', 'name phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name phone address')
      .populate('items.product', 'name category brand')
      .populate('createdBy', 'name');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generatePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name phone address')
      .populate('items.product', 'name category brand')
      .populate('createdBy', 'name');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const { pdfBuffer, filePath } = await generateInvoicePDF(invoice, true);
    
    // Update invoice with PDF path
    if (filePath && !invoice.pdfPath) {
      await Invoice.findByIdAndUpdate(invoice._id, { pdfPath: filePath });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate PDF', 
      error: error.message 
    });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Update invoice
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    )
    .populate('customer', 'name phone address')
    .populate('items.product', 'name category')
    .populate('createdBy', 'name');
    
    res.json({ 
      success: true, 
      message: 'Invoice updated successfully',
      invoice: updatedInvoice 
    });
  } catch (error) {
    console.error('Invoice update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update invoice', 
      error: error.message 
    });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Restore product stock
    for (const item of invoice.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }
    
    // Delete invoice
    await Invoice.findByIdAndDelete(id);
    
    res.json({ 
      success: true, 
      message: 'Invoice deleted successfully' 
    });
  } catch (error) {
    console.error('Invoice delete error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete invoice', 
      error: error.message 
    });
  }
};

module.exports = { createInvoice, getInvoices, getInvoiceById, updateInvoice, deleteInvoice, generatePDF };