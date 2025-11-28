// Free WhatsApp sharing without Twilio
const { generateWhatsAppLink, generateInvoiceShareMessage } = require('./sharing');

const createWhatsAppShareLink = (customerPhone, invoiceData) => {
  const message = generateInvoiceShareMessage(invoiceData);
  return generateWhatsAppLink(customerPhone, message);
};

const createPromotionalWhatsAppLink = (customerPhone, customMessage) => {
  const message = `🎉 *Anvi Tiles and Decorhub*

${customMessage}

Visit us for the best deals on:
🔸 Premium Tiles
🔸 Sanitary Products  
🔸 WPC Doors
🔸 Accessories

📞 Contact: +91 XXXXX XXXXX
📍 Visit our showroom today!`;
  
  return generateWhatsAppLink(customerPhone, message);
};

module.exports = { createWhatsAppShareLink, createPromotionalWhatsAppLink };