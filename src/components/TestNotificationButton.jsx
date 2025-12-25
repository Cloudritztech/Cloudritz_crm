import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';

const TestNotificationButton = () => {
  const [sending, setSending] = useState(false);

  const handleSendTest = async () => {
    setSending(true);
    try {
      const response = await notificationsAPI.sendTest();
      toast.success(response.data.message || 'Test notifications sent!');
      console.log('Test notification response:', response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send test notifications');
      console.error('Test notification error:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      onClick={handleSendTest}
      disabled={sending}
      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
    >
      <Bell className="h-4 w-4" />
      {sending ? 'Sending...' : 'Send Test Notification'}
    </button>
  );
};

export default TestNotificationButton;
