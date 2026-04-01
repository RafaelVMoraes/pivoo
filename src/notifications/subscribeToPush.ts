import { supabase } from '@/integrations/supabase/client';
import { registerNotificationServiceWorker } from './registerServiceWorker';

const PROMPT_KEY = 'pivoo_push_prompted_v1';

export async function handlePushSubscriptionIfEligible(userId?: string) {
  if (!userId || localStorage.getItem(PROMPT_KEY) === '1' || Notification.permission === 'denied') return;

  const { count } = await supabase.from('goals').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  if ((count ?? 0) < 3) return;

  localStorage.setItem(PROMPT_KEY, '1');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const registration = await registerNotificationServiceWorker();
  if (!registration) return;

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) return;

  const subscription = await (registration as any).pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  const { data: { session } } = await supabase.auth.getSession();
  await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      deviceKey: 'web-default',
    }),
  });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
