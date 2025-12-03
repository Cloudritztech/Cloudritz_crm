import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle, TrendingUp, Package, DollarSign, FileText, BarChart } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/notifications?id=${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/notifications?action=mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/notifications?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'payment': return DollarSign;
      case 'sale': return TrendingUp;
      case 'stock': return Package;
      case 'invoice': return FileText;
      case 'report': return BarChart;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white dark:bg-[#141619] rounded-xl shadow-xl border border-gray-200 dark:border-[rgba(255,255,255,0.04)] z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-[rgba(255,255,255,0.04)] flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[500px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = getIcon(notification.type);
                  return (
                    <div
                      key={notification._id}
                      className={`p-4 border-b border-gray-100 dark:border-[rgba(255,255,255,0.04)] hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {notification.title}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification._id);
                              }}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationPanel;
