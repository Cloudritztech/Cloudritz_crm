const connectDB = require('../lib/mongodb');
const SupportTicket = require('../lib/models/SupportTicket');
const User = require('../lib/models/User');
const Organization = require('../lib/models/Organization');
const { authenticate, requireRole } = require('../lib/middleware/tenant');

module.exports = async (req, res) => {
  await connectDB();

  const { method } = req;
  const { action, id } = req.query;

  try {
    // Authenticate user
    const authResult = await authenticate(req);
    if (!authResult.success) {
      return res.status(401).json({ success: false, message: authResult.message });
    }

    const { userId, organizationId, role, email } = authResult;

    // GET - List tickets or get single ticket
    if (method === 'GET') {
      if (id) {
        // Get single ticket with messages
        const ticket = await SupportTicket.findById(id);
        
        if (!ticket) {
          return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Check access
        if (role !== 'superadmin' && ticket.organizationId.toString() !== organizationId) {
          return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Mark messages as read
        if (role === 'superadmin') {
          ticket.messages.forEach(msg => {
            if (msg.sender === 'user') msg.read = true;
          });
          ticket.unreadCount.admin = 0;
        } else {
          ticket.messages.forEach(msg => {
            if (msg.sender === 'admin') msg.read = true;
          });
          ticket.unreadCount.user = 0;
        }
        await ticket.save();

        return res.status(200).json({ success: true, ticket });
      }

      // List tickets
      if (role === 'superadmin') {
        // Super admin sees all tickets
        const tickets = await SupportTicket.find()
          .sort({ lastMessageAt: -1 })
          .limit(100);
        
        return res.status(200).json({ success: true, tickets });
      } else {
        // Regular users see only their org tickets
        const tickets = await SupportTicket.find({ organizationId })
          .sort({ lastMessageAt: -1 })
          .limit(50);
        
        return res.status(200).json({ success: true, tickets });
      }
    }

    // POST - Create ticket or send message
    if (method === 'POST') {
      const { subject, message, category, priority, ticketId } = req.body;

      if (ticketId) {
        // Add message to existing ticket
        const ticket = await SupportTicket.findById(ticketId);
        
        if (!ticket) {
          return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Check access
        if (role !== 'superadmin' && ticket.organizationId.toString() !== organizationId) {
          return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const user = await User.findById(userId);
        const newMessage = {
          sender: role === 'superadmin' ? 'admin' : 'user',
          senderName: user?.name || email,
          message,
          timestamp: new Date(),
          read: false
        };

        ticket.messages.push(newMessage);
        ticket.lastMessageAt = new Date();
        
        // Update unread count
        if (role === 'superadmin') {
          ticket.unreadCount.user += 1;
          ticket.status = 'in-progress';
        } else {
          ticket.unreadCount.admin += 1;
        }

        await ticket.save();

        return res.status(200).json({ success: true, ticket });
      } else {
        // Create new ticket
        if (!subject || !message) {
          return res.status(400).json({ success: false, message: 'Subject and message required' });
        }

        const user = await User.findById(userId);
        const org = await Organization.findById(organizationId);

        const ticket = await SupportTicket.create({
          organizationId,
          userId,
          userName: user?.name || email,
          userEmail: email,
          organizationName: org?.name || 'Unknown',
          subject,
          category: category || 'general',
          priority: priority || 'medium',
          status: 'open',
          messages: [{
            sender: 'user',
            senderName: user?.name || email,
            message,
            timestamp: new Date(),
            read: false
          }],
          lastMessageAt: new Date(),
          unreadCount: { user: 0, admin: 1 }
        });

        return res.status(201).json({ success: true, ticket });
      }
    }

    // PUT - Update ticket status
    if (method === 'PUT') {
      if (!id) {
        return res.status(400).json({ success: false, message: 'Ticket ID required' });
      }

      const { status, priority } = req.body;
      const ticket = await SupportTicket.findById(id);

      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
      }

      // Only superadmin can update status/priority
      if (role !== 'superadmin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      if (status) ticket.status = status;
      if (priority) ticket.priority = priority;

      await ticket.save();

      return res.status(200).json({ success: true, ticket });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });

  } catch (error) {
    console.error('Support API Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
