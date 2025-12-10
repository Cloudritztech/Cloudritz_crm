import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Plus, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Support() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      loadTicketMessages(selectedTicket._id);
    }
  }, [selectedTicket?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTickets = async () => {
    try {
      const { data } = await api.get('/support');
      setTickets(data.tickets || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      setTickets([]);
      setLoading(false);
    }
  };

  const loadTicketMessages = async (ticketId) => {
    try {
      const { data } = await api.get(`/support?id=${ticketId}`);
      if (data.ticket) {
        setSelectedTicket(data.ticket);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedTicket) return;

    setSending(true);
    try {
      const { data } = await api.post('/support', {
        ticketId: selectedTicket._id,
        message: message.trim()
      });
      setSelectedTicket(data.ticket);
      setMessage('');
      loadTickets();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    setSending(true);
    try {
      const { data } = await api.post('/support', {
        subject: formData.get('subject'),
        message: formData.get('message'),
        category: formData.get('category'),
        priority: formData.get('priority')
      });
      setShowNewTicket(false);
      setSelectedTicket(data.ticket);
      loadTickets();
      toast.success('Support ticket created');
    } catch (error) {
      toast.error('Failed to create ticket');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-700',
      'in-progress': 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors.open;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-500',
      medium: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500'
    };
    return colors[priority] || colors.medium;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
          <p className="text-gray-600 dark:text-gray-400">Get help from our support team</p>
        </div>
        <button
          onClick={() => setShowNewTicket(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-6rem)]">
        {/* Tickets List */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1a1d21] rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50 dark:bg-[#0F1113] dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Your Tickets</h2>
          </div>
          <div className="overflow-y-auto h-[calc(100%-4rem)]">
            {tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No support tickets yet</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#0F1113] transition ${
                    selectedTicket?._id === ticket._id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">{ticket.subject}</h3>
                    {ticket.unreadCount?.user > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {ticket.unreadCount.user}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(ticket.lastMessageAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a1d21] rounded-lg shadow flex flex-col">
          {showNewTicket ? (
            <div className="flex-1 p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create New Ticket</h2>
              <form onSubmit={createTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0F1113] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of your issue"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select name="category" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0F1113] text-gray-900 dark:text-white rounded-lg">
                      <option value="general">General</option>
                      <option value="technical">Technical</option>
                      <option value="billing">Billing</option>
                      <option value="feature-request">Feature Request</option>
                      <option value="bug">Bug Report</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                    <select name="priority" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0F1113] text-gray-900 dark:text-white rounded-lg">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0F1113] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your issue in detail..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sending ? 'Creating...' : 'Create Ticket'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewTicket(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-[#0F1113]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">{selectedTicket.subject}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ticket #{selectedTicket._id.slice(-8)}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedTicket.messages?.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'admin' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[70%] ${msg.sender === 'admin' ? 'bg-gray-100 dark:bg-[#0F1113] text-gray-900 dark:text-white' : 'bg-blue-600 text-white'} rounded-lg p-3`}>
                      <p className={`text-xs font-medium mb-1 ${msg.sender === 'admin' ? 'text-gray-600 dark:text-gray-400' : 'text-blue-100'}`}>
                        {msg.senderName}
                      </p>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'admin' ? 'text-gray-500 dark:text-gray-400' : 'text-blue-100'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-[#0F1113]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1d21] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>Select a ticket to view conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
