import { describe, expect, it } from 'bun:test';
import { matchesWeeklyDay, isScheduledForDate } from '@/lib/dashboard/frequencyUtils';
import { calculateYearProgress } from '@/lib/dashboard/yearProgress';
import { calculateHabitsConsistency } from '@/lib/dashboard/habitsConsistency';
import type { DashboardActivity, DashboardCheckIn } from '@/lib/dashboard/types';

const baseActivity: DashboardActivity = {
  id: 'a1',
  goal_id: 'g1',
  title: 'Activity',
  status: 'active',
  frequency_type: 'daily',
  created_at: '2026-01-01T00:00:00.000Z',
  goal: {
    id: 'g1',
    title: 'Goal',
    priority: 'gold',
  },
};

describe('dashboard frequency utilities', () => {
  it('accepts both short and long weekday names', () => {
    expect(matchesWeeklyDay(['Mon', 'wednesday'], 1)).toBe(true);
    expect(matchesWeeklyDay(['Mon', 'wednesday'], 3)).toBe(true);
    expect(matchesWeeklyDay(['Mon', 'wednesday'], 4)).toBe(false);
  });

  it('does not schedule before goal start or after activity end', () => {
    const activity: DashboardActivity = {
      ...baseActivity,
      frequency_type: 'weekly',
      days_of_week: ['thu'],
      goal: { ...baseActivity.goal, start_date: '2026-03-15T00:00:00.000Z' },
      end_date: '2026-03-20T00:00:00.000Z',
    };

    expect(isScheduledForDate(activity, new Date('2026-03-12T12:00:00.000Z'))).toBe(false);
    expect(isScheduledForDate(activity, new Date('2026-03-19T12:00:00.000Z'))).toBe(true);
    expect(isScheduledForDate(activity, new Date('2026-03-22T12:00:00.000Z'))).toBe(false);
  });
});

describe('calculateYearProgress', () => {
  it('counts expectations by frequency and creation date', () => {
    const now = new Date('2026-03-10T12:00:00.000Z');
    const activities: DashboardActivity[] = [
      { ...baseActivity, id: 'daily', frequency_type: 'daily', created_at: '2026-03-01T00:00:00.000Z' },
      { ...baseActivity, id: 'weekly', frequency_type: 'weekly', days_of_week: ['Mon', 'Thu'], created_at: '2026-02-01T00:00:00.000Z' },
      { ...baseActivity, id: 'monthly', frequency_type: 'monthly', day_of_month: 10, created_at: '2025-12-15T00:00:00.000Z' },
    ];

    const checkIns: DashboardCheckIn[] = [
      { activity_id: 'daily', date: '2026-03-01T12:00:00.000Z', progress_value: 'done' },
      { activity_id: 'weekly', date: '2026-03-03T12:00:00.000Z', progress_value: 'done' },
    ];

    const result = calculateYearProgress({ now, activities, checkIns, completedGoals: 1, totalGoals: 3 });

    expect(result.tasksCompleted).toBe(2);
    expect(result.totalTasks).toBe(23);
    expect(result.goalsCompleted).toBe(1);
    expect(result.totalGoals).toBe(3);
  });
});

describe('calculateHabitsConsistency', () => {
  it('keeps streak only when the latest completion is today or yesterday', () => {
    const now = new Date('2026-03-20T12:00:00.000Z');
    const activities: DashboardActivity[] = [{ ...baseActivity, id: 'daily-1' }];
    const checkIns: DashboardCheckIn[] = [
      { activity_id: 'daily-1', date: '2026-03-01T12:00:00.000Z', progress_value: 'done' },
      { activity_id: 'daily-1', date: '2026-03-02T12:00:00.000Z', progress_value: 'done' },
      { activity_id: 'daily-1', date: '2026-03-03T12:00:00.000Z', progress_value: 'done' },
    ];

    const result = calculateHabitsConsistency(activities, checkIns, now);
    expect(result.longestStreak).toBe(3);
    expect(result.currentStreak).toBe(0);
  });
});
