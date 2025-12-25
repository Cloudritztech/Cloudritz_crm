import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateNotificationText(type, data) {
  const fallbacks = {
    invoice_created: `Invoice ${data.invoiceNumber} created for ${data.customerName} - ₹${data.amount}`,
    payment_received: `Payment of ₹${data.amount} received for Invoice ${data.invoiceNumber}`,
    payment_partial: `Partial payment of ₹${data.amount} received for Invoice ${data.invoiceNumber}. Pending: ₹${data.pending}`,
    invoice_paid: `Invoice ${data.invoiceNumber} fully paid - ₹${data.amount}`,
    expense_created: `New expense: ${data.title} - ₹${data.amount}`,
    payment_reminder: `${data.count} invoices pending with total ₹${data.amount}`,
    invoice_overdue: `${data.count} invoices are overdue. Follow up required.`,
    low_stock: `${data.count} products running low: ${data.products}`
  };

  try {
    if (!process.env.GEMINI_API_KEY) {
      return { title: getTitle(type), message: fallbacks[type] };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompts = {
      invoice_created: `Create a professional CRM notification for invoice creation.
Invoice: ${data.invoiceNumber}
Customer: ${data.customerName}
Amount: ₹${data.amount}

Write a clear, actionable message (max 100 chars) mentioning invoice number, customer, and amount.`,
      
      payment_received: `Create a professional payment confirmation notification.
Invoice: ${data.invoiceNumber}
Amount Received: ₹${data.amount}

Write a clear message (max 80 chars) confirming payment received.`,
      
      payment_partial: `Create a partial payment notification.
Invoice: ${data.invoiceNumber}
Paid: ₹${data.amount}
Pending: ₹${data.pending}

Write a clear message (max 100 chars) showing partial payment and remaining balance.`,
      
      low_stock: `Create an urgent low stock alert for inventory management.
Products affected: ${data.count}
Products: ${data.products}

Write an urgent, actionable message (max 120 chars) listing products that need restocking immediately.`,
      
      payment_reminder: `Create a payment reminder notification.
Pending Invoices: ${data.count}
Total Amount: ₹${data.amount}

Write a professional reminder (max 100 chars) about pending payments.`,
      
      invoice_overdue: `Create an overdue invoice alert.
Overdue Invoices: ${data.count}

Write an urgent alert (max 80 chars) about overdue invoices requiring follow-up.`,
      
      expense_created: `Create an expense notification.
Expense: ${data.title}
Amount: ₹${data.amount}
Type: ${data.type}

Write a clear message (max 80 chars) about the new expense.`
    };

    const prompt = prompts[type] || `Generate a notification for ${type}: ${JSON.stringify(data)}`;
    const finalPrompt = prompt + "\n\nIMPORTANT: Return ONLY the notification message text. No quotes, no extra text, no explanations.";

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const message = response.text().trim().replace(/^["']|["']$/g, '');

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
