const UPDATE_EVENT = 'pwa-update-available';
const SW_PATH = '/sw.js';
const DEV_RESET_KEY = 'pivoo-dev-sw-reset';
const CACHE_PREFIXES = ['pivoo-app-shell-', 'pivoo-static-', 'pivoo-runtime-'];

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

function isPreviewOrDevelopmentEnvironment() {
  const { hostname } = window.location;

  return (
    import.meta.env.DEV ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.lovableproject.com') ||
    hostname.startsWith('id-preview--')
  );
}

async function clearPwaCaches() {
  if (!('caches' in window)) return;

  const cacheKeys = await caches.keys();
  await Promise.all(
    cacheKeys
      .filter((cacheKey) => CACHE_PREFIXES.some((prefix) => cacheKey.startsWith(prefix)))
      .map((cacheKey) => caches.delete(cacheKey))
  );
}

async function disableServiceWorkersInPreview() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  const hadRegistrations = registrations.length > 0;

  await Promise.all(registrations.map((registration) => registration.unregister()));
  await clearPwaCaches();

  if (hadRegistrations && !sessionStorage.getItem(DEV_RESET_KEY)) {
    sessionStorage.setItem(DEV_RESET_KEY, 'true');
    window.location.reload();
  } else {
    sessionStorage.removeItem(DEV_RESET_KEY);
  }

  return null;
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);

  if (isPreviewOrDevelopmentEnvironment()) {
    return disableServiceWorkersInPreview();
  }

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
