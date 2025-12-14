import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
import { notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data?.notifications || []);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      fetchNotifications();
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationsAPI.delete(id);
      fetchNotifications();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return <div className="p-6">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600">Stay updated with your CRM activities</p>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="card text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif._id} className={`card ${notif.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                  <p className="text-gray-600 mt-1">{notif.message}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!notif.read && (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Check}
                      onClick={() => markAsRead(notif._id)}
                    >
                      Mark Read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Trash2}
                    onClick={() => deleteNotification(notif._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
