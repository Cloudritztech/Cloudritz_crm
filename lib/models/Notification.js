import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['account_blocked', 'account_unblocked', 'settings_updated', 'admin_message', 'payment_reminder', 'system_update'],
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
    default: Date.now
  }
});

// Compound index for efficient queries
notificationSchema.index({ organizationId: 1, createdAt: -1 });
notificationSchema.index({ organizationId: 1, isRead: 1 });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
