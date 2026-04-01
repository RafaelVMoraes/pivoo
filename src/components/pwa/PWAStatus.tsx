import { useEffect, useState } from 'react';
import { PWA_UPDATE_EVENT } from '@/lib/pwa';

export function PWAStatus() {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleUpdateAvailable = (event: Event) => {
      const customEvent = event as CustomEvent<{ registration: ServiceWorkerRegistration }>;
      setRegistration(customEvent.detail.registration);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(PWA_UPDATE_EVENT, handleUpdateAvailable);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(PWA_UPDATE_EVENT, handleUpdateAvailable);
    };
  }, []);

  const applyUpdate = () => {
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  };

  return (
    <>
      {isOffline && (
        <div className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 shadow-lg">
          You are offline. Cached content is available, but live updates require internet.
        </div>
      )}

      {registration?.waiting && (
        <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-lg">
          <span>A new version is available.</span>
          <button
            type="button"
            onClick={applyUpdate}
            className="rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white"
          >
            Update
          </button>
        </div>
      )}
    </>
  );
}
