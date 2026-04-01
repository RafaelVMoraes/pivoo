import { supabase } from '@/integrations/supabase/client';

export type NotificationMode = 'minimal' | 'standard' | 'intensive';

export interface NotificationSettings {
  mode: NotificationMode;
  morning_enabled: boolean;
  midday_enabled: boolean;
  evening_enabled: boolean;
  night_enabled: boolean;
  ai_reminder_enabled: boolean;
  self_discovery_enabled: boolean;
  morning_time: string;
  midday_time: string;
  evening_time: string;
  night_time: string;
  timezone: string;
}

export const defaultNotificationSettings: NotificationSettings = {
  mode: 'minimal',
  morning_enabled: true,
  midday_enabled: false,
  evening_enabled: true,
  night_enabled: false,
  ai_reminder_enabled: true,
  self_discovery_enabled: true,
  morning_time: '08:30:00',
  midday_time: '12:30:00',
  evening_time: '18:00:00',
  night_time: '21:00:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
};

export async function getNotificationSettings(userId: string) {
  const { data } = await (supabase as any).from('user_notification_preferences').select('*').eq('user_id', userId).maybeSingle();
  return (data as NotificationSettings | null) ?? defaultNotificationSettings;
}

export async function saveNotificationSettings(userId: string, settings: NotificationSettings) {
  const { error } = await (supabase as any).from('user_notification_preferences').upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' });
  if (error) throw error;
}
