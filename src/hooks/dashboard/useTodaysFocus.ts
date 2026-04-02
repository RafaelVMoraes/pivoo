import { useMemo } from 'react';
import { DashboardActivity, DashboardCheckIn } from '@/lib/dashboard/types';
import { calculateTodaysFocus, TodaysFocusOutput } from '@/lib/dashboard/todaysFocus';

interface UseTodaysFocusParams {
  activities: DashboardActivity[];
  checkIns: DashboardCheckIn[];
  now?: Date;
}

export const useTodaysFocus = ({ activities, checkIns, now = new Date() }: UseTodaysFocusParams): TodaysFocusOutput => {
  return useMemo(() => calculateTodaysFocus(activities, checkIns, now), [activities, checkIns, now]);
};
