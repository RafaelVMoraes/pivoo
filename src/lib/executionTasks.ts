/**
 * executionTasks.ts
 * ----------------------------------------------------------------------
 * Utilities for transforming a list of activities and their check-in records 
 * into lists of executable tasks for display and tracking.
 * 
 * Goals:
 * - Determine which activities are due, late, or upcoming (today, this week, this month)
 * - Normalize and group tasks by frequency
 * - Provide effective sorting and metadata for each task, including completion and lateness
 * 
 * Key Types:
 * - ActivityWithGoal: Activity object with linked goal data
 * - CheckInRecord: Check-in/completion marker for the activity's execution date
 * - TaskData: Data structure for a single execution instance to be rendered/tracked in UI
 */

import {
  addDays,
  format,
  getDate,
  getDaysInMonth,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  isBefore,
  isAfter,
} from 'date-fns';

import type { ActivityWithGoal, CheckInRecord } from '@/hooks/useAllActivities';
import type { TaskData } from '@/components/goals/views/TaskSection';

/**
 * Order for time of day buckets.
 * Lower = higher display/sort priority.
 */
const TIME_OF_DAY_ORDER: Record<string, number> = {
  whole_day: 0,
  morning: 1,
  afternoon: 2,
  night: 3,
};

/**
 * Order for goal priorities.
 * Lower = higher display/sort priority.
 */
const PRIORITY_ORDER: Record<string, number> = {
  gold: 0,
  silver: 1,
  bronze: 2,
};

/**
 * Canonical short day names: always English regardless of user locale.
 */
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * Normalize day string (long/short, any case) to a canonical 3-letter day string ("Mon", ...)
 * Returns null if the input is not a recognized day.
 */
const normalizeDayName = (day: string): (typeof DAY_NAMES)[number] | null => {
  const trimmed = day.trim();
  const lower = trimmed.toLowerCase();

  switch (lower) {
    case 'sun':
    case 'sunday':
      return 'Sun';
    case 'mon':
    case 'monday':
      return 'Mon';
    case 'tue':
    case 'tues':
    case 'tuesday':
      return 'Tue';
    case 'wed':
    case 'weds':
    case 'wednesday':
      return 'Wed';
    case 'thu':
    case 'thur':
    case 'thurs':
    case 'thursday':
      return 'Thu';
    case 'fri':
    case 'friday':
      return 'Fri';
    case 'sat':
    case 'saturday':
      return 'Sat';
    default:
      return null;
  }
};

/**
 * Determines if a given activity has a completed check-in for the execution date.
 * Completion is based on valid progress values.
 */
const COMPLETED_PROGRESS_VALUES = ['done', 'no_evolution', 'some_evolution', 'good_evolution'];

const getExecutionStatus = (
  activityId: string,
  executionDate: Date,
  checkIns: CheckInRecord[]
): 'done' | 'not_done' | 'pending' => {
  const dayRecords = checkIns.filter((ci) => ci.activity_id === activityId && isSameDay(new Date(ci.date), executionDate));

  if (dayRecords.some((ci) => ci.progress_value === 'not_done')) return 'not_done';
  if (dayRecords.some((ci) => COMPLETED_PROGRESS_VALUES.includes(ci.progress_value))) return 'done';

  return 'pending';
};

/**
 * Generates a unique task instance ID from activity and date.
 */
const makeTaskId = (activityId: string, executionDate: Date) =>
  `${activityId}-${format(executionDate, 'yyyy-MM-dd')}`;

/**
 * Packs up all metadata for one execution instance (task) for display and handling.
 * isLate = true if before today, false otherwise.
 */
const createTaskData = (
  activity: ActivityWithGoal,
  executionDate: Date,
  now: Date,
  isLate: boolean
): TaskData => {
  const priority = (activity.goal.priority || 'bronze') as 'gold' | 'silver' | 'bronze';
  const timeOrder = TIME_OF_DAY_ORDER[activity.time_of_day || 'night'] ?? 2;
  const priorityOrder = PRIORITY_ORDER[priority] ?? 2;

  return {
    id: makeTaskId(activity.id, executionDate),
    activityId: activity.id,
    goalId: activity.goal_id,
    activityTitle: activity.title || activity.description, // Prefer title, fallback to description
    activityDescription: activity.description,
    goalTitle: activity.goal.title,
    priority,
    frequencyType: activity.frequency_type,
    timeOfDay: activity.time_of_day,
    daysOfWeek: activity.days_of_week,
    dayOfMonth: activity.day_of_month,
    executionDate: executionDate.toISOString(),
    isCompleted: false,
    isLate,
    // A numeric sort order (by time of day, then by priority)
    sortOrder: timeOrder * 10 + priorityOrder,
  };
};

/**
 * Get actual Date objects for all scheduled weekly execution days (for current week).
 * Accepts a list of canonical day names (e.g., ["Mon", "Thu"])
 */
const getWeeklyExecutionDatesForCurrentWeek = (now: Date, daysOfWeek: string[]): Date[] => {
  // Always use Monday as first day of week
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday

  return daysOfWeek
    .map((day) => {
      const normalized = normalizeDayName(day);
      if (!normalized) return null;
      const dayIndex = DAY_NAMES.indexOf(normalized);
      if (dayIndex === -1) return null;
      // Offset so that Mon=0...Sun=6 for a Monday-based week
      const offset = (dayIndex + 6) % 7;
      return addDays(weekStart, offset);
    })
    .filter((d): d is Date => Boolean(d));
};

/**
 * Normalize a days of week list (strings or indices) to canonical ["Mon", ...] values.
 * Used for both input cleaning and defaulting logic.
 */
const normalizeDaysList = (days: (string | number)[] | undefined | null): (typeof DAY_NAMES)[number][] => {
  if (!days || days.length === 0) return [];
  return days
    .map((day): (typeof DAY_NAMES)[number] | null => {
      if (typeof day === 'number') {
        // Clamp to valid day range
        return DAY_NAMES[Math.max(0, Math.min(6, day))];
      }
      return normalizeDayName(day);
    })
    .filter((d): d is (typeof DAY_NAMES)[number] => d !== null);
};

/**
 * For monthly habits: get the Date representing execution in the current month,
 * clamping for month length/validity.
 */
const getMonthlyExecutionDateForCurrentMonth = (now: Date, dayOfMonth: number): Date => {
  const monthStart = startOfMonth(now);
  const clampedDay = Math.min(Math.max(dayOfMonth, 1), getDaysInMonth(monthStart));
  const execution = new Date(monthStart);
  execution.setDate(clampedDay);
  return execution;
};

/**
 * Sort a list of TaskData by their execution date and configured sortOrder.
 * `direction` controls whether most recent first ("desc") or earliest first ("asc").
 */
const sortTasksInSection = (tasks: TaskData[], direction: 'asc' | 'desc') => {
  const dir = direction === 'asc' ? 1 : -1;
  return tasks.sort((a, b) => {
    const aTime = startOfDay(new Date(a.executionDate || new Date().toISOString())).getTime();
    const bTime = startOfDay(new Date(b.executionDate || new Date().toISOString())).getTime();
    if (aTime !== bTime) return (aTime - bTime) * dir;
    return a.sortOrder - b.sortOrder;
  });
};

/**
 * Main transformation: Given activities and checkins, generate task instances grouped by timeliness.
 * Output: buckets of execution tasks - "late", "today", "thisWeek", "thisMonth".
 * 
 * Behavior:
 * - Skips activities that are completed or outside of valid date range (not started, ended)
 * - For each frequency, generates appropriate instances for past/upcoming executions
 * - Each instance is marked as late or not based on execution date
 */
export const transformActivitiesToExecutionTasks = (
  activities: ActivityWithGoal[],
  checkIns: CheckInRecord[],
  now: Date
): {
  late: TaskData[];
  today: TaskData[];
  thisWeek: TaskData[];
  thisMonth: TaskData[];
} => {
  const late: TaskData[] = [];
  const today: TaskData[] = [];
  const thisWeek: TaskData[] = [];
  const thisMonth: TaskData[] = [];

  const todayStart = startOfDay(now);

  activities.forEach((activity) => {
    // Skip fully completed activities
    if (activity.status === 'completed') return;

    // Skip before goal's start date
    if (activity.goal.start_date) {
      const goalStartDate = startOfDay(new Date(activity.goal.start_date));
      if (isBefore(todayStart, goalStartDate)) {
        // Not started yet
        return;
      }
    }

    // Skip after activity's end date (if any)
    if (activity.end_date) {
      const activityEndDate = startOfDay(new Date(activity.end_date));
      if (isAfter(todayStart, activityEndDate)) {
        // Already ended
        return;
      }
    }

    const frequencyType = (activity.frequency_type || 'daily').toLowerCase() as
      | 'daily'
      | 'weekly'
      | 'monthly'
      | string;

    // -------- DAILY --------
    // Show up to 7 dates (today and previous 6), to let user see past missed tasks as "late"
    if (frequencyType === 'daily') {
      // Use goal start if later than 7 days ago
      const goalStartDate = activity.goal.start_date 
        ? startOfDay(new Date(activity.goal.start_date))
        : null;
      const earliestDate = goalStartDate && isBefore(goalStartDate, todayStart)
        ? goalStartDate
        : addDays(todayStart, -6); // fallback: past 6 + today

      for (let i = 0; i < 7; i++) {
        const executionDate = addDays(todayStart, -i);

        // Block dates before goal start, or after activity end
        if (goalStartDate && isBefore(executionDate, goalStartDate)) continue;
        if (activity.end_date && isAfter(executionDate, startOfDay(new Date(activity.end_date)))) continue;

        const executionStatus = getExecutionStatus(activity.id, executionDate, checkIns);
        if (executionStatus !== 'pending') continue;

        const isLate = !isSameDay(executionDate, todayStart) && executionDate.getTime() < todayStart.getTime();
        const task = createTaskData(activity, executionDate, now, isLate);
        (isLate ? late : today).push(task);
      }
      return;
    }

    // -------- WEEKLY --------
    if (frequencyType === 'weekly') {
      // Work out which days this activity expects in the current week
      const normalizedDays = normalizeDaysList(activity.days_of_week || []);
      // If not configured, default to today only
      const days = normalizedDays.length > 0 ? normalizedDays : [DAY_NAMES[now.getDay()]];
      const executionDates = days.length
        ? getWeeklyExecutionDatesForCurrentWeek(now, days)
        : [];

      executionDates.forEach((executionDate) => {
        const executionStart = startOfDay(executionDate);

        // Block dates before goal start, or after activity end
        if (activity.goal.start_date && isBefore(executionStart, startOfDay(new Date(activity.goal.start_date)))) {
          return;
        }
        if (activity.end_date && isAfter(executionStart, startOfDay(new Date(activity.end_date)))) {
          return;
        }

        const executionStatus = getExecutionStatus(activity.id, executionStart, checkIns);
        if (executionStatus !== 'pending') return;

        const isToday = isSameDay(executionStart, todayStart);
        const isLate = executionStart.getTime() < todayStart.getTime();

        // Keep only the scheduled day for this instance for UI context
        const task = createTaskData(
          {
            ...activity,
            days_of_week: [DAY_NAMES[executionStart.getDay()]],
          },
          executionStart,
          now,
          isLate
        );

        if (isToday)      today.push(task);
        else if (isLate)  late.push(task);
        else              thisWeek.push(task);
      });
      return;
    }

    // -------- MONTHLY --------
    if (frequencyType === 'monthly') {
      // Use scheduled day, or fallback to today
      const dom = activity.day_of_month ?? getDate(now);
      if (!dom) return;

      const executionDate = startOfDay(getMonthlyExecutionDateForCurrentMonth(now, dom));

      // Block out-of-range dates
      if (activity.goal.start_date && isBefore(executionDate, startOfDay(new Date(activity.goal.start_date)))) {
        return;
      }
      if (activity.end_date && isAfter(executionDate, startOfDay(new Date(activity.end_date)))) {
        return;
      }

      const executionStatus = getExecutionStatus(activity.id, executionDate, checkIns);
      if (executionStatus !== 'pending') return;

      const isToday = isSameDay(executionDate, todayStart);
      const isLate = executionDate.getTime() < todayStart.getTime();

      // Use the current month's instance for context
      const task = createTaskData(
        {
          ...activity,
          day_of_month: getDate(executionDate),
        },
        executionDate,
        now,
        isLate
      );

      if (isToday)      today.push(task);
      else if (isLate)  late.push(task);
      else              thisMonth.push(task);

      return;
    }
  });

  // Sort each task group for correct display order (user expectation)
  return {
    late: sortTasksInSection(late, 'desc'),
    today: sortTasksInSection(today, 'asc'),
    thisWeek: sortTasksInSection(thisWeek, 'asc'),
    thisMonth: sortTasksInSection(thisMonth, 'asc'),
  };
};
