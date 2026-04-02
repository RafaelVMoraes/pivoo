import { useMemo } from 'react';
import type { ActivityWithGoal, CheckInRecord } from '@/hooks/useAllActivities';
import type { ValuesData } from '@/hooks/useSelfDiscovery';
import { getActivityTimePeriod, isActivityCompletedForDate, isActivityCompletedForWindow, isActivityLate } from '@/lib/taskUtils';

export interface TodaysFocusData {
  task: ActivityWithGoal | null;
  relatedValue: string | null;
  overdueCount: number;
  todayTasksCount: number;
}

export interface TodaysFocusCardData {
  tasks: Array<{
    id: string;
    activityId: string;
    name: string;
    priority: 'gold' | 'silver' | 'bronze';
    goalTitle: string;
    goalId: string;
    isOverdue: boolean;
  }>;
  overdueCount: number;
  totalTodayCount: number;
}

interface UseTodaysFocusParams {
  activities: ActivityWithGoal[];
  checkIns: CheckInRecord[];
  valuesData: ValuesData[];
  now?: Date;
}

export const useTodaysFocus = ({ activities, checkIns, valuesData, now = new Date() }: UseTodaysFocusParams) => {
  const todaysFocusData = useMemo((): TodaysFocusData => {
    const hour = now.getHours();
    const currentTimeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'night';

    const todayActivities = activities.filter((activity) => {
      const period = getActivityTimePeriod(activity, now);
      return period === 'today' && !isActivityCompletedForWindow(activity, checkIns, now);
    });

    const priorityOrder = { gold: 0, silver: 1, bronze: 2 };
    const sortedActivities = [...todayActivities].sort((a, b) => {
      const timeDiff = (a.time_of_day === currentTimeOfDay ? 0 : 1) - (b.time_of_day === currentTimeOfDay ? 0 : 1);
      if (timeDiff !== 0) return timeDiff;
      return priorityOrder[a.goal.priority] - priorityOrder[b.goal.priority];
    });

    const selectedValues = valuesData.filter((v) => v.selected).map((v) => v.value_name);

    return {
      task: sortedActivities[0] || null,
      relatedValue: selectedValues[0] || null,
      overdueCount: activities.filter((a) => isActivityLate(a, checkIns, now)).length,
      todayTasksCount: todayActivities.length + 1,
    };
  }, [activities, checkIns, now, valuesData]);

  const todaysFocusCardData = useMemo((): TodaysFocusCardData => {
    const todayTasks = activities.filter((activity) => {
      const period = getActivityTimePeriod(activity, now);
      return period === 'today' && !isActivityCompletedForDate(activity, checkIns, now);
    });

    const overdueTasks = activities.filter((activity) => isActivityLate(activity, checkIns, now));

    const tasks = [...overdueTasks, ...todayTasks]
      .filter((task, index, all) => index === all.findIndex((i) => i.id === task.id))
      .map((activity) => ({
        id: `${activity.id}-${now.toDateString()}`,
        activityId: activity.id,
        name: activity.title,
        priority: activity.goal.priority as 'gold' | 'silver' | 'bronze',
        goalTitle: activity.goal.title,
        goalId: activity.goal_id,
        isOverdue: isActivityLate(activity, checkIns, now),
      }));

    const priorityOrder = { gold: 0, silver: 1, bronze: 2 };
    tasks.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return {
      tasks,
      overdueCount: overdueTasks.length,
      totalTodayCount: todayTasks.length,
    };
  }, [activities, checkIns, now]);

  return { todaysFocusData, todaysFocusCardData };
};
