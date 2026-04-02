/**
 * taskUtils.ts
 * -------------------------------------------------------------------------
 * Utility functions for determining execution and scheduling logic
 * for user activities (habits, tasks, goals) in the context of check-ins.
 *
 * Main Responsibilities:
 *  - Determine if an activity is completed for the current window
 *  - Detect overdue/late/missed activities
 *  - Assign activities to time buckets (today/this week/etc)
 *  - Transform activities into enriched TaskData structures, ready for
 *    UI rendering/sorting/grouping by schedule and status
 *
 * Types Used:
 *  - ActivityWithGoal: Model of an activity including its linked goal info
 *  - CheckInRecord: Instance of a completion (check-in) for an activity
 *  - TaskData: Aggregate data for a single task's UI row
 */

import {
  isToday,
  isThisWeek,
  isThisMonth,
  startOfDay,
  startOfWeek,
  startOfMonth,
  isBefore,
  getDay,
  getDate,
} from 'date-fns';

import { ActivityWithGoal, CheckInRecord } from '@/hooks/useAllActivities';
import { TaskData } from '@/components/goals/views/TaskSection';
import { isCheckInDone } from '@/lib/checkInStatus';

/**
 * Used to order tasks by time of day in sorting/grouping.
 * Lower value = higher display priority.
 */
const TIME_OF_DAY_ORDER: Record<string, number> = {
  whole_day: 0,
  morning: 1,
  afternoon: 2,
  night: 3,
};

/**
 * Used to order tasks by their goal's priority (e.g., "gold" = most important).
 * Lower value = higher display priority.
 */
const PRIORITY_ORDER: Record<string, number> = {
  gold: 0,
  silver: 1,
  bronze: 2,
};

/**
 * Canonical names for days of the week, for cross-referencing scheduling.
 */
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Determines whether an activity is completed for the current execution window.
 * Completion means at least one check-in resolved as execution_status === 'done' in the current period.
 *
 * @param activity ActivityWithGoal to check
 * @param checkIns List of all check-in records
 * @param now Current Date (used for window cutoffs)
 * @returns true if the activity has a check-in in its current window
 */
export const isActivityCompletedForWindow = (
  activity: ActivityWithGoal,
  checkIns: CheckInRecord[],
  now: Date
): boolean => {
  // Filter for relevant check-ins (by activity id, and must be marked 'done')
  const activityCheckIns = checkIns.filter(
    (ci) => ci.activity_id === activity.id && isCheckInDone(ci)
  );

  if (activityCheckIns.length === 0) return false;

  // Choose the window start date based on frequency type
  const frequencyType = activity.frequency_type || 'daily';

  let windowStart: Date;
  switch (frequencyType) {
    case 'daily':
      windowStart = startOfDay(now);
      break;
    case 'weekly':
      windowStart = startOfWeek(now, { weekStartsOn: 1 }); // ISO: week starts on Monday
      break;
    case 'monthly':
      windowStart = startOfMonth(now);
      break;
    default:
      windowStart = startOfDay(now); // fallback
  }

  // If there's a check-in for this activity >= window start, it's considered completed
  return activityCheckIns.some((ci) => {
    const checkInDate = new Date(ci.date);
    return checkInDate >= windowStart;
  });
};

/**
 * Determines whether an activity is completed for a specific date (same-day check).
 * Used by Today's Focus and Weekly Overview where per-day granularity is needed,
 * even for weekly/monthly activities that may be scheduled on multiple days.
 *
 * @param activity ActivityWithGoal to check
 * @param checkIns List of all check-in records
 * @param date The specific date to check completion for
 * @returns true if the activity has a same-day check-in
 */
export const isActivityCompletedForDate = (
  activity: ActivityWithGoal,
  checkIns: CheckInRecord[],
  date: Date
): boolean => {
  const dayStart = startOfDay(date);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  return checkIns.some((ci) => {
    if (ci.activity_id !== activity.id) return false;
    if (!isCheckInDone(ci)) return false;
    const checkInDate = new Date(ci.date);
    return checkInDate >= dayStart && checkInDate <= dayEnd;
  });
};

/**
 * Determines if an activity is late (i.e., the execution window has passed and was missed).
 * Uses time-of-day for daily tasks, scheduled week days for weekly, and day-of-month for monthly.
 *
 * @param activity ActivityWithGoal to check
 * @param checkIns List of all check-in records
 * @param now Current Date (used for window cutoffs)
 * @returns true if the activity is considered late (and not already completed)
 */
export const isActivityLate = (
  activity: ActivityWithGoal,
  checkIns: CheckInRecord[],
  now: Date
): boolean => {
  const frequencyType = activity.frequency_type || 'daily';
  const isCompleted = isActivityCompletedForWindow(activity, checkIns, now);

  if (isCompleted) return false;

  // 1. Daily: Check if we're past its designated slot today
  if (frequencyType === 'daily') {
    const hour = now.getHours();
    const timeOfDay = activity.time_of_day;

    // If current time is past the window, and not completed, it's late.
    // Morning: ends at 12, Afternoon: ends at 18; Night is always on time that day.
    if (timeOfDay === 'morning' && hour >= 12) return true;
    if (timeOfDay === 'afternoon' && hour >= 18) return true;
    // "night" tasks never considered late the same day (user still has until midnight)
  }

  // 2. Weekly: Check scheduled days for current week before today
  if (frequencyType === 'weekly' && activity.days_of_week?.length) {
    const currentDayIndex = getDay(now); // 0=Sun...6=Sat
    const scheduledDays = activity.days_of_week.map(d => d.toLowerCase());

    // Look for any scheduled day earlier this week not completed (before current day)
    for (let i = 0; i < currentDayIndex; i++) {
      const shortName = DAY_NAMES_SHORT[i].toLowerCase();
      const longName = DAY_NAMES_LONG[i].toLowerCase();
      if (scheduledDays.includes(shortName) || scheduledDays.includes(longName)) {
        return true;
      }
    }
  }

  // 3. Monthly: If we're past the scheduled day of the month, and not completed, it's late
  if (frequencyType === 'monthly' && activity.day_of_month) {
    const currentDayOfMonth = getDate(now);
    if (currentDayOfMonth > activity.day_of_month) return true;
  }

  // Otherwise, not considered late
  return false;
};

/**
 * Determines which main time bucket ("today", "thisWeek", "thisMonth", "later") an activity belongs to, for UI grouping.
 * This is based on frequency, scheduled day, and today's date.
 *
 * @param activity ActivityWithGoal
 * @param now Current date
 * @returns Bucket label for sorting/grouping in the task list
 */
export const getActivityTimePeriod = (
  activity: ActivityWithGoal,
  now: Date
): 'today' | 'thisWeek' | 'thisMonth' | 'later' => {
  const frequencyType = activity.frequency_type || 'daily';

  if (frequencyType === 'daily') {
    // Daily: always relevant to "today"
    return 'today';
  }

  if (frequencyType === 'weekly') {
    // Weekly: If today is one of the scheduled days, consider "today"
    if (activity.days_of_week?.length) {
      const currentDayIndex = getDay(now);
      const currentShort = DAY_NAMES_SHORT[currentDayIndex].toLowerCase();
      const currentLong = DAY_NAMES_LONG[currentDayIndex].toLowerCase();
      const scheduledLower = activity.days_of_week.map(d => d.toLowerCase());
      if (scheduledLower.includes(currentShort) || scheduledLower.includes(currentLong)) {
        return 'today';
      }
    }
    // Otherwise, scheduled sometime this week
    return 'thisWeek';
  }

  if (frequencyType === 'monthly') {
    // Monthly: if today is the scheduled day, "today"
    const currentDayOfMonth = getDate(now);
    if (activity.day_of_month === currentDayOfMonth) {
      return 'today';
    }
    // If it's upcoming this month, so "thisMonth"
    if (activity.day_of_month && activity.day_of_month > currentDayOfMonth) {
      return 'thisMonth';
    }
    // If past day of month, show in later (next month)
    return 'later';
  }

  return 'later';
};

/**
 * Transform activities into sorted task data
 */
export const transformActivitiesToTasks = (
  activities: ActivityWithGoal[],
  checkIns: CheckInRecord[],
  now: Date
): {
  today: TaskData[];
  thisWeek: TaskData[];
  thisMonth: TaskData[];
  later: TaskData[];
} => {
  const today: TaskData[] = [];
  const thisWeek: TaskData[] = [];
  const thisMonth: TaskData[] = [];
  const later: TaskData[] = [];

  activities.forEach((activity) => {
    const priority = (activity.goal.priority || 'bronze') as 'gold' | 'silver' | 'bronze';
    const isCompleted = isActivityCompletedForWindow(activity, checkIns, now);
    
    // Skip completed activities - they should not appear in this view
    if (isCompleted) return;
    
    const isLate = isActivityLate(activity, checkIns, now);
    const timePeriod = getActivityTimePeriod(activity, now);

    // Calculate sort order: time of day first, then priority
    const timeOrder = TIME_OF_DAY_ORDER[activity.time_of_day || 'night'] ?? 2;
    const priorityOrder = PRIORITY_ORDER[priority] ?? 2;
    const sortOrder = timeOrder * 10 + priorityOrder;

    const taskData: TaskData = {
      id: `${activity.id}-${timePeriod}`,
      activityId: activity.id,
      goalId: activity.goal_id,
      activityTitle: activity.title || activity.description,
      activityDescription: activity.description,
      goalTitle: activity.goal.title,
      priority,
      frequencyType: activity.frequency_type,
      timeOfDay: activity.time_of_day,
      daysOfWeek: activity.days_of_week,
      dayOfMonth: activity.day_of_month,
      isCompleted: false,
      isLate,
      sortOrder,
    };

    // Late tasks always go to today section
    if (isLate) {
      today.push(taskData);
    } else {
      switch (timePeriod) {
        case 'today':
          today.push(taskData);
          break;
        case 'thisWeek':
          thisWeek.push(taskData);
          break;
        case 'thisMonth':
          thisMonth.push(taskData);
          break;
        default:
          later.push(taskData);
      }
    }
  });

  // Sort each group
  const sortTasks = (tasks: TaskData[]) =>
    tasks.sort((a, b) => {
      // Late tasks first
      if (a.isLate && !b.isLate) return -1;
      if (!a.isLate && b.isLate) return 1;
      // Then by sort order (time of day + priority)
      return a.sortOrder - b.sortOrder;
    });

  return {
    today: sortTasks(today),
    thisWeek: sortTasks(thisWeek),
    thisMonth: sortTasks(thisMonth),
    later: sortTasks(later),
  };
};
