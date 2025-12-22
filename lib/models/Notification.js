import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // null = all users in org
  },
  type: {
    type: String,
    enum: [
      'invoice_created',
      'payment_received', 
      'payment_partial',
      'invoice_paid',
      'expense_created',
      'ticket_reply',
      'ticket_resolved',
      'employee_created',
      'payment_reminder',
      'invoice_overdue',
      'low_stock',
      'system_announcement'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 259200 // TTL: Auto-delete after 3 days (259200 seconds)
  }
}, { timestamps: true });

// Compound indexes for efficient queries
notificationSchema.index({ organizationId: 1, createdAt: -1 });
notificationSchema.index({ organizationId: 1, userId: 1, isRead: 1 });
notificationSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 259200 }); // TTL index

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
