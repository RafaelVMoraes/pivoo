import { useMemo } from 'react';
import { DashboardActivity, DashboardCheckIn } from '@/lib/dashboard/types';
import { calculateHabitsConsistency, HabitsConsistencyOutput } from '@/lib/dashboard/habitsConsistency';

interface UseHabitsConsistencyParams {
  activities: DashboardActivity[];
  checkIns: DashboardCheckIn[];
  now?: Date;
}

export const useHabitsConsistency = ({ activities, checkIns, now = new Date() }: UseHabitsConsistencyParams): HabitsConsistencyOutput => {
  return useMemo(() => calculateHabitsConsistency(activities, checkIns, now), [activities, checkIns, now]);
};
