// Legacy worker kept only to safely remove prior registrations from older builds.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.registration.unregister().then(() => self.clients.claim()));
});
