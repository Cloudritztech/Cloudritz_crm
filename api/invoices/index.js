import connectDB from '../../lib/mongodb.js';
import Invoice from '../../lib/models/Invoice.js';
import Product from '../../lib/models/Product.js';
import Customer from '../../lib/models/Customer.js';
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
          const { customer, items, discount, discountType, paymentMethod, deliveryNote, referenceNo, buyerOrderNo, destination, buyerDetails, notes, dueDate, terms } = req.body;
          
          console.log('📝 Creating invoice for customer:', customer);
          
          if (!customer || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
              success: false,
              message: 'Customer and items are required' 
            });
          }
          
          const customerExists = await Customer.findById(customer);
          if (!customerExists) {
            return res.status(404).json({ 
              success: false,
              message: 'Customer not found' 
            });
          }
          
          let totalTaxableAmount = 0;
          let totalCgst = 0;
          let totalSgst = 0;
          const processedItems = [];

          for (const item of items) {
            if (!item.product || !item.quantity || !item.price) {
              return res.status(400).json({ 
                success: false,
                message: 'Each item must have product, quantity, and price' 
              });
            }
            
            const product = await Product.findById(item.product);
            if (!product) {
              return res.status(404).json({ 
                success: false,
                message: `Product not found: ${item.product}` 
              });
            }
            
            if (product.stock < item.quantity) {
              return res.status(400).json({ 
                success: false,
                message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
              });
            }

            const itemDiscount = item.discount || 0;
            const itemDiscountType = item.discountType || 'amount';
            let discountAmount = 0;
            
            if (itemDiscountType === 'percentage') {
              discountAmount = (item.quantity * item.price * itemDiscount) / 100;
            } else {
              discountAmount = itemDiscount;
            }
            
            const taxableValue = (item.quantity * item.price) - discountAmount;
            const cgstRate = 9;
            const sgstRate = 9;
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
              discountType: itemDiscountType,
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
          const overallDiscountType = discountType || 'amount';
          let overallDiscountAmount = discount || 0;
          
          if (overallDiscountType === 'percentage') {
            overallDiscountAmount = (totalTaxableAmount * (discount || 0)) / 100;
          }
          
          const subtotalBeforeRound = totalTaxableAmount + totalCgst + totalSgst - overallDiscountAmount;
          const roundOff = Math.round(subtotalBeforeRound) - subtotalBeforeRound;
          const grandTotal = Math.round(subtotalBeforeRound);
          const amountInWords = numberToWords(grandTotal);
          
          const invoice = await Invoice.create({
            customer,
            buyerDetails: {
              name: customerExists.name,
              address: buyerDetails?.street ? 
                `${buyerDetails.street}, ${buyerDetails.city || ''}, ${buyerDetails.state || 'UTTAR PRADESH'} ${buyerDetails.pincode || ''}` :
                'Address not provided',
              mobile: customerExists.phone,
              gstin: buyerDetails?.gstin || 'N/A',
              state: buyerDetails?.state || 'UTTAR PRADESH',
              stateCode: '09'
            },
            consigneeDetails: {
              name: customerExists.name,
              address: buyerDetails?.street ? 
                `${buyerDetails.street}, ${buyerDetails.city || ''}, ${buyerDetails.state || 'UTTAR PRADESH'} ${buyerDetails.pincode || ''}` :
                'Address not provided',
              mobile: customerExists.phone,
              gstin: buyerDetails?.gstin || 'N/A',
              state: buyerDetails?.state || 'UTTAR PRADESH',
              stateCode: '09'
            },
            modeOfPayment: paymentMethod || 'cash',
            destination: customerExists.address?.city || 'Gorakhpur',
            deliveryNote,
            referenceNo,
            buyerOrderNo,
            items: processedItems,
            totalTaxableAmount,
            totalCgst,
            totalSgst,
            roundOff,
            grandTotal,
            amountInWords,
            subtotal: totalTaxableAmount,
            tax: totalCgst + totalSgst,
            discount: discount || 0,
            discountType: overallDiscountType,
            total: grandTotal,
            paymentMethod: paymentMethod || 'cash',
            notes: notes || '',
            dueDate: dueDate ? new Date(dueDate) : null,
            terms: terms || 'Payment due within 30 days',
            createdBy: req.user._id
          });

          // Update customer's total purchases
          await Customer.findByIdAndUpdate(customer, {
            $inc: { totalPurchases: grandTotal },
            lastPurchaseDate: new Date()
          });

          const populatedInvoice = await Invoice.findById(invoice._id)
            .populate('customer', 'name phone address')
            .populate('items.product', 'name category hsnCode')
            .populate('createdBy', 'name');

          console.log('✅ Invoice created successfully:', populatedInvoice.invoiceNumber);
          
          return res.status(201).json({ 
            success: true, 
            message: 'Invoice created successfully',
            invoice: populatedInvoice 
          });
        } catch (error) {
          console.error('❌ Error creating invoice:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to create invoice', 
            error: error.message 
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
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}