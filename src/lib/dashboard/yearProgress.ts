import { DashboardActivity, DashboardCheckIn } from './types';
import { inclusiveDaysBetween, monthsInclusiveBetween, toStartOfDay } from './dateUtils';

export interface YearProgressInput {
  now: Date;
  activities: DashboardActivity[];
  checkIns: DashboardCheckIn[];
  completedGoals: number;
  totalGoals: number;
}

export interface YearProgressOutput {
  tasksCompleted: number;
  totalTasks: number;
  goalsCompleted: number;
  totalGoals: number;
  yearProgress: number;
}

export const calculateYearProgress = ({ now, activities, checkIns, completedGoals, totalGoals }: YearProgressInput): YearProgressOutput => {
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  const yearProgress = Math.round(((now.getTime() - startOfYear.getTime()) / (endOfYear.getTime() - startOfYear.getTime())) * 100);

  const tasksCompleted = checkIns.filter((c) => new Date(c.date).getFullYear() === now.getFullYear()).length;

  const totalTasks = activities.reduce((total, activity) => {
    const createdAt = toStartOfDay(activity.created_at);
    const activityStart = createdAt.getFullYear() === now.getFullYear() ? createdAt : startOfYear;

    if (activity.frequency_type === 'daily') {
      return total + inclusiveDaysBetween(activityStart, now);
    }

    if (activity.frequency_type === 'weekly') {
      const daysPerWeek = activity.days_of_week?.length || 1;
      const weeks = Math.ceil(inclusiveDaysBetween(activityStart, now) / 7);
      return total + weeks * daysPerWeek;
    }

    if (activity.frequency_type === 'monthly') {
      return total + monthsInclusiveBetween(activityStart, now);
    }

    return total;
  }, 0);

  return {
    tasksCompleted,
    totalTasks: Math.max(1, totalTasks),
    goalsCompleted: completedGoals,
    totalGoals,
    yearProgress,
  };
};
