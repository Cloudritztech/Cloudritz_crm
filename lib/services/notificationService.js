import Notification from '../models/Notification.js';
import { generateNotificationText } from './geminiService.js';

export async function createNotification({ organizationId, userId = null, type, title, message, metadata = {} }) {
  try {
    console.log('🔔 Creating notification:', { organizationId, userId, type, title });
    
    const notification = await Notification.create({
      organizationId,
      userId,
      type,
      title,
      message,
      metadata,
      isRead: false
    });
    
    console.log('✅ Notification created:', notification._id);
    return notification;
  } catch (error) {
    console.error('❌ Failed to create notification:', error);
    throw error;
  }
}

export async function notifyInvoiceCreated(organizationId, invoice, customer) {
  const { title, message } = await generateNotificationText('invoice_created', {
    invoiceNumber: invoice.invoiceNumber,
    customerName: customer.name,
    amount: invoice.total
  });
  
  return createNotification({
    organizationId,
    userId: null,
    type: 'invoice_created',
    title,
    message,
    metadata: { invoiceId: invoice._id, customerId: customer._id }
  });
}

export async function notifyPaymentReceived(organizationId, invoice, amount, isPartial) {
  const { title, message } = await generateNotificationText(
    isPartial ? 'payment_partial' : 'invoice_paid',
    {
      invoiceNumber: invoice.invoiceNumber,
      amount,
      pending: invoice.pendingAmount
    }
  );
  
  return createNotification({
    organizationId,
    userId: null,
    type: isPartial ? 'payment_partial' : 'invoice_paid',
    title,
    message,
    metadata: { invoiceId: invoice._id, amount }
  });
}

export async function notifyExpenseCreated(organizationId, expense) {
  const { title, message } = await generateNotificationText('expense_created', {
    title: expense.title,
    amount: expense.amount,
    type: expense.type
  });
  
  return createNotification({
    organizationId,
    userId: null,
    type: 'expense_created',
    title,
    message,
    metadata: { expenseId: expense._id }
  });
}

export async function notifyTicketReply(organizationId, userId, ticket, replyBy) {
  return createNotification({
    organizationId,
    userId,
    type: 'ticket_reply',
    title: 'New Reply on Your Ticket',
    message: `${replyBy} replied to ticket #${ticket.ticketNumber}`,
    metadata: { ticketId: ticket._id }
  });
}

export async function notifyTicketResolved(organizationId, userId, ticket) {
  return createNotification({
    organizationId,
    userId,
    type: 'ticket_resolved',
    title: 'Ticket Resolved',
    message: `Your ticket #${ticket.ticketNumber} has been resolved`,
    metadata: { ticketId: ticket._id }
  });
}

export async function notifyEmployeeCreated(organizationId, employee) {
  return createNotification({
    organizationId,
    userId: null,
    type: 'employee_created',
    title: 'New Employee Added',
    message: `${employee.name} has been added to your organization`,
    metadata: { employeeId: employee._id }
  });
}

export async function notifyPendingPayments(organizationId, pendingInvoices) {
  if (pendingInvoices.length === 0) return;
  
  // Check if we already sent a reminder today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existingNotification = await Notification.findOne({
    organizationId,
    type: 'payment_reminder',
    createdAt: { $gte: today }
  });
  
  if (existingNotification) {
    console.log('📅 Payment reminder already sent today, skipping');
    return;
  }
  
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.pendingAmount, 0);
  
  const { title, message } = await generateNotificationText('payment_reminder', {
    count: pendingInvoices.length,
    amount: totalPending.toFixed(2)
  });
  
  return createNotification({
    organizationId,
    userId: null,
    type: 'payment_reminder',
    title,
    message,
    metadata: { invoiceIds: pendingInvoices.map(i => i._id) }
  });
}

export async function notifyOverdueInvoices(organizationId, overdueInvoices) {
  if (overdueInvoices.length === 0) return;
  
  const { title, message } = await generateNotificationText('invoice_overdue', {
    count: overdueInvoices.length
  });
  
  return createNotification({
    organizationId,
    userId: null,
    type: 'invoice_overdue',
    title,
    message,
    metadata: { invoiceIds: overdueInvoices.map(i => i._id) }
  });
}

export async function notifyLowStock(organizationId, lowStockProducts) {
  if (lowStockProducts.length === 0) return;
  
  const { title, message } = await generateNotificationText('low_stock', {
    count: lowStockProducts.length,
    products: lowStockProducts.slice(0, 3).map(p => p.name).join(', ')
  });
  
  return createNotification({
    organizationId,
    userId: null,
    type: 'low_stock',
    title,
    message,
    metadata: { productIds: lowStockProducts.map(p => p._id) }
  });
}
