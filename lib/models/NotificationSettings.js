import mongoose from 'mongoose';

const notificationSettingsSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    unique: true,
    index: true
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  lowStockAlerts: {
    type: Boolean,
    default: true
  },
  paymentReminders: {
    type: Boolean,
    default: true
  },
  dailyReports: {
    type: Boolean,
    default: false
  },
  weeklyReports: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

notificationSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.NotificationSettings || mongoose.model('NotificationSettings', notificationSettingsSchema);
