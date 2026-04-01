const UPDATE_EVENT = "pwa-update-available";

export const PWA_UPDATE_EVENT = UPDATE_EVENT;

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      const notifyUpdate = () => {
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { registration } }));
      };

      if (registration.waiting) {
        notifyUpdate();
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            notifyUpdate();
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  });
}
