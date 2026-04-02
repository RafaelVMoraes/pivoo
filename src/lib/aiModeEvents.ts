export type AIMode = 'assistant_quick' | 'analysis_modules';
export type AIModeEventName = 'mode_opened' | 'first_message' | 'analysis_completed';

interface AIModeEventPayload {
  event: AIModeEventName;
  mode: AIMode;
  moduleId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

const STORAGE_KEY = 'pivoo.aiModeEvents';

export const trackAIModeEvent = (payload: AIModeEventPayload) => {
  const eventPayload = {
    ...payload,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pivoo:ai-mode-event', { detail: eventPayload }));

    const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
    if (Array.isArray(dataLayer)) {
      dataLayer.push({ event: 'pivoo_ai_mode_event', ...eventPayload });
    }

    try {
      const previous = window.localStorage.getItem(STORAGE_KEY);
      const parsed = previous ? JSON.parse(previous) : [];
      const next = Array.isArray(parsed) ? [...parsed, eventPayload].slice(-100) : [eventPayload];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn('Unable to persist AI mode event', error);
    }
  }

  console.info('[AI mode event]', eventPayload);
};
