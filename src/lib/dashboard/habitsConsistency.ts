import type { ActivityWithGoal, CheckInRecord } from '@/hooks/useAllActivities';
import { isCheckInDone } from '@/lib/checkInStatus';
import { clampPercent, diffInCalendarDays, getWeekStartMonday, toStartOfDay } from './dateUtils';
import { isActivityScheduledOnDate, uniqueDoneDaysCount } from './scheduling';

const expectedCountForRange = (activity: ActivityWithGoal, start: Date, end: Date): number => {
  let count = 0;
  for (let cursor = toStartOfDay(start); cursor <= end; cursor = new Date(cursor.getTime() + 86_400_000)) {
    if (isActivityScheduledOnDate(activity, cursor)) count += 1;
  }
  return count;
};

const calculateStreaks = (checkIns: CheckInRecord[]): { currentStreak: number; longestStreak: number } => {
  const days = Array.from(new Set(
    checkIns
      .filter(isCheckInDone)
      .map((c) => toStartOfDay(new Date(c.date)).toISOString().split('T')[0])
  )).sort();

  if (!days.length) return { currentStreak: 0, longestStreak: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i += 1) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    if (diffInCalendarDays(prev, curr) === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  let current = 1;
  for (let i = days.length - 1; i > 0; i -= 1) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    if (diffInCalendarDays(prev, curr) === 1) current += 1;
    else break;
  }

  return { currentStreak: current, longestStreak: longest };
};

export interface HabitsConsistencyMetrics {
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
  currentStreak: number;
  longestStreak: number;
  consistencyTrend: 'improving' | 'declining' | 'stable';
  weekdayAverage: number;
  weekendAverage: number;
  insightText: string;
}

export const calculateHabitsConsistency = (
  activities: ActivityWithGoal[],
  checkIns: CheckInRecord[],
  now: Date,
): HabitsConsistencyMetrics => {
  const weekStart = getWeekStartMonday(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeActivities = activities.filter((a) => a.status === 'active');
  const dailyActivities = activeActivities.filter((a) => a.frequency_type === 'daily');

  const weeklyExpected = activeActivities.reduce((sum, activity) => sum + expectedCountForRange(activity, weekStart, now), 0);
  const weeklyCompleted = activeActivities.reduce((sum, activity) => sum + uniqueDoneDaysCount(checkIns, activity.id, weekStart, now), 0);

  const monthlyExpected = activeActivities.reduce((sum, activity) => sum + expectedCountForRange(activity, monthStart, now), 0);
  const monthlyCompleted = activeActivities.reduce((sum, activity) => sum + uniqueDoneDaysCount(checkIns, activity.id, monthStart, now), 0);

  const monthlyDoneCheckIns = checkIns.filter((c) => {
    const d = new Date(c.date);
    return d >= monthStart && d <= now && isCheckInDone(c);
  });

  const { currentStreak, longestStreak } = calculateStreaks(checkIns);

  const weekdayCheckIns = monthlyDoneCheckIns.filter((c) => {
    const day = new Date(c.date).getDay();
    return day !== 0 && day !== 6;
  }).length;

  const weekendCheckIns = monthlyDoneCheckIns.filter((c) => {
    const day = new Date(c.date).getDay();
    return day === 0 || day === 6;
  }).length;

  const weekdayAverage = dailyActivities.length ? clampPercent((weekdayCheckIns / (dailyActivities.length * 22)) * 100) : 0;
  const weekendAverage = dailyActivities.length ? clampPercent((weekendCheckIns / (dailyActivities.length * 8)) * 100) : 0;

  const middle = new Date(now.getTime() - 15 * 86_400_000);
  const firstHalf = monthlyDoneCheckIns.filter((c) => new Date(c.date) < middle).length;
  const secondHalf = monthlyDoneCheckIns.filter((c) => new Date(c.date) >= middle).length;

  let consistencyTrend: HabitsConsistencyMetrics['consistencyTrend'] = 'stable';
  if (secondHalf > firstHalf * 1.2) consistencyTrend = 'improving';
  if (secondHalf < firstHalf * 0.8) consistencyTrend = 'declining';

  let insightText = 'Start building habits by adding activities to your goals.';
  const weeklyCompletionRate = weeklyExpected ? clampPercent((weeklyCompleted / weeklyExpected) * 100) : 0;
  const monthlyCompletionRate = monthlyExpected ? clampPercent((monthlyCompleted / monthlyExpected) * 100) : 0;

  if (dailyActivities.length > 0) {
    if (weekendAverage < weekdayAverage * 0.6) insightText = 'Your weekday consistency is strong, but weekends could use more attention.';
    else if (consistencyTrend === 'improving') insightText = 'Great momentum! Your consistency has improved over the past 2 weeks.';
    else if (consistencyTrend === 'declining') insightText = 'Your routine needs a boost. Try starting with just one habit today.';
    else if (currentStreak >= 7) insightText = `Amazing! You're on a ${currentStreak}-day streak. Keep it going!`;
    else insightText = `You're completing ${weeklyCompletionRate}% of your daily habits. Small improvements compound!`;
  }

  return {
    weeklyCompletionRate,
    monthlyCompletionRate,
    currentStreak,
    longestStreak,
    consistencyTrend,
    weekdayAverage,
    weekendAverage,
    insightText,
  };
};
