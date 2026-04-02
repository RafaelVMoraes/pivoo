import { startOfWeek } from 'date-fns';

export const MS_PER_DAY = 86_400_000;

export const toStartOfDay = (value: Date | string) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const toEndOfDay = (value: Date | string) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

export const toDateKey = (value: Date | string) => toStartOfDay(value).toISOString().split('T')[0];

export const inclusiveDaysBetween = (start: Date, end: Date) => {
  const diff = toStartOfDay(end).getTime() - toStartOfDay(start).getTime();
  return Math.max(0, Math.floor(diff / MS_PER_DAY) + 1);
};

export const monthsInclusiveBetween = (start: Date, end: Date) => {
  const safeStart = new Date(start);
  const safeEnd = new Date(end);
  return Math.max(0, (safeEnd.getFullYear() - safeStart.getFullYear()) * 12 + (safeEnd.getMonth() - safeStart.getMonth()) + 1);
};

export const getWeekStartMonday = (value: Date) => {
  const weekStart = startOfWeek(value, { weekStartsOn: 1 });
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

export const sameOrBefore = (left: Date, right: Date) => toStartOfDay(left).getTime() <= toStartOfDay(right).getTime();

export const sameOrAfter = (left: Date, right: Date) => toStartOfDay(left).getTime() >= toStartOfDay(right).getTime();
