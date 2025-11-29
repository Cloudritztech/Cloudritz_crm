import connectDB from '../../lib/mongodb.js';
import Invoice from '../../lib/models/Invoice.js';
import Product from '../../lib/models/Product.js';
import Customer from '../../lib/models/Customer.js';
import InventoryHistory from '../../lib/models/InventoryHistory.js';
import { auth } from '../../lib/middleware/auth.js';
import { handleCors } from '../../lib/cors.js';
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

async function handler(req, res) {
  await connectDB();
  await runMiddleware(req, res, auth);

  const { method } = req;

  switch (method) {
    case 'GET':
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
      break;

    case 'POST':
      try {
        const { customer, items, discount, discountType, paymentMethod, deliveryNote, referenceNo, buyerOrderNo, destination, buyerDetails, notes, dueDate, terms } = req.body;
        
        if (!customer || !items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ message: 'Customer and items are required' });
        }
        
        const customerExists = await Customer.findById(customer);
        if (!customerExists) {
          return res.status(404).json({ message: 'Customer not found' });
        }
        
        let totalTaxableAmount = 0;
        let totalCgst = 0;
        let totalSgst = 0;
        const processedItems = [];

        for (const item of items) {
          if (!item.product || !item.quantity || !item.price) {
            return res.status(400).json({ 
              message: 'Each item must have product, quantity, and price' 
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
            discountType,
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
        
        // Get customer details for buyer info
        const customerData = await Customer.findById(customer);
        
        const invoice = await Invoice.create({
          customer,
          
          // Buyer details from customer
          buyerDetails: {
            name: customerData.name,
            address: (() => {
              const formAddress = buyerDetails;
              if (formAddress && (formAddress.street || formAddress.city)) {
                return `${formAddress.street || ''}, ${formAddress.city || ''}, ${formAddress.state || 'UTTAR PRADESH'} ${formAddress.pincode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
              } else if (customerData.address && (customerData.address.street || customerData.address.city)) {
                return `${customerData.address.street || ''}, ${customerData.address.city || ''}, ${customerData.address.state || 'UTTAR PRADESH'} ${customerData.address.pincode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
              }
              return 'Address not provided';
            })(),
            mobile: customerData.phone,
            gstin: buyerDetails?.gstin || 'N/A',
            state: buyerDetails?.state || customerData.address?.state || 'UTTAR PRADESH',
            stateCode: '09'
          },
          
          // Consignee same as buyer by default
          consigneeDetails: {
            name: customerData.name,
            address: (() => {
              const formAddress = buyerDetails;
              if (formAddress && (formAddress.street || formAddress.city)) {
                return `${formAddress.street || ''}, ${formAddress.city || ''}, ${formAddress.state || 'UTTAR PRADESH'} ${formAddress.pincode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
              } else if (customerData.address && (customerData.address.street || customerData.address.city)) {
                return `${customerData.address.street || ''}, ${customerData.address.city || ''}, ${customerData.address.state || 'UTTAR PRADESH'} ${customerData.address.pincode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
              }
              return 'Address not provided';
            })(),
            mobile: customerData.phone,
            gstin: buyerDetails?.gstin || 'N/A',
            state: buyerDetails?.state || customerData.address?.state || 'UTTAR PRADESH',
            stateCode: '09'
          },
          
          modeOfPayment: paymentMethod || 'cash',
          destination: customerData.address?.city || 'Gorakhpur',
          deliveryNote,
          referenceNo,
          buyerOrderNo,
          
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

        res.status(201).json({ 
          success: true, 
          message: 'Invoice created successfully',
          invoice: populatedInvoice 
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to create invoice', 
          error: error.message 
        });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default function(req, res) {
  return handleCors(req, res, handler);
}