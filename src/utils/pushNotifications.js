// Push Notifications Manager with Service Worker
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    await registerServiceWorker();
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorker();
      return true;
    }
  }

  return false;
};

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered');
      return registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }
}

export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      tag: options.tag || 'crm-notification',
      requireInteraction: false,
      ...options
    });

    notification.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
      notification.close();
    };

    setTimeout(() => notification.close(), 8000);
    return notification;
  }
};

export const checkAndShowNotifications = (newNotifications, oldNotifications) => {
  if (!newNotifications || newNotifications.length === 0) return;
  
  const oldIds = new Set(oldNotifications.map(n => n._id));
  const newItems = newNotifications.filter(n => !oldIds.has(n._id) && !n.isRead);

  newItems.forEach(notif => {
    showNotification(notif.title, {
      body: notif.message,
      tag: notif._id,
      url: '/notifications',
      data: { notificationId: notif._id }
    });
  });
};
