import { format, startOfWeek } from 'date-fns';

export const MS_IN_DAY = 86_400_000;

export const toStartOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const toEndOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

export const getWeekStartMonday = (date: Date): Date => toStartOfDay(startOfWeek(date, { weekStartsOn: 1 }));

export const toDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');

export const diffInCalendarDays = (from: Date, to: Date): number => {
  const fromStart = toStartOfDay(from).getTime();
  const toStart = toStartOfDay(to).getTime();
  return Math.floor((toStart - fromStart) / MS_IN_DAY);
};

export const clampPercent = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

export const DAY_NAMES_LONG = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
export const DAY_NAMES_SHORT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export const normalizeWeekdayToken = (value: string): string => value.trim().toLowerCase().slice(0, 3);

export const isSameDay = (left: Date, right: Date): boolean => toStartOfDay(left).getTime() === toStartOfDay(right).getTime();
