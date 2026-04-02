import { isActivityCompletedForDate, isActivityLate, getActivityTimePeriod } from '@/lib/taskUtils';
import { DashboardActivity, DashboardCheckIn, GoalPriority } from './types';

export interface TodaysFocusTask {
  id: string;
  activityId: string;
  name: string;
  priority: GoalPriority;
  goalTitle: string;
  goalId: string;
  isOverdue: boolean;
}

export interface TodaysFocusOutput {
  tasks: TodaysFocusTask[];
  overdueCount: number;
  totalTodayCount: number;
}

export const calculateTodaysFocus = (activities: DashboardActivity[], checkIns: DashboardCheckIn[], now: Date): TodaysFocusOutput => {
  const todayTasks = activities.filter((activity) => {
    const period = getActivityTimePeriod(activity, now);
    return period === 'today' && !isActivityCompletedForDate(activity, checkIns, now);
  });

  const overdueTasks = activities.filter((activity) => isActivityLate(activity, checkIns, now));

  const uniqueTasks = [...overdueTasks, ...todayTasks].filter((task, index, all) => index === all.findIndex((item) => item.id === task.id));

  const priorityOrder: Record<GoalPriority, number> = { gold: 0, silver: 1, bronze: 2 };

  const tasks = uniqueTasks
    .map((activity) => ({
      id: `${activity.id}-${now.toDateString()}`,
      activityId: activity.id,
      name: activity.title,
      priority: activity.goal.priority,
      goalTitle: activity.goal.title,
      goalId: activity.goal_id,
      isOverdue: isActivityLate(activity, checkIns, now),
    }))
    .sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  return {
    tasks,
    overdueCount: overdueTasks.length,
    totalTodayCount: todayTasks.length,
  };
};
