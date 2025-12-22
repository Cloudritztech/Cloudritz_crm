import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { requestNotificationPermission } from '../utils/pushNotifications';

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkPermission = () => {
      if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(() => setShow(true), 3000);
      }
    };
    checkPermission();
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setShow(false);
      localStorage.setItem('notificationPromptShown', 'true');
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('notificationPromptShown', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white rounded-lg shadow-2xl border border-gray-200 p-4 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Enable Notifications
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Get instant alerts for invoices, payments, and important updates even when the app is closed.
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enable
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
