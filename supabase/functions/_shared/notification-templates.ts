export type NotificationTemplateKey =
  | 'morning'
  | 'midday_nudge'
  | 'late_day_nudge'
  | 'evening'
  | 'night'
  | 'ai_reminder'
  | 'self_discovery_1'
  | 'self_discovery_2'
  | 'self_discovery_3'
  | 'self_discovery_4';

export const NOTIFICATION_TEMPLATES: Record<NotificationTemplateKey, { title: string; body: string }> = {
  morning: { title: 'Today you have {{count}} tasks', body: 'Start with one.' },
  midday_nudge: { title: 'You still have {{count}} tasks pending', body: 'A small step now beats pressure later.' },
  late_day_nudge: { title: '{{completion}}% complete so far', body: 'One more focused sprint can change your day.' },
  evening: { title: 'You completed {{completion}}% today', body: 'Momentum > perfection.' },
  night: { title: 'Daily check-out: {{completion}}% completed', body: 'Consistency compounds. Reset and continue tomorrow.' },
  ai_reminder: { title: 'Time to step back', body: 'Want Pivoo to analyze your progress?' },
  self_discovery_1: { title: 'Self-discovery check', body: 'Clarity drives execution. Revisit your self-discovery.' },
  self_discovery_2: { title: 'Self-discovery check', body: 'Goals feel scattered? Recalibrate through self-discovery.' },
  self_discovery_3: { title: 'Self-discovery check', body: 'Direction check: still aligned? Revisit what matters in self-discovery.' },
  self_discovery_4: { title: 'Self-discovery check', body: 'High performers review foundations. Explore the self-discovery module.' },
};

export function applyTemplate(key: NotificationTemplateKey, values: Record<string, string | number> = {}) {
  const template = NOTIFICATION_TEMPLATES[key];
  return {
    title: interpolate(template.title, values),
    body: interpolate(template.body, values),
  };
}

function interpolate(input: string, values: Record<string, string | number>) {
  return input.replace(/\{\{(.*?)\}\}/g, (_, k) => String(values[k.trim()] ?? ''));
}
