self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || 'Pivoo';
  const body = payload.body || 'You have a new update';

  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const type = event.notification.data?.type;
  const pathByType = {
    morning: '/dashboard',
    midday_nudge: '/goals',
    late_day_nudge: '/goals',
    evening: '/dashboard',
    night: '/dashboard',
    ai_reminder: '/ai-chatbot',
    self_discovery: '/self-discovery',
  };
  const target = pathByType[type] || '/dashboard';
  event.waitUntil(clients.openWindow(target));
});
