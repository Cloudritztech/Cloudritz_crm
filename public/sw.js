self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.message || 'You have a new notification',
    icon: '/logo.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    tag: data.type || 'notification',
    requireInteraction: false,
    data: {
      url: data.url || '/',
      notificationId: data.id
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'CRM Notification', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
