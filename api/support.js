import connectDB from '../lib/mongodb.js';
import SupportTicket from '../lib/models/SupportTicket.js';
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
      const role = req.user.role;
      const email = req.user.email;

    if (method === 'GET') {
      if (id) {
        const ticket = await SupportTicket.findById(id);
        
        if (!ticket) {
          return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (role !== 'superadmin' && ticket.organizationId.toString() !== organizationId) {
          return res.status(403).json({ success: false, message: 'Access denied' });
        }

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

      if (role === 'superadmin') {
        const tickets = await SupportTicket.find()
          .sort({ lastMessageAt: -1 })
          .limit(100);
        
        return res.status(200).json({ success: true, tickets });
      } else {
        const tickets = await SupportTicket.find({ organizationId })
          .sort({ lastMessageAt: -1 })
          .limit(50);
        
        return res.status(200).json({ success: true, tickets });
      }
    }

    if (method === 'POST') {
      const { subject, message, category, priority, ticketId } = req.body;

      if (ticketId) {
        const ticket = await SupportTicket.findById(ticketId);
        
        if (!ticket) {
          return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

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
        
        if (role === 'superadmin') {
          ticket.unreadCount.user += 1;
          ticket.status = 'in-progress';
        } else {
          ticket.unreadCount.admin += 1;
        }

        await ticket.save();

        return res.status(200).json({ success: true, ticket });
      } else {
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

    if (method === 'PUT') {
      if (!id) {
        return res.status(400).json({ success: false, message: 'Ticket ID required' });
      }

      const { status, priority } = req.body;
      const ticket = await SupportTicket.findById(id);

      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
      }

      if (role !== 'superadmin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      if (status) ticket.status = status;
      if (priority) ticket.priority = priority;

      await ticket.save();

      return res.status(200).json({ success: true, ticket });
    }

      return res.status(405).json({ success: false, message: 'Method not allowed' });
    });
  } catch (error) {
    console.error('Support API Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
