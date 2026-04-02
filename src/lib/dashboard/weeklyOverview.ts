import { format as dateFnsFormat } from 'date-fns';
import { DashboardActivity, DashboardCheckIn } from './types';
import { getWeekStartMonday, toEndOfDay, toStartOfDay } from './dateUtils';
import { isCompletedProgress, isScheduledForDate } from './frequencyUtils';

export interface WeeklyOverviewDayData {
  morning: number;
  afternoon: number;
  night: number;
  wholeDay: number;
  morningCompleted: number;
  afternoonCompleted: number;
  nightCompleted: number;
  wholeDayCompleted: number;
}

export interface WeeklyOverviewOutput {
  days: Record<string, WeeklyOverviewDayData>;
}

export const calculateWeeklyOverviewDays = (activities: DashboardActivity[], checkIns: DashboardCheckIn[], now: Date): WeeklyOverviewOutput => {
  const weekStart = getWeekStartMonday(now);
  const activitiesById = new Map(activities.map((a) => [a.id, a]));
  const days: Record<string, WeeklyOverviewDayData> = {};

  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);

    const dayActivities = activities.filter((activity) => isScheduledForDate(activity, day));

    const dayStart = toStartOfDay(day);
    const dayEnd = toEndOfDay(day);

    const dayCheckIns = checkIns.filter((c) => {
      if (!isCompletedProgress(c.progress_value)) return false;
      const date = new Date(c.date);
      return date >= dayStart && date <= dayEnd;
    });

    const key = dateFnsFormat(day, 'yyyy-MM-dd');
    days[key] = {
      morning: dayActivities.filter((a) => a.time_of_day === 'morning').length,
      afternoon: dayActivities.filter((a) => a.time_of_day === 'afternoon').length,
      night: dayActivities.filter((a) => a.time_of_day === 'night').length,
      wholeDay: dayActivities.filter((a) => !a.time_of_day || a.time_of_day === 'whole_day').length,
      morningCompleted: dayCheckIns.filter((c) => activitiesById.get(c.activity_id)?.time_of_day === 'morning').length,
      afternoonCompleted: dayCheckIns.filter((c) => activitiesById.get(c.activity_id)?.time_of_day === 'afternoon').length,
      nightCompleted: dayCheckIns.filter((c) => activitiesById.get(c.activity_id)?.time_of_day === 'night').length,
      wholeDayCompleted: dayCheckIns.filter((c) => {
        const slot = activitiesById.get(c.activity_id)?.time_of_day;
        return !slot || slot === 'whole_day';
      }).length,
    };
  }

  return { days };
};
