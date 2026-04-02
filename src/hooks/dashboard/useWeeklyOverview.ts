import { useMemo } from 'react';
import type { ActivityWithGoal, CheckInRecord } from '@/hooks/useAllActivities';
import { isCheckInDone } from '@/lib/checkInStatus';
import { getWeekStartMonday, toDateKey, toEndOfDay, toStartOfDay } from '@/lib/dashboard/dateUtils';
import { isActivityScheduledOnDate } from '@/lib/dashboard/scheduling';

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
  activities: ActivityWithGoal[];
  checkIns: CheckInRecord[];
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
}: UseWeeklyOverviewParams): WeeklyOverviewData => useMemo(() => {
  const weekStart = getWeekStartMonday(now);
  const days: WeeklyOverviewData['days'] = {};

  for (let i = 0; i < 7; i += 1) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    const dayStart = toStartOfDay(day);
    const dayEnd = toEndOfDay(day);
    const dateKey = toDateKey(day);

    const dayActivities = activities.filter((activity) => isActivityScheduledOnDate(activity, dayStart));

    const dayCheckIns = checkIns.filter((c) => {
      const d = new Date(c.date);
      return d >= dayStart && d <= dayEnd && isCheckInDone(c);
    });

    const activityById = new Map(activities.map((a) => [a.id, a]));

    days[dateKey] = {
      morning: dayActivities.filter((a) => a.time_of_day === 'morning').length,
      afternoon: dayActivities.filter((a) => a.time_of_day === 'afternoon').length,
      night: dayActivities.filter((a) => a.time_of_day === 'night').length,
      wholeDay: dayActivities.filter((a) => !a.time_of_day || a.time_of_day === 'whole_day').length,
      morningCompleted: dayCheckIns.filter((c) => activityById.get(c.activity_id)?.time_of_day === 'morning').length,
      afternoonCompleted: dayCheckIns.filter((c) => activityById.get(c.activity_id)?.time_of_day === 'afternoon').length,
      nightCompleted: dayCheckIns.filter((c) => activityById.get(c.activity_id)?.time_of_day === 'night').length,
      wholeDayCompleted: dayCheckIns.filter((c) => {
        const timeOfDay = activityById.get(c.activity_id)?.time_of_day;
        return !timeOfDay || timeOfDay === 'whole_day';
      }).length,
    };
  }

  return {
    days,
    weeklyCompletionRate,
    monthlyCompletionRate,
  };
}, [activities, checkIns, monthlyCompletionRate, now, weeklyCompletionRate]);
