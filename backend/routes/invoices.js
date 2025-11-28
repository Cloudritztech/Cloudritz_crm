const express = require('express');
const { 
  createInvoice, 
  getInvoices, 
  getInvoiceById, 
  updateInvoice,
  deleteInvoice,
  generatePDF 
} = require('../controllers/invoiceController');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { createWhatsAppShareLink } = require('../utils/whatsapp');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);
router.get('/:id/pdf', generatePDF);

// Generate and save PDF
router.post('/:id/generate-pdf', async (req, res) => {
  try {
    const Invoice = require('../models/Invoice');
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name phone address')
      .populate('items.product', 'name category brand')
      .populate('createdBy', 'name');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const { pdfBuffer, filePath } = await generateInvoicePDF(invoice, true);
    
    // Update invoice with PDF path
    await Invoice.findByIdAndUpdate(invoice._id, { pdfPath: filePath });
    
    res.json({ 
      success: true, 
      message: 'PDF generated and saved successfully',
      filePath: filePath.replace(process.cwd(), ''),
      invoiceNumber: invoice.invoiceNumber
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate PDF', 
      error: error.message 
    });
  }
});

router.get('/:id/whatsapp-link', async (req, res) => {
  try {
    const invoice = await require('../models/Invoice').findById(req.params.id)
      .populate('customer', 'name phone')
      .populate('items.product', 'name');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const whatsappLink = createWhatsAppShareLink(invoice.customer.phone, invoice);
    
    res.json({ success: true, whatsappLink });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;