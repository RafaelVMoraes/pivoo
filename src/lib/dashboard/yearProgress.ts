import type { ActivityWithGoal, CheckInRecord } from '@/hooks/useAllActivities';
import type { Goal } from '@/hooks/useGoals';

export interface YearProgressMetrics {
  tasksCompleted: number;
  totalTasks: number;
  goalsCompleted: number;
  totalGoals: number;
  yearProgress: number;
}

export const calculateYearProgress = (
  activities: ActivityWithGoal[],
  checkIns: CheckInRecord[],
  goals: Goal[],
  now: Date,
): YearProgressMetrics => {
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  const yearProgress = Math.round(((now.getTime() - startOfYear.getTime()) / (endOfYear.getTime() - startOfYear.getTime())) * 100);

  const tasksCompleted = checkIns.filter((c) => new Date(c.date).getFullYear() === now.getFullYear()).length;

  let totalTasks = 0;
  activities.forEach((activity) => {
    const createdAt = new Date(activity.created_at);
    const activityStart = createdAt.getFullYear() === now.getFullYear() ? createdAt : startOfYear;
    const daysSinceStart = Math.floor((now.getTime() - activityStart.getTime()) / 86_400_000) + 1;

    if (activity.frequency_type === 'daily') totalTasks += daysSinceStart;
    else if (activity.frequency_type === 'weekly') totalTasks += Math.ceil(daysSinceStart / 7) * (activity.days_of_week?.length || 1);
    else if (activity.frequency_type === 'monthly') {
      const monthsSinceStart = (now.getFullYear() - activityStart.getFullYear()) * 12 + (now.getMonth() - activityStart.getMonth()) + 1;
      totalTasks += monthsSinceStart;
    }
  });

  return {
    tasksCompleted,
    totalTasks: Math.max(1, totalTasks),
    goalsCompleted: goals.filter((g) => g.status === 'completed').length,
    totalGoals: goals.length,
    yearProgress,
  };
};
