import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  userEmail: String,
  organizationName: String,
  subject: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'feature-request', 'bug', 'general'],
    default: 'general'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },
  unreadCount: {
    user: { type: Number, default: 0 },
    admin: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

supportTicketSchema.index({ organizationId: 1, status: 1 });
supportTicketSchema.index({ status: 1, lastMessageAt: -1 });
supportTicketSchema.index({ organizationId: 1, createdAt: -1 });

export default mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);
