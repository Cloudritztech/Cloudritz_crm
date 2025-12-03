import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['payment', 'sale', 'stock', 'invoice', 'customer', 'report'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  read: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed },
  link: { type: String }
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
