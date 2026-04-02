import { useMemo } from 'react';
import { DashboardActivity, DashboardCheckIn } from '@/lib/dashboard/types';
import { calculateWeeklyOverviewDays } from '@/lib/dashboard/weeklyOverview';

export interface WeeklyOverviewData {
  days: Record<string, {
    morning: number;
    afternoon: number;
    night: number;
    wholeDay: number;
    morningCompleted: number;
    afternoonCompleted: number;
    nightCompleted: number;
    wholeDayCompleted: number;
  }>;
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
}

interface UseWeeklyOverviewParams {
  activities: DashboardActivity[];
  checkIns: DashboardCheckIn[];
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
  now?: Date;
}

export const useWeeklyOverview = ({
  activities,
  checkIns,
  weeklyCompletionRate,
  monthlyCompletionRate,
  now = new Date(),
}: UseWeeklyOverviewParams): WeeklyOverviewData => {
  return useMemo(() => {
    const overview = calculateWeeklyOverviewDays(activities, checkIns, now);
    return {
      ...overview,
      weeklyCompletionRate,
      monthlyCompletionRate,
    };
  }, [activities, checkIns, weeklyCompletionRate, monthlyCompletionRate, now]);
};
