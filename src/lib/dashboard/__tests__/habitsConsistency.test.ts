import { describe, expect, it } from 'vitest';
import type { ActivityWithGoal, CheckInRecord } from '@/hooks/useAllActivities';
import { calculateHabitsConsistency } from '../habitsConsistency';

const makeActivity = (overrides: Partial<ActivityWithGoal> = {}): ActivityWithGoal => ({
  id: overrides.id || 'a1',
  goal_id: 'g1',
  user_id: 'u1',
  title: 'Habit',
  description: 'Habit',
  frequency_type: 'daily',
  status: 'active',
  activity_type: 'habit',
  created_at: '2026-04-01T00:00:00.000Z',
  updated_at: '2026-04-01T00:00:00.000Z',
  goal: { id: 'g1', title: 'Goal', priority: 'gold', start_date: '2026-01-01' },
  ...overrides,
});

const done = (activity_id: string, date: string): CheckInRecord => ({
  id: `${activity_id}-${date}`,
  activity_id,
  date,
  progress_value: 'done',
  execution_status: 'done',
});

describe('calculateHabitsConsistency', () => {
  it('returns zero rates when no active activities exist', () => {
    const result = calculateHabitsConsistency([], [], new Date('2026-04-10T12:00:00.000Z'));
    expect(result.weeklyCompletionRate).toBe(0);
    expect(result.monthlyCompletionRate).toBe(0);
  });

  it('caps completion rates at 100 with duplicate check-ins in same day', () => {
    const activity = makeActivity();
    const checkIns = [
      done(activity.id, '2026-04-07T08:00:00.000Z'),
      done(activity.id, '2026-04-07T20:00:00.000Z'),
      done(activity.id, '2026-04-08T08:00:00.000Z'),
    ];

    const result = calculateHabitsConsistency([activity], checkIns, new Date('2026-04-08T21:00:00.000Z'));
    expect(result.weeklyCompletionRate).toBe(100);
    expect(result.monthlyCompletionRate).toBeLessThanOrEqual(100);
  });
});
