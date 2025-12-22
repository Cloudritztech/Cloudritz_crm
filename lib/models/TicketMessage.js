import mongoose from 'mongoose';

const ticketMessageSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportTicket',
    required: true,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  senderType: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isSystemMessage: {
    type: Boolean,
    default: false
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
ticketMessageSchema.index({ ticketId: 1, createdAt: 1 });
ticketMessageSchema.index({ organizationId: 1, ticketId: 1 });

export default mongoose.models.TicketMessage || mongoose.model('TicketMessage', ticketMessageSchema);
