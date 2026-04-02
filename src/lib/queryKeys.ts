export const queryKeys = {
  goals: {
    all: ['goals'] as const,
    byYear: (userId: string | undefined, year: number) => [...queryKeys.goals.all, userId ?? 'guest', year] as const,
  },
  activities: {
    all: ['activities'] as const,
    byYear: (userId: string | undefined, year: number) => [...queryKeys.activities.all, userId ?? 'guest', year] as const,
  },
  checkIns: {
    all: ['check-ins'] as const,
    byGoal: (userId: string | undefined, goalId?: string, activityId?: string) =>
      [...queryKeys.checkIns.all, userId ?? 'guest', goalId ?? 'all-goals', activityId ?? 'all-activities'] as const,
    activityRecent: (userId: string | undefined) => [...queryKeys.checkIns.all, userId ?? 'guest', 'activity-recent'] as const,
  },
  selfDiscovery: {
    all: ['self-discovery'] as const,
    byYear: (userId: string | undefined, year: number) => [...queryKeys.selfDiscovery.all, userId ?? 'guest', year] as const,
  },
  journaling: {
    all: ['journaling'] as const,
    byMonth: (userId: string | undefined, year: number, month: number) =>
      [...queryKeys.journaling.all, userId ?? 'guest', year, month] as const,
    summary: (userId: string | undefined, year: number) => [...queryKeys.journaling.all, userId ?? 'guest', year, 'summary'] as const,
  },
};
