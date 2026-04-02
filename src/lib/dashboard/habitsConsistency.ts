import { DashboardActivity, DashboardCheckIn } from './types';
import { getWeekStartMonday, toDateKey, toStartOfDay } from './dateUtils';
import { isCompletedProgress, matchesWeeklyDay } from './frequencyUtils';

export interface HabitsConsistencyOutput {
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
  currentStreak: number;
  longestStreak: number;
  consistencyTrend: 'improving' | 'declining' | 'stable';
  weekdayAverage: number;
  weekendAverage: number;
  insightText: string;
}

export const calculateHabitsConsistency = (activities: DashboardActivity[], checkIns: DashboardCheckIn[], now: Date): HabitsConsistencyOutput => {
  const weekStart = getWeekStartMonday(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  const dailyActivities = activities.filter((a) => a.status === 'active' && a.frequency_type === 'daily');

  const getCompletedCheckIns = (activityId: string, start: Date, end: Date) =>
    checkIns.filter((c) => {
      if (c.activity_id !== activityId || !isCompletedProgress(c.progress_value)) return false;
      const date = new Date(c.date);
      return date >= start && date <= end;
    });

  let weeklyExpected = 0;
  let weeklyCompleted = 0;

  activities.forEach((activity) => {
    if (activity.status !== 'active') return;

    const daysInWeek = Math.floor((now.getTime() - weekStart.getTime()) / 86_400_000) + 1;

    if (activity.frequency_type === 'daily') {
      weeklyExpected += Math.min(7, daysInWeek);
    } else if (activity.frequency_type === 'weekly') {
      let scheduledThisWeek = 0;
      for (let i = 0; i < daysInWeek; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        if (matchesWeeklyDay(activity.days_of_week, day.getDay())) scheduledThisWeek++;
      }
      weeklyExpected += scheduledThisWeek;
    } else if (activity.frequency_type === 'monthly' && activity.day_of_month) {
      const scheduledDate = new Date(now.getFullYear(), now.getMonth(), activity.day_of_month);
      if (scheduledDate >= weekStart && scheduledDate <= now) {
        weeklyExpected += 1;
      }
    }

    const weekCheckIns = getCompletedCheckIns(activity.id, weekStart, now);
    if (activity.frequency_type === 'monthly') {
      weeklyCompleted += weekCheckIns.length > 0 ? 1 : 0;
    } else {
      weeklyCompleted += new Set(weekCheckIns.map((ci) => toDateKey(ci.date))).size;
    }
  });

  let monthlyExpected = 0;
  let monthlyCompleted = 0;
  const daysPassed = now.getDate();

  activities.forEach((activity) => {
    if (activity.status !== 'active') return;

    if (activity.frequency_type === 'daily') {
      monthlyExpected += daysPassed;
    } else if (activity.frequency_type === 'weekly') {
      const weeksElapsed = Math.ceil(daysPassed / 7);
      monthlyExpected += weeksElapsed * (activity.days_of_week?.length || 1);
    } else if (activity.frequency_type === 'monthly' && activity.day_of_month && activity.day_of_month <= daysPassed) {
      monthlyExpected += 1;
    }

    const monthCheckIns = getCompletedCheckIns(activity.id, monthStart, now);
    if (activity.frequency_type === 'monthly') {
      monthlyCompleted += monthCheckIns.length > 0 ? 1 : 0;
    } else {
      monthlyCompleted += new Set(monthCheckIns.map((ci) => toDateKey(ci.date))).size;
    }
  });

  const monthlyCheckIns = checkIns.filter((c) => {
    if (!isCompletedProgress(c.progress_value)) return false;
    const date = new Date(c.date);
    return date >= monthStart && date <= now;
  });

  let longestStreak = 0;
  let currentStreak = 0;
  const sortedDays = [...new Set(checkIns.filter((c) => isCompletedProgress(c.progress_value)).map((c) => toDateKey(c.date)))].sort();
  let temp = 0;
  let last: Date | null = null;

  sortedDays.forEach((dayKey) => {
    const day = toStartOfDay(dayKey);
    if (!last || day.getTime() - last.getTime() === 86_400_000) {
      temp += 1;
    } else {
      temp = 1;
    }
    longestStreak = Math.max(longestStreak, temp);
    last = day;
  });

  if (sortedDays.length > 0) {
    const lastDay = toStartOfDay(sortedDays[sortedDays.length - 1]);
    const today = toStartOfDay(now);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (lastDay.getTime() === today.getTime() || lastDay.getTime() === yesterday.getTime()) {
      currentStreak = 1;
      for (let i = sortedDays.length - 2; i >= 0; i--) {
        const day = toStartOfDay(sortedDays[i]);
        const prev = toStartOfDay(sortedDays[i + 1]);
        if (prev.getTime() - day.getTime() === 86_400_000) {
          currentStreak += 1;
          continue;
        }
        break;
      }
    }
  }

  const weekdayCheckIns = monthlyCheckIns.filter((c) => {
    const day = new Date(c.date).getDay();
    return day !== 0 && day !== 6;
  });
  const weekendCheckIns = monthlyCheckIns.filter((c) => {
    const day = new Date(c.date).getDay();
    return day === 0 || day === 6;
  });

  const weekdayAverage = dailyActivities.length > 0 ? Math.round((weekdayCheckIns.length / (dailyActivities.length * 22)) * 100) : 0;
  const weekendAverage = dailyActivities.length > 0 ? Math.round((weekendCheckIns.length / (dailyActivities.length * 8)) * 100) : 0;

  const splitDate = new Date(now.getTime() - 15 * 86_400_000);
  const firstHalf = monthlyCheckIns.filter((c) => new Date(c.date) < splitDate).length;
  const secondHalf = monthlyCheckIns.filter((c) => new Date(c.date) >= splitDate).length;

  let consistencyTrend: 'improving' | 'declining' | 'stable' = 'stable';
  if (secondHalf > firstHalf * 1.2) consistencyTrend = 'improving';
  else if (secondHalf < firstHalf * 0.8) consistencyTrend = 'declining';

  let insightText = 'Start building habits by adding activities to your goals.';
  const weeklyRate = weeklyExpected > 0 ? Math.round((weeklyCompleted / weeklyExpected) * 100) : 0;
  if (dailyActivities.length > 0) {
    if (weekendAverage < weekdayAverage * 0.6) insightText = 'Your weekday consistency is strong, but weekends could use more attention.';
    else if (consistencyTrend === 'improving') insightText = 'Great momentum! Your consistency has improved over the past 2 weeks.';
    else if (consistencyTrend === 'declining') insightText = 'Your routine needs a boost. Try starting with just one habit today.';
    else if (currentStreak >= 7) insightText = `Amazing! You're on a ${currentStreak}-day streak. Keep it going!`;
    else insightText = `You're completing ${weeklyRate}% of your daily habits. Small improvements compound!`;
  }

  return {
    weeklyCompletionRate: Math.min(100, weeklyRate),
    monthlyCompletionRate: Math.min(100, monthlyExpected > 0 ? Math.round((monthlyCompleted / monthlyExpected) * 100) : 0),
    currentStreak,
    longestStreak,
    consistencyTrend,
    weekdayAverage: Math.min(100, weekdayAverage),
    weekendAverage: Math.min(100, weekendAverage),
    insightText,
  };
};
