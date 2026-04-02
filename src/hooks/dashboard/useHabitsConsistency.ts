import { useMemo } from 'react';
import type { ActivityWithGoal, CheckInRecord } from '@/hooks/useAllActivities';
import { calculateHabitsConsistency, type HabitsConsistencyMetrics } from '@/lib/dashboard/habitsConsistency';

interface UseHabitsConsistencyParams {
  activities: ActivityWithGoal[];
  checkIns: CheckInRecord[];
  now?: Date;
}

export const useHabitsConsistency = ({ activities, checkIns, now = new Date() }: UseHabitsConsistencyParams): HabitsConsistencyMetrics =>
  useMemo(() => calculateHabitsConsistency(activities, checkIns, now), [activities, checkIns, now]);
