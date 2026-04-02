import { DashboardActivity } from './types';

const FULL_DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SHORT_DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const COMPLETED_PROGRESS_VALUES = ['done', 'no_evolution', 'some_evolution', 'good_evolution'];

export const isCompletedProgress = (progressValue: string) => COMPLETED_PROGRESS_VALUES.includes(progressValue);

export const matchesWeeklyDay = (rawDays: string[] | undefined, dayIndex: number) => {
  const normalized = (rawDays || []).map((d) => d.toLowerCase());
  return normalized.includes(FULL_DAY_NAMES[dayIndex]) || normalized.includes(SHORT_DAY_NAMES[dayIndex]);
};

export const isScheduledForDate = (activity: DashboardActivity, date: Date) => {
  if (activity.status !== 'active') return false;

  if (activity.goal.start_date) {
    const goalStart = new Date(activity.goal.start_date);
    goalStart.setHours(0, 0, 0, 0);
    if (date < goalStart) return false;
  }

  if (activity.end_date) {
    const activityEnd = new Date(activity.end_date);
    activityEnd.setHours(23, 59, 59, 999);
    if (date > activityEnd) return false;
  }

  if (activity.frequency_type === 'daily') return true;
  if (activity.frequency_type === 'weekly') return matchesWeeklyDay(activity.days_of_week, date.getDay());
  if (activity.frequency_type === 'monthly') return activity.day_of_month === date.getDate();
  return false;
};
