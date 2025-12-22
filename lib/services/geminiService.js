import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateNotificationText(type, data) {
  // Fallback messages if Gemini fails
  const fallbacks = {
    invoice_created: `Invoice ${data.invoiceNumber} created for ${data.customerName} - ₹${data.amount}`,
    payment_received: `Payment of ₹${data.amount} received for Invoice ${data.invoiceNumber}`,
    payment_partial: `Partial payment of ₹${data.amount} received for Invoice ${data.invoiceNumber}. Pending: ₹${data.pending}`,
    invoice_paid: `Invoice ${data.invoiceNumber} fully paid - ₹${data.amount}`,
    expense_created: `New expense: ${data.title} - ₹${data.amount}`,
    payment_reminder: `${data.count} invoices pending with total ₹${data.amount}`,
    invoice_overdue: `${data.count} invoices are overdue. Follow up required.`,
    low_stock: `${data.count} products running low on stock`
  };

  try {
    if (!process.env.GEMINI_API_KEY) {
      return { title: getTitle(type), message: fallbacks[type] };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Generate a professional, concise notification for a CRM system.
Type: ${type}
Data: ${JSON.stringify(data)}

Requirements:
- Professional business tone
- Clear and actionable
- Maximum 80 characters
- Include key numbers (amounts, counts)
- No emojis
- Format: Return ONLY the notification message text, nothing else

Example for invoice_created: "Invoice #INV-001 generated for ABC Corp - ₹15,000. Payment due in 15 days."`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const message = response.text().trim();

    return {
      title: getTitle(type),
      message: message || fallbacks[type]
    };

  } catch (error) {
    console.warn('⚠️ Gemini AI failed, using fallback:', error.message);
    return { title: getTitle(type), message: fallbacks[type] };
  }
}

function getTitle(type) {
  const titles = {
    invoice_created: 'Invoice Created',
    payment_received: 'Payment Received',
    payment_partial: 'Partial Payment',
    invoice_paid: 'Invoice Paid',
    expense_created: 'Expense Added',
    ticket_reply: 'New Reply',
    ticket_resolved: 'Ticket Resolved',
    employee_created: 'Employee Added',
    payment_reminder: 'Payment Reminder',
    invoice_overdue: 'Overdue Alert',
    low_stock: 'Low Stock Alert',
    system_announcement: 'System Update'
  };
  return titles[type] || 'Notification';
}
