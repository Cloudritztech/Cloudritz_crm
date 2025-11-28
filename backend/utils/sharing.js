// Simple sharing utilities without paid services

const generateShareableLink = (invoiceId) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/invoice/${invoiceId}`;
};

const generateWhatsAppLink = (phone, message) => {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/91${phone}?text=${encodedMessage}`;
};

const generateInvoiceShareMessage = (invoiceData) => {
  return `🧾 *Invoice from Anvi Tiles and Decorhub*

Invoice #: ${invoiceData.invoiceNumber}
Date: ${new Date(invoiceData.createdAt).toLocaleDateString('en-IN')}
Total Amount: ₹${invoiceData.total}

Items:
${invoiceData.items.map(item => 
  `• ${item.product.name} - Qty: ${item.quantity} - ₹${item.total}`
).join('\n')}

Thank you for your business! 🙏

*Anvi Tiles and Decorhub*
📞 Contact: +91 XXXXX XXXXX`;
};

module.exports = { 
  generateShareableLink, 
  generateWhatsAppLink, 
  generateInvoiceShareMessage 
};