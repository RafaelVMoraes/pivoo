import { describe, expect, it } from 'vitest';
import type { ActivityWithGoal } from '@/hooks/useAllActivities';
import { isActivityScheduledOnDate } from '../scheduling';

const baseActivity: ActivityWithGoal = {
  id: 'a1',
  goal_id: 'g1',
  user_id: 'u1',
  title: 'Test',
  description: 'Test',
  frequency_type: 'daily',
  status: 'active',
  activity_type: 'habit',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  goal: {
    id: 'g1',
    title: 'Goal',
    priority: 'gold',
    start_date: '2026-01-01',
  },
};

describe('isActivityScheduledOnDate', () => {
  it('supports weekly short and long weekday names', () => {
    const weekly = { ...baseActivity, frequency_type: 'weekly' as const, days_of_week: ['Mon', 'thursday'] };
    expect(isActivityScheduledOnDate(weekly, new Date('2026-04-06T12:00:00.000Z'))).toBe(true);
    expect(isActivityScheduledOnDate(weekly, new Date('2026-04-07T12:00:00.000Z'))).toBe(false);
  });

  it('respects goal start date and activity end date boundaries', () => {
    const bounded = { ...baseActivity, end_date: '2026-04-10' };
    expect(isActivityScheduledOnDate(bounded, new Date('2025-12-31T12:00:00.000Z'))).toBe(false);
    expect(isActivityScheduledOnDate(bounded, new Date('2026-04-10T12:00:00.000Z'))).toBe(true);
    expect(isActivityScheduledOnDate(bounded, new Date('2026-04-11T12:00:00.000Z'))).toBe(false);
  });

  it('handles monthly frequencies on exact day only', () => {
    const monthly = { ...baseActivity, frequency_type: 'monthly' as const, day_of_month: 15 };
    expect(isActivityScheduledOnDate(monthly, new Date('2026-03-15T12:00:00.000Z'))).toBe(true);
    expect(isActivityScheduledOnDate(monthly, new Date('2026-03-16T12:00:00.000Z'))).toBe(false);
  });
});
