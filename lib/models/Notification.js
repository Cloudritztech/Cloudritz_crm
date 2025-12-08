import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error', 'insight', 'alert'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['sales', 'inventory', 'customer', 'expense', 'system', 'ai-insight'],
    default: 'system'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  icon: { type: String },
  actionUrl: { type: String },
  actionText: { type: String },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  expiresAt: { type: Date }
}, { timestamps: true });

notificationSchema.index({ organizationId: 1, userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;
