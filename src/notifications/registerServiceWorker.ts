import { registerServiceWorker } from '@/lib/pwa';

export async function registerNotificationServiceWorker() {
  return registerServiceWorker();
}
