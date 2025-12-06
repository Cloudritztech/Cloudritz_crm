import connectDB from '../../lib/mongodb.js';
import Invoice from '../../lib/models/Invoice.js';
import Product from '../../lib/models/Product.js';
import Customer from '../../lib/models/Customer.js';
import User from '../../lib/models/User.js';
import InventoryHistory from '../../lib/models/InventoryHistory.js';
import { auth } from '../../lib/middleware/auth.js';
import { numberToWords } from '../../lib/numberToWords.js';

async function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 Invoice API called:', req.method);
    await connectDB();
    console.log('✅ Database connected');
    
    await runMiddleware(req, res, auth);
    console.log('✅ Authentication passed');

    const { method } = req;

    switch (method) {
      case 'GET':
        try {
          const { search, startDate, endDate, customer } = req.query;
          let query = {};
          
          if (search) {
            query.$or = [
              { invoiceNumber: { $regex: search, $options: 'i' } }
            ];
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

          console.log('🔍 Fetching invoices with query:', query);

          const invoices = await Invoice.find(query)
            .populate('customer', 'name phone address')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .lean();

          console.log(`✅ Found ${invoices.length} invoices`);

          return res.status(200).json({ 
            success: true, 
            invoices,
            count: invoices.length
          });
        } catch (error) {
          console.error('❌ Error fetching invoices:', error);
          return res.status(500).json({ 
            success: false,
            message: 'Failed to fetch invoices',
            error: error.message 
          });
        }

      case 'POST':
        try {
          const { 
            customer, 
            items, 
            discount = 0, 
            discountType = 'amount', 
            paymentMethod = 'cash',
            applyGST = false,
            reverseGST = false,
            deliveryNote, 
            referenceNo, 
            buyerOrderNo, 
            destination, 
            buyerDetails, 
            notes, 
            dueDate, 
            terms 
          } = req.body;
          
          console.log('📝 Invoice creation request:', { customer, itemsCount: items?.length, discount, applyGST, reverseGST });
          
          // Validation
          if (!customer) {
            return res.status(400).json({ success: false, message: 'Customer is required' });
          }
          
          if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one item is required' });
          }
          
          // Verify customer exists
          const customerExists = await Customer.findById(customer);
          if (!customerExists) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
          }
          
          // Process items and calculate totals
          let grossAmount = 0;
          let itemDiscountTotal = 0;
          const processedItems = [];

          for (const item of items) {
            // Validate item fields
            if (!item.product) {
              return res.status(400).json({ success: false, message: 'Item product is required' });
            }
            if (!item.quantity || item.quantity <= 0) {
              return res.status(400).json({ success: false, message: 'Item quantity must be greater than 0' });
            }
            if (!item.price || item.price < 0) {
              return res.status(400).json({ success: false, message: 'Item price must be valid' });
            }
            
            // Verify product exists
            const product = await Product.findById(item.product);
            if (!product) {
              return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
            }
            
            // Check stock
            if (product.stock < item.quantity) {
              return res.status(400).json({ 
                success: false, 
                message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
              });
            }

            // Calculate item amounts
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
            
            // GST calculation
            // If reverseGST: don't add GST to item total (will be shown but discounted later)
            // If normal GST: add GST to item total
            const cgstAmount = applyGST ? (taxableValue * 9) / 100 : 0;
            const sgstAmount = applyGST ? (taxableValue * 9) / 100 : 0;
            const itemTotal = reverseGST ? taxableValue : (taxableValue + cgstAmount + sgstAmount);
            
            processedItems.push({
              product: product._id,
              quantity: qty,
              price: price,
              discount: itemDiscount,
              discountType: itemDiscountType,
              taxableValue: parseFloat(taxableValue.toFixed(2)),
              cgstRate: 9,
              sgstRate: 9,
              cgstAmount: parseFloat(cgstAmount.toFixed(2)),
              sgstAmount: parseFloat(sgstAmount.toFixed(2)),
              total: parseFloat(itemTotal.toFixed(2))
            });

            // Update product stock
            product.stock -= qty;
            await product.save();

            // Log inventory history
            try {
              await InventoryHistory.create({
                product: product._id,
                type: 'sale',
                quantity: -qty,
                previousStock: product.stock + qty,
                newStock: product.stock,
                updatedBy: req.user?._id || null
              });
            } catch (invErr) {
              console.warn('⚠️ Failed to log inventory history:', invErr.message);
            }
          }

          // Apply additional discount
          let additionalDiscount = parseFloat(discount) || 0;
          let amountAfterItemDiscount = grossAmount - itemDiscountTotal;
          
          if (discountType === 'percentage') {
            additionalDiscount = (amountAfterItemDiscount * additionalDiscount) / 100;
          }
          
          // Taxable amount = Gross - All Discounts
          let taxableAmount = grossAmount - itemDiscountTotal - additionalDiscount;
          
          // Calculate GST
          let totalCgst = 0;
          let totalSgst = 0;
          let totalGst = 0;
          let autoDiscount = 0;
          
          if (applyGST) {
            totalCgst = (taxableAmount * 9) / 100;
            totalSgst = (taxableAmount * 9) / 100;
            totalGst = totalCgst + totalSgst;
            
            if (reverseGST) {
              // Reverse GST: GST is calculated but then discounted
              autoDiscount = totalGst;
            }
          }
          
          // Calculate final total
          // When reverseGST: final amount = taxable (GST added then discounted)
          // When normal GST: final amount = taxable + GST
          // When no GST: final amount = taxable
          let subtotal = taxableAmount;
          if (applyGST && !reverseGST) {
            subtotal = taxableAmount + totalGst;
          }
          const roundOff = Math.round(subtotal) - subtotal;
          const grandTotal = Math.round(subtotal);
          const amountInWords = numberToWords(grandTotal);
          
          console.log('💰 Calculations:', { 
            grossAmount, 
            itemDiscountTotal, 
            additionalDiscount,
            taxableAmount, 
            totalCgst,
            totalSgst,
            totalGst, 
            autoDiscount,
            reverseGST,
            grandTotal 
          });
          
          // Create invoice
          const invoice = await Invoice.create({
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
            destination: destination || customerExists.address?.city || 'Gorakhpur',
            deliveryNote: deliveryNote || '',
            referenceNo: referenceNo || '',
            buyerOrderNo: buyerOrderNo || '',
            items: processedItems,
            subtotal: parseFloat(grossAmount.toFixed(2)),
            totalTaxableAmount: parseFloat(taxableAmount.toFixed(2)),
            totalCgst: parseFloat(totalCgst.toFixed(2)),
            totalSgst: parseFloat(totalSgst.toFixed(2)),
            tax: parseFloat(totalGst.toFixed(2)),
            discount: parseFloat(additionalDiscount.toFixed(2)),
            autoDiscount: parseFloat(autoDiscount.toFixed(2)),
            discountType: discountType,
            applyGST: applyGST,
            reverseGST: reverseGST,
            roundOff: parseFloat(roundOff.toFixed(2)),
            grandTotal: grandTotal,
            total: grandTotal,
            amountInWords: amountInWords,
            paymentMethod: paymentMethod,
            notes: notes || '',
            dueDate: dueDate ? new Date(dueDate) : null,
            terms: terms || 'Payment due within 30 days',
            createdBy: req.user?._id || null
          });

          // Update customer's total purchases
          try {
            await Customer.findByIdAndUpdate(customer, {
              $inc: { totalPurchases: grandTotal },
              lastPurchaseDate: new Date()
            });
          } catch (custErr) {
            console.warn('⚠️ Failed to update customer purchases:', custErr.message);
          }

          // Populate invoice
          const populatedInvoice = await Invoice.findById(invoice._id)
            .populate('customer', 'name phone address')
            .populate('items.product', 'name category')
            .populate('createdBy', 'name');

          console.log('✅ Invoice created:', populatedInvoice.invoiceNumber);
          
          return res.status(201).json({ 
            success: true, 
            message: 'Invoice created successfully',
            invoice: populatedInvoice 
          });
        } catch (error) {
          console.error('❌ Invoice creation error:', error);
          console.error('Stack:', error.stack);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to create invoice', 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
          });
        }

      default:
        return res.status(405).json({
          success: false,
          message: `Method ${method} Not Allowed`
        });
    }
  } catch (error) {
    console.error('❌ Handler error:', error);
    console.error('Stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}