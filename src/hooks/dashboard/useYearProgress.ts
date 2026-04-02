import { useMemo } from 'react';
import { DashboardActivity, DashboardCheckIn } from '@/lib/dashboard/types';
import { calculateYearProgress } from '@/lib/dashboard/yearProgress';

export interface YearProgressData {
  tasksCompleted: number;
  totalTasks: number;
  goalsCompleted: number;
  totalGoals: number;
  yearProgress: number;
}

interface UseYearProgressParams {
  activities: DashboardActivity[];
  checkIns: DashboardCheckIn[];
  completedGoals: number;
  totalGoals: number;
  now?: Date;
}

export const useYearProgress = ({ activities, checkIns, completedGoals, totalGoals, now = new Date() }: UseYearProgressParams): YearProgressData => {
  return useMemo(
    () => calculateYearProgress({ now, activities, checkIns, completedGoals, totalGoals }),
    [activities, checkIns, completedGoals, totalGoals, now],
  );
};
