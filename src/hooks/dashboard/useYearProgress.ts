import { useMemo } from 'react';
import type { ActivityWithGoal, CheckInRecord } from '@/hooks/useAllActivities';
import type { Goal } from '@/hooks/useGoals';
import { calculateYearProgress, type YearProgressMetrics } from '@/lib/dashboard/yearProgress';

interface UseYearProgressParams {
  activities: ActivityWithGoal[];
  checkIns: CheckInRecord[];
  goals: Goal[];
  now?: Date;
}

export const useYearProgress = ({ activities, checkIns, goals, now = new Date() }: UseYearProgressParams): YearProgressMetrics =>
  useMemo(() => calculateYearProgress(activities, checkIns, goals, now), [activities, checkIns, goals, now]);
