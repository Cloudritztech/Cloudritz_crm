import connectDB from '../lib/mongodb.js';
import SupportTicket from '../lib/models/SupportTicket.js';
import TicketMessage from '../lib/models/TicketMessage.js';
import User from '../lib/models/User.js';
import Organization from '../lib/models/Organization.js';
import { authenticate } from '../lib/middleware/tenant.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  const { method } = req;
  const { action, id } = req.query;

  try {
    await authenticate(req, res, async () => {
      const userId = req.userId;
      const organizationId = req.organizationId;
      const role = req.userRole;
      const email = req.user?.email;

      // GET: Fetch tickets or messages
      if (method === 'GET') {
        // Get messages for a ticket
        if (action === 'messages' && id) {
          const ticket = await SupportTicket.findById(id);
          
          if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
          }

          // Tenant isolation check
          if (role !== 'superadmin' && ticket.organizationId.toString() !== organizationId?.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }

          // Fetch all messages for this ticket
          const messages = await TicketMessage.find({ ticketId: id })
            .sort({ createdAt: 1 })
            .lean();

          // Mark messages as read
          if (role === 'superadmin') {
            await TicketMessage.updateMany(
              { ticketId: id, senderType: 'user', read: false },
              { read: true }
            );
            ticket.unreadCount.admin = 0;
          } else {
            await TicketMessage.updateMany(
              { ticketId: id, senderType: 'admin', read: false },
              { read: true }
            );
            ticket.unreadCount.user = 0;
          }
          await ticket.save();

          return res.status(200).json({ success: true, messages });
        }

        // Get single ticket
        if (id) {
          const ticket = await SupportTicket.findById(id).lean();
          
          if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
          }

          if (role !== 'superadmin' && ticket.organizationId.toString() !== organizationId?.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }

          return res.status(200).json({ success: true, ticket });
        }

        // Get all tickets
        if (role === 'superadmin') {
          const tickets = await SupportTicket.find()
            .sort({ lastMessageAt: -1 })
            .limit(100)
            .lean();
          
          return res.status(200).json({ success: true, tickets });
        } else {
          const query = organizationId ? { organizationId } : { userId };
          const tickets = await SupportTicket.find(query)
            .sort({ lastMessageAt: -1 })
            .limit(50)
            .lean();
          
          return res.status(200).json({ success: true, tickets });
        }
      }

      // POST: Create ticket or send message
      if (method === 'POST') {
        const { subject, message, category, priority, ticketId } = req.body;

        if (!message) {
          return res.status(400).json({ success: false, message: 'Message is required' });
        }

        // Send message to existing ticket
        if (ticketId) {
          const ticket = await SupportTicket.findById(ticketId);
          
          if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
          }

          // Tenant isolation
          if (role !== 'superadmin' && ticket.organizationId.toString() !== organizationId?.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }

          // Check if user can send message
          if (role !== 'superadmin' && (ticket.status === 'closed' || ticket.status === 'resolved')) {
            return res.status(403).json({ success: false, message: 'Cannot send message to closed/resolved ticket' });
          }

          const user = await User.findById(userId);
          const senderType = role === 'superadmin' ? 'admin' : 'user';

          // Create new message document
          const newMessage = await TicketMessage.create({
            ticketId: ticket._id,
            organizationId: ticket.organizationId,
            senderType,
            senderId: userId,
            senderName: user?.name || email || 'User',
            message,
            read: false
          });

          // Update ticket
          ticket.lastMessageAt = new Date();
          ticket.messageCount = (ticket.messageCount || 0) + 1;
          
          if (senderType === 'admin') {
            ticket.unreadCount.user += 1;
            if (ticket.status === 'open') {
              ticket.status = 'in-progress';
            }
          } else {
            ticket.unreadCount.admin += 1;
          }

          await ticket.save();

          return res.status(200).json({ 
            success: true, 
            message: newMessage,
            ticket 
          });
        }

        // Create new ticket
        if (!subject) {
          return res.status(400).json({ success: false, message: 'Subject is required' });
        }

        const user = await User.findById(userId);
        const org = organizationId ? await Organization.findById(organizationId) : null;

        // Create ticket
        const ticket = await SupportTicket.create({
          organizationId: organizationId || null,
          userId,
          userName: user?.name || email || 'User',
          userEmail: email,
          organizationName: org?.name || 'Individual User',
          subject,
          category: category || 'general',
          priority: priority || 'medium',
          status: 'open',
          lastMessageAt: new Date(),
          messageCount: 1,
          unreadCount: { user: 0, admin: 1 }
        });

        // Create first message
        const firstMessage = await TicketMessage.create({
          ticketId: ticket._id,
          organizationId: ticket.organizationId,
          senderType: 'user',
          senderId: userId,
          senderName: user?.name || email || 'User',
          message,
          read: false
        });

        return res.status(201).json({ 
          success: true, 
          ticket,
          message: firstMessage
        });
      }

      // PUT: Update ticket status
      if (method === 'PUT') {
        if (!id) {
          return res.status(400).json({ success: false, message: 'Ticket ID required' });
        }

        const { status, priority, resolutionMessage } = req.body;
        const ticket = await SupportTicket.findById(id);

        if (!ticket) {
          return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (role !== 'superadmin') {
          return res.status(403).json({ success: false, message: 'Only admin can update ticket' });
        }

        const oldStatus = ticket.status;

        if (status) ticket.status = status;
        if (priority) ticket.priority = priority;

        await ticket.save();

        // Add system message for status change
        if (status && status !== oldStatus) {
          const statusMessage = `Ticket status changed from "${oldStatus}" to "${status}"`;
          
          await TicketMessage.create({
            ticketId: ticket._id,
            organizationId: ticket.organizationId,
            senderType: 'admin',
            senderId: userId,
            senderName: 'System',
            message: statusMessage,
            isSystemMessage: true,
            read: false
          });

          ticket.unreadCount.user += 1;
          ticket.messageCount += 1;
        }

        // Add resolution message if provided
        if (resolutionMessage && (status === 'resolved' || status === 'closed')) {
          const user = await User.findById(userId);
          
          await TicketMessage.create({
            ticketId: ticket._id,
            organizationId: ticket.organizationId,
            senderType: 'admin',
            senderId: userId,
            senderName: user?.name || 'Support Admin',
            message: resolutionMessage,
            read: false
          });

          ticket.unreadCount.user += 1;
          ticket.messageCount += 1;
        }

        await ticket.save();

        return res.status(200).json({ success: true, ticket });
      }

      return res.status(405).json({ success: false, message: 'Method not allowed' });
    });
  } catch (error) {
    console.error('Support API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
