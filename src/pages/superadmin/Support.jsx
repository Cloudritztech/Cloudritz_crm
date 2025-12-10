import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Filter, Search, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SuperAdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 3000); // Poll every 3 seconds
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

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTickets = async () => {
    try {
      const { data } = await api.get('/support');
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketMessages = async (ticketId) => {
    try {
      const { data } = await api.get(`/support?id=${ticketId}`);
      setSelectedTicket(data.ticket);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTickets(filtered);
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
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const updateTicketStatus = async (status) => {
    if (!selectedTicket) return;

    try {
      const { data } = await api.put(`/support?id=${selectedTicket._id}`, { status });
      setSelectedTicket(data.ticket);
      loadTickets();
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
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

  const getStatusIcon = (status) => {
    const icons = {
      open: Clock,
      'in-progress': AlertCircle,
      resolved: CheckCircle,
      closed: CheckCircle
    };
    return icons[status] || Clock;
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-600">Manage customer support requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Tickets</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Open</p>
          <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-24rem)]">
        {/* Tickets List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tickets..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No tickets found</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const StatusIcon = getStatusIcon(ticket.status);
                return (
                  <div
                    key={ticket._id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                      selectedTicket?._id === ticket._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{ticket.subject}</h3>
                        <p className="text-xs text-gray-500 mt-1">{ticket.organizationName}</p>
                      </div>
                      {ticket.unreadCount?.admin > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                          {ticket.unreadCount.admin}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                        <StatusIcon className="w-3 h-3" />
                        {ticket.status}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(ticket.lastMessageAt).toLocaleString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col">
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedTicket.subject}</h2>
                    <p className="text-sm text-gray-500">
                      {selectedTicket.organizationName} • {selectedTicket.userEmail}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateTicketStatus('in-progress')}
                    className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => updateTicketStatus('resolved')}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => updateTicketStatus('closed')}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedTicket.messages?.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${msg.sender === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                      <p className={`text-xs font-medium mb-1 ${msg.sender === 'admin' ? 'text-blue-100' : 'text-gray-600'}`}>
                        {msg.senderName}
                      </p>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your response..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a ticket to view conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
