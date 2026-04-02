export type OnboardingMetricEvent =
  | {
      event: 'onboarding_started';
      userId: string;
      startedAt: string;
    }
  | {
      event: 'onboarding_completed';
      userId: string;
      startedAt: string;
      completedAt: string;
      durationMs: number;
    }
  | {
      event: 'first_task_completed';
      userId: string;
      startedAt: string;
      completedAt: string;
      timeToFirstTaskMs: number;
    };

const METRICS_KEY = 'pivoo_onboarding_metrics';

const persistMetric = (payload: OnboardingMetricEvent) => {
  try {
    const raw = localStorage.getItem(METRICS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(parsed) ? [...parsed, payload].slice(-500) : [payload];
    localStorage.setItem(METRICS_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('Unable to persist onboarding metric', error);
  }
};

export const trackOnboardingMetricEvent = (payload: OnboardingMetricEvent) => {
  persistMetric(payload);

  try {
    window.dispatchEvent(new CustomEvent('pivoo:onboarding-metric', { detail: payload }));

    const dataLayer = (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer;
    if (Array.isArray(dataLayer)) {
      dataLayer.push({ event: 'pivoo_onboarding_metric', ...payload });
    }
  } catch (error) {
    console.warn('Unable to dispatch onboarding metric', error);
  }

  console.info('[Onboarding metric event]', payload);
};
