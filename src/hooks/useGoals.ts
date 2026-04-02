import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useYear } from '@/contexts/YearContext';
import { queryKeys } from '@/lib/queryKeys';

export interface SuccessChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  target_date?: string;
  type: 'habit' | 'target';
  status: 'active' | 'in_progress' | 'on_hold' | 'completed' | 'archived';
  priority: 'gold' | 'silver' | 'bronze';
  life_wheel_area?: string | string[];
  related_values?: string[];
  parent_goal_id?: string;
  surface_motivation?: string;
  deeper_motivation?: string;
  identity_motivation?: string;
  success_checklist?: SuccessChecklistItem[];
  target_value?: string;
  created_at: string;
  updated_at: string;
}

const priorityOrder = { gold: 0, silver: 1, bronze: 2 };

export const useGoals = () => {
  const { user, isGuest } = useAuth();
  const { toast } = useToast();
  const { selectedYear } = useYear();
  const queryClient = useQueryClient();

  const goalsQuery = useQuery({
    queryKey: queryKeys.goals.byYear(user?.id, selectedYear),
    enabled: !!user && !isGuest,
    queryFn: async (): Promise<Goal[]> => {
      const yearStart = new Date(selectedYear, 0, 1).toISOString();
      const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user!.id)
        .gte('created_at', yearStart)
        .lte('created_at', yearEnd);

      if (error) throw error;

      return (data || [])
        .sort((a, b) => {
          const pDiff =
            priorityOrder[a.priority as 'gold' | 'silver' | 'bronze'] -
            priorityOrder[b.priority as 'gold' | 'silver' | 'bronze'];
          if (pDiff !== 0) return pDiff;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
        .map((goal) => ({
          ...goal,
          type: goal.type === 'habit' || goal.type === 'target' ? goal.type : 'target',
          success_checklist: Array.isArray(goal.success_checklist)
            ? (goal.success_checklist as unknown as SuccessChecklistItem[])
            : [],
        })) as Goal[];
    },
    staleTime: 30_000,
  });

  const goals = isGuest || !user ? [] : goalsQuery.data || [];

  const handleError = (title: string, description: string, error: unknown) => {
    console.error(title, error);
    toast({ title, description, variant: 'destructive' });
  };

  const validatePriorityLimit = (
    priority: 'gold' | 'silver' | 'bronze',
    excludeGoalId?: string
  ): boolean => {
    const activeGoals = goals.filter(
      (g) => g.status !== 'archived' && g.status !== 'completed' && g.id !== excludeGoalId
    );

    if (priority === 'gold') return activeGoals.filter((g) => g.priority === 'gold').length < 3;
    if (priority === 'silver') return activeGoals.filter((g) => g.priority === 'silver').length < 5;
    return true;
  };

  const createMutation = useMutation({
    mutationFn: async (goalData: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (isGuest || !user) return null;

      if (!validatePriorityLimit(goalData.priority)) {
        throw new Error(
          goalData.priority === 'gold'
            ? 'Maximum 3 Gold priority goals allowed'
            : 'Maximum 5 Silver priority goals allowed'
        );
      }

      const lifeWheelAreaNormalized = goalData.life_wheel_area
        ? Array.isArray(goalData.life_wheel_area)
          ? goalData.life_wheel_area
          : [goalData.life_wheel_area]
        : null;

      const successChecklistData = (goalData.success_checklist || []).map((item) => ({
        id: item.id,
        text: item.text,
        completed: item.completed,
      }));

      const { data, error } = await supabase
        .from('goals')
        .insert([
          {
            title: goalData.title,
            description: goalData.description || null,
            category: goalData.category || null,
            type: goalData.type,
            status: goalData.status,
            priority: goalData.priority,
            start_date: goalData.start_date || null,
            end_date: goalData.end_date || null,
            target_date: goalData.target_date || goalData.end_date || null,
            life_wheel_area: lifeWheelAreaNormalized,
            related_values: goalData.related_values || null,
            parent_goal_id: goalData.parent_goal_id || null,
            surface_motivation: goalData.surface_motivation || null,
            deeper_motivation: goalData.deeper_motivation || null,
            identity_motivation: goalData.identity_motivation || null,
            success_checklist: successChecklistData,
            target_value: goalData.target_value || null,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.goals.byYear(user?.id, selectedYear) });
      toast({ title: 'Success', description: 'Goal created successfully' });
    },
    onError: (error) => {
      const isPriority = error instanceof Error && error.message.includes('Maximum');
      if (isPriority) {
        toast({ title: 'Priority Limit Reached', description: error.message, variant: 'destructive' });
        return;
      }
      handleError('Error', 'Failed to create goal', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ goalId, updates }: { goalId: string; updates: Partial<Goal> }) => {
      if (isGuest || !user) return null;

      if (updates.priority && !validatePriorityLimit(updates.priority, goalId)) {
        throw new Error(
          updates.priority === 'gold'
            ? 'Maximum 3 Gold priority goals allowed'
            : 'Maximum 5 Silver priority goals allowed'
        );
      }

      const cleanUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) cleanUpdates.title = updates.title;
      if (updates.description !== undefined) cleanUpdates.description = updates.description;
      if (updates.category !== undefined) cleanUpdates.category = updates.category;
      if (updates.type !== undefined) cleanUpdates.type = updates.type;
      if (updates.status !== undefined) cleanUpdates.status = updates.status;
      if (updates.priority !== undefined) cleanUpdates.priority = updates.priority;
      if (updates.start_date !== undefined) cleanUpdates.start_date = updates.start_date;
      if (updates.end_date !== undefined) cleanUpdates.end_date = updates.end_date;
      if (updates.target_date !== undefined) cleanUpdates.target_date = updates.target_date;
      if (updates.life_wheel_area !== undefined) cleanUpdates.life_wheel_area = updates.life_wheel_area;
      if (updates.related_values !== undefined) cleanUpdates.related_values = updates.related_values;
      if (updates.parent_goal_id !== undefined) cleanUpdates.parent_goal_id = updates.parent_goal_id;
      if (updates.surface_motivation !== undefined) cleanUpdates.surface_motivation = updates.surface_motivation;
      if (updates.deeper_motivation !== undefined) cleanUpdates.deeper_motivation = updates.deeper_motivation;
      if (updates.identity_motivation !== undefined) cleanUpdates.identity_motivation = updates.identity_motivation;
      if (updates.success_checklist !== undefined) cleanUpdates.success_checklist = updates.success_checklist;
      if (updates.target_value !== undefined) cleanUpdates.target_value = updates.target_value;

      const { data, error } = await supabase
        .from('goals')
        .update(cleanUpdates)
        .eq('id', goalId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.goals.byYear(user?.id, selectedYear) });
      toast({ title: 'Success', description: 'Goal updated successfully' });
    },
    onError: (error) => {
      const isPriority = error instanceof Error && error.message.includes('Maximum');
      if (isPriority) {
        toast({ title: 'Priority Limit Reached', description: error.message, variant: 'destructive' });
        return;
      }
      handleError('Error', 'Failed to update goal', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (goalId: string) => {
      if (isGuest || !user) return;
      const { error } = await supabase.from('goals').delete().eq('id', goalId).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.goals.byYear(user?.id, selectedYear) });
      toast({ title: 'Success', description: 'Goal deleted successfully' });
    },
    onError: (error) => handleError('Error', 'Failed to delete goal', error),
  });

  const canCompleteGoal = (goal: Goal): boolean => {
    if (!goal.success_checklist || goal.success_checklist.length === 0) return true;
    return goal.success_checklist.every((item) => item.completed);
  };

  const getSuccessChecklistProgress = (goal: Goal): { completed: number; total: number } => {
    if (!goal.success_checklist || goal.success_checklist.length === 0) return { completed: 0, total: 0 };
    const completed = goal.success_checklist.filter((item) => item.completed).length;
    return { completed, total: goal.success_checklist.length };
  };

  const filterGoals = (filters: string[]) => {
    if (filters.length === 0) return goals;

    return goals.filter((goal) => {
      const matchesArea = filters.some((filter) =>
        Array.isArray(goal.life_wheel_area) ? goal.life_wheel_area.includes(filter) : goal.life_wheel_area === filter
      );
      const matchesValue = filters.some((filter) => goal.related_values?.includes(filter));
      return matchesArea || matchesValue;
    });
  };

  const getSubGoals = (parentGoalId: string) => goals.filter((goal) => goal.parent_goal_id === parentGoalId);

  return {
    goals,
    isLoading: goalsQuery.isLoading,
    createGoal: createMutation.mutateAsync,
    updateGoal: (goalId: string, updates: Partial<Goal>) => updateMutation.mutateAsync({ goalId, updates }),
    deleteGoal: deleteMutation.mutateAsync,
    refetch: goalsQuery.refetch,
    filterGoals,
    getSubGoals,
    validatePriorityLimit,
    canCompleteGoal,
    getSuccessChecklistProgress,
  };
};
