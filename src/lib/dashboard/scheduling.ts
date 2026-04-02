import type { ActivityWithGoal, CheckInRecord } from '@/hooks/useAllActivities';
import { isCheckInDone } from '@/lib/checkInStatus';
import { DAY_NAMES_LONG, DAY_NAMES_SHORT, normalizeWeekdayToken, toEndOfDay, toStartOfDay } from './dateUtils';

export const isActivityScheduledOnDate = (activity: ActivityWithGoal, date: Date): boolean => {
  if (activity.status !== 'active') return false;

  const dayStart = toStartOfDay(date);

  if (activity.goal.start_date) {
    const goalStartDate = toStartOfDay(new Date(activity.goal.start_date));
    if (dayStart < goalStartDate) return false;
  }

  if (activity.end_date) {
    const endDate = toEndOfDay(new Date(activity.end_date));
    if (dayStart > endDate) return false;
  }

  if (activity.frequency_type === 'daily') return true;

  if (activity.frequency_type === 'weekly') {
    const scheduled = new Set((activity.days_of_week || []).map(normalizeWeekdayToken));
    const dayIndex = dayStart.getDay();
    const longToken = normalizeWeekdayToken(DAY_NAMES_LONG[dayIndex]);
    const shortToken = normalizeWeekdayToken(DAY_NAMES_SHORT[dayIndex]);
    return scheduled.has(longToken) || scheduled.has(shortToken);
  }

  if (activity.frequency_type === 'monthly') {
    return activity.day_of_month === dayStart.getDate();
  }

  return false;
};

export const uniqueDoneDaysCount = (
  checkIns: CheckInRecord[],
  activityId: string,
  rangeStart: Date,
  rangeEnd: Date,
): number => {
  const start = toStartOfDay(rangeStart);
  const end = toEndOfDay(rangeEnd);

  const uniqueDays = new Set(
    checkIns
      .filter((c) => c.activity_id === activityId && isCheckInDone(c))
      .map((c) => new Date(c.date))
      .filter((date) => date >= start && date <= end)
      .map((date) => toStartOfDay(date).toISOString().split('T')[0])
  );

  return uniqueDays.size;
};
