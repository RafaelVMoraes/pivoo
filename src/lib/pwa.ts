const UPDATE_EVENT = 'pwa-update-available';
const SW_PATH = '/sw.js';

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export const PWA_UPDATE_EVENT = UPDATE_EVENT;

function notifyUpdate(registration: ServiceWorkerRegistration) {
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { registration } }));
}

function setupUpdateListeners(registration: ServiceWorkerRegistration) {
  if (registration.waiting) {
    notifyUpdate(registration);
  }

  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        notifyUpdate(registration);
      }
    });
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);

  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register(SW_PATH)
      .then((registration) => {
        setupUpdateListeners(registration);
        return registration;
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
        registrationPromise = null;
        return null;
      });
  }

  return registrationPromise;
}
