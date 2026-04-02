import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { trackOnboardingMetricEvent } from '@/lib/onboardingMetrics';

export interface InitialOnboardingState {
  selectedValues: string[];
  goalId?: string;
  goalTitle?: string;
  activityId?: string;
  activityTitle?: string;
  startedAt?: string;
  completedAt?: string;
  firstTaskCompletedAt?: string;
  completed: boolean;
}

const valuesOptions = ['Authenticity', 'Discipline', 'Health', 'Family', 'Learning', 'Freedom', 'Contribution', 'Peace'];

const storageKey = (userId: string) => `pivoo_initial_onboarding_${userId}`;

const readState = (userId: string): InitialOnboardingState => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) {
      return { selectedValues: [], completed: false };
    }

    const parsed = JSON.parse(raw) as Partial<InitialOnboardingState>;
    return {
      selectedValues: Array.isArray(parsed.selectedValues) ? parsed.selectedValues.slice(0, 2) : [],
      goalId: parsed.goalId,
      goalTitle: parsed.goalTitle,
      activityId: parsed.activityId,
      activityTitle: parsed.activityTitle,
      startedAt: parsed.startedAt,
      completedAt: parsed.completedAt,
      firstTaskCompletedAt: parsed.firstTaskCompletedAt,
      completed: Boolean(parsed.completed),
    };
  } catch {
    return { selectedValues: [], completed: false };
  }
};

export const useInitialOnboarding = () => {
  const { user, isGuest, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<InitialOnboardingState>({ selectedValues: [], completed: false });

  const saveState = useCallback(
    (next: InitialOnboardingState) => {
      if (!user?.id) return;
      setState(next);
      localStorage.setItem(storageKey(user.id), JSON.stringify(next));
    },
    [user?.id]
  );

  const mergeState = useCallback(
    (patch: Partial<InitialOnboardingState>) => {
      const merged = { ...state, ...patch };
      saveState(merged);
      return merged;
    },
    [saveState, state]
  );

  const refresh = useCallback(async () => {
    if (authLoading) return;

    if (!user || isGuest) {
      setState({ selectedValues: [], completed: true });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const localState = readState(user.id);

    const [{ data: selectedValues }, { data: goals }, { data: activities }, { data: checkIns }] = await Promise.all([
      supabase.from('values').select('value_name').eq('user_id', user.id).eq('selected', true),
      supabase.from('goals').select('id,title').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('activities').select('id,title,goal_id').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('check_ins').select('id,created_at').eq('user_id', user.id).order('created_at', { ascending: true }),
    ]);

    const firstGoal = goals?.[0];
    const firstActivity = activities?.[0];

    const remoteCompleted = Boolean(selectedValues?.length && goals?.length && activities?.length && checkIns?.length);

    const startedAt = localState.startedAt || new Date().toISOString();

    const mergedState: InitialOnboardingState = {
      selectedValues: localState.selectedValues.length > 0 ? localState.selectedValues : (selectedValues || []).map((item) => item.value_name).slice(0, 2),
      goalId: localState.goalId || firstGoal?.id,
      goalTitle: localState.goalTitle || firstGoal?.title || undefined,
      activityId: localState.activityId || firstActivity?.id,
      activityTitle: localState.activityTitle || firstActivity?.title || undefined,
      startedAt,
      completedAt: localState.completedAt,
      firstTaskCompletedAt: localState.firstTaskCompletedAt || checkIns?.[0]?.created_at,
      completed: localState.completed || remoteCompleted,
    };

    if (!localState.startedAt) {
      trackOnboardingMetricEvent({
        event: 'onboarding_started',
        userId: user.id,
        startedAt,
      });
    }

    if (remoteCompleted && !localState.completedAt) {
      const completedAt = new Date().toISOString();
      mergedState.completedAt = completedAt;
      const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
      trackOnboardingMetricEvent({
        event: 'onboarding_completed',
        userId: user.id,
        startedAt,
        completedAt,
        durationMs,
      });
    }

    saveState(mergedState);
    setIsLoading(false);
  }, [authLoading, isGuest, saveState, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const currentStep = useMemo(() => {
    if (state.completed) return 5;
    if (!state.selectedValues.length) return 1;
    if (!state.goalId) return 2;
    if (!state.activityId) return 3;
    if (!state.firstTaskCompletedAt) return 4;
    return 5;
  }, [state]);

  return {
    onboardingState: state,
    valuesOptions,
    isLoading,
    currentStep,
    shouldShowOnboarding: Boolean(user && !isGuest && !state.completed),
    saveOnboardingState: mergeState,
    refreshOnboarding: refresh,
  };
};
