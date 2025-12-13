import Notification from './models/Notification.js';

export async function createLowStockNotification(organizationId, product) {
  try {
    await Notification.create({
      organizationId,
      type: 'system_update',
      title: 'Low Stock Alert',
      message: `${product.name} is running low (${product.stock} units remaining). Reorder soon to avoid stockouts.`,
      metadata: { productId: product._id, productName: product.name, currentStock: product.stock }
    });
  } catch (error) {
    console.error('Failed to create low stock notification:', error);
  }
}

export async function createPaymentReminderNotification(organizationId, invoice) {
  try {
    await Notification.create({
      organizationId,
      type: 'payment_reminder',
      title: 'Pending Payment',
      message: `Invoice #${invoice.invoiceNumber} payment pending: ₹${invoice.total}. Follow up with customer.`,
      metadata: { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber, amount: invoice.total }
    });
  } catch (error) {
    console.error('Failed to create payment reminder notification:', error);
  }
}

export async function createLargeSaleNotification(organizationId, invoice) {
  try {
    await Notification.create({
      organizationId,
      type: 'system_update',
      title: 'Large Sale Completed',
      message: `New invoice of ₹${invoice.total} created for ${invoice.customer?.name || 'customer'}. Great work!`,
      metadata: { invoiceId: invoice._id, amount: invoice.total }
    });
  } catch (error) {
    console.error('Failed to create large sale notification:', error);
  }
}

export async function createNewCustomerNotification(organizationId, customer) {
  try {
    await Notification.create({
      organizationId,
      type: 'system_update',
      title: 'New Customer Added',
      message: `${customer.name} has been added to your customer list.`,
      metadata: { customerId: customer._id, customerName: customer.name }
    });
  } catch (error) {
    console.error('Failed to create new customer notification:', error);
  }
}

export async function createAccountBlockedNotification(organizationId, reason) {
  try {
    await Notification.create({
      organizationId,
      type: 'account_blocked',
      title: 'Account Blocked',
      message: `Your account has been blocked. Reason: ${reason}. Please contact support.`,
      metadata: { reason }
    });
  } catch (error) {
    console.error('Failed to create account blocked notification:', error);
  }
}

export async function createAccountUnblockedNotification(organizationId) {
  try {
    await Notification.create({
      organizationId,
      type: 'account_unblocked',
      title: 'Account Unblocked',
      message: 'Your account has been unblocked. You can now access all features.',
      metadata: {}
    });
  } catch (error) {
    console.error('Failed to create account unblocked notification:', error);
  }
}
