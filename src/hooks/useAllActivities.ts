import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useYear } from '@/contexts/YearContext';
import { Activity } from './useActivities';
import { Goal } from './useGoals';
import { queryKeys } from '@/lib/queryKeys';

export interface ActivityWithGoal extends Activity {
  goal: Pick<Goal, 'id' | 'title' | 'priority' | 'start_date'>;
}

export interface CheckInRecord {
  id: string;
  activity_id: string;
  date: string;
  progress_value: string;
  created_at?: string;
}

interface AllActivitiesData {
  activities: ActivityWithGoal[];
  checkIns: CheckInRecord[];
}

const COMPLETED_PROGRESS_VALUES = ['done', 'no_evolution', 'some_evolution', 'good_evolution'];
const TRACKED_TASK_PROGRESS_VALUES = [...COMPLETED_PROGRESS_VALUES, 'not_done'];

const toCanonicalExecutionDateISO = (executionDateISO?: string) => {
  if (!executionDateISO) return new Date().toISOString();
  const parsed = new Date(executionDateISO);
  return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0)).toISOString();
};

const dayRange = (executionDateISO: string) => {
  const executionDate = new Date(executionDateISO);
  const dayStart = new Date(executionDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(executionDate);
  dayEnd.setHours(23, 59, 59, 999);
  return { dayStart, dayEnd };
};

export const useAllActivities = () => {
  const { user, isGuest } = useAuth();
  const { selectedYear } = useYear();
  const queryClient = useQueryClient();
  const queryKey = queryKeys.activities.byYear(user?.id, selectedYear);

  const dataQuery = useQuery({
    queryKey,
    enabled: !!user && !isGuest,
    queryFn: async (): Promise<AllActivitiesData> => {
      const yearStart = new Date(selectedYear, 0, 1).toISOString();
      const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString();

      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select(`
          *,
          goals!inner (
            id,
            title,
            priority,
            status,
            start_date,
            created_at
          )
        `)
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .eq('goals.status', 'active')
        .gte('goals.created_at', yearStart)
        .lte('goals.created_at', yearEnd);

      if (activitiesError) throw activitiesError;

      const transformedActivities: ActivityWithGoal[] = (activitiesData || []).map((item: any) => ({
        id: item.id,
        goal_id: item.goal_id,
        user_id: item.user_id,
        title: item.title || item.description,
        description: item.description,
        frequency: item.frequency,
        frequency_type: item.frequency_type,
        frequency_value: item.frequency_value,
        time_of_day: item.time_of_day,
        days_of_week: item.days_of_week,
        day_of_month: item.day_of_month,
        status: item.status,
        activity_type: item.activity_type || 'habit',
        target_value: item.target_value,
        end_date: item.end_date,
        created_at: item.created_at,
        updated_at: item.updated_at,
        goal: {
          id: item.goals.id,
          title: item.goals.title,
          priority: item.goals.priority,
          start_date: item.goals.start_date,
        },
      }));

      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      const { data: checkInsData, error: checkInsError } = await supabase
        .from('check_ins')
        .select('id, activity_id, date, progress_value, created_at')
        .eq('user_id', user!.id)
        .gte('date', thirtyOneDaysAgo.toISOString())
        .not('activity_id', 'is', null);

      if (checkInsError) throw checkInsError;

      return {
        activities: transformedActivities,
        checkIns: (checkInsData || []) as CheckInRecord[],
      };
    },
    staleTime: 15_000,
  });

  const mutateCachedCheckIns = (updater: (checkIns: CheckInRecord[]) => CheckInRecord[]) => {
    queryClient.setQueryData<AllActivitiesData>(queryKey, (previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        checkIns: updater(previous.checkIns),
      };
    });
  };

  const deleteByDay = async (activityId: string, canonicalDate: string) => {
    const { dayStart, dayEnd } = dayRange(canonicalDate);
    const { error } = await supabase
      .from('check_ins')
      .delete()
      .eq('activity_id', activityId)
      .eq('user_id', user!.id)
      .in('progress_value', TRACKED_TASK_PROGRESS_VALUES)
      .gte('date', dayStart.toISOString())
      .lte('date', dayEnd.toISOString());

    if (error) throw error;

    mutateCachedCheckIns((checkIns) =>
      checkIns.filter((ci) => {
        if (ci.activity_id !== activityId) return true;
        const ciDate = new Date(ci.date);
        const isTracked = TRACKED_TASK_PROGRESS_VALUES.includes(ci.progress_value);
        return ciDate < dayStart || ciDate > dayEnd || !isTracked;
      })
    );
  };

  const createMutation = useMutation({
    mutationFn: async ({
      activityId,
      goalId,
      executionDateISO,
      progressValue,
    }: {
      activityId: string;
      goalId: string;
      executionDateISO?: string;
      progressValue: 'done' | 'not_done';
    }) => {
      if (isGuest || !user) return null;
      const canonicalDate = toCanonicalExecutionDateISO(executionDateISO);
      await deleteByDay(activityId, canonicalDate);

      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          activity_id: activityId,
          goal_id: goalId,
          user_id: user.id,
          date: canonicalDate,
          progress_value: progressValue,
          input_type: 'checkbox',
        })
        .select('id, activity_id, date, progress_value, created_at')
        .single();

      if (error) throw error;

      mutateCachedCheckIns((checkIns) => [data as CheckInRecord, ...checkIns]);
      return data;
    },
    onError: (error) => {
      console.error('Error creating check-in:', error);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ activityId, executionDateISO }: { activityId: string; executionDateISO: string }) => {
      if (isGuest || !user) return;
      const canonicalDate = toCanonicalExecutionDateISO(executionDateISO);
      await deleteByDay(activityId, canonicalDate);
    },
    onError: (error) => {
      console.error('Error deleting check-in:', error);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    activities: isGuest || !user ? [] : dataQuery.data?.activities || [],
    checkIns: isGuest || !user ? [] : dataQuery.data?.checkIns || [],
    isLoading: dataQuery.isLoading,
    createCheckIn: (activityId: string, goalId: string, executionDateISO?: string) =>
      createMutation.mutateAsync({ activityId, goalId, executionDateISO, progressValue: 'done' }),
    markCheckInAsNotDone: (activityId: string, goalId: string, executionDateISO: string) =>
      createMutation.mutateAsync({ activityId, goalId, executionDateISO, progressValue: 'not_done' }),
    deleteCheckIn: (activityId: string, executionDateISO: string) =>
      deleteMutation.mutateAsync({ activityId, executionDateISO }),
    refetch: dataQuery.refetch,
  };
};
