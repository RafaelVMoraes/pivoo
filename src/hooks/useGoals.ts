/**
 * useGoals.ts
 * 
 * React hook for managing user's "goals" state and CRUD operations.
 * 
 * Provides:
 *  - Fetching, creating, updating, and deleting goals for the current authenticated user and selected year.
 *  - Enforces per-user priority limits ("gold" max 3, "silver" max 5, "bronze" unlimited).
 *  - Sorting goals for UX: by priority, then creation date.
 *  - Utility helpers for goal completion, filtering, and progress.
 * 
 * Typical usage:
 *   const { goals, isLoading, createGoal, updateGoal, deleteGoal, ... } = useGoals();
 * 
 * Each goal features a metadata-rich structure including associations, sub-goals,
 * prioritization, and a "success checklist" for finer completion logic.
 */

// ===== Imports =====
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useYear } from '@/contexts/YearContext';

// ===== Types & Interfaces =====

/**
 * Represents a single checklist item for a goal's "success" requirements.
 */
export interface SuccessChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

/**
 * Represents a Goal with all metadata and settings.
 */
export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  target_date?: string; // Legacy field, maps to end_date
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

// ===== Hook Implementation =====

export const useGoals = () => {
  // ----------------- Local State & Contexts -----------------
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isGuest } = useAuth();
  const { toast } = useToast();
  const { selectedYear } = useYear();

  /**
   * Fetch all goals for the current user in the selected year.
   * Orders by priority (gold > silver > bronze), then newest first.
   * Also parses and normalizes checklist and legacy fields.
   */
  const fetchGoals = async () => {
    if (isGuest || !user) {
      setGoals([]);
      setIsLoading(false);
      return;
    }

    try {
      // Compute date range for selected year
      const yearStart = new Date(selectedYear, 0, 1).toISOString();
      const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString();

      // Query Supabase for user goals in selected year
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', yearStart)
        .lte('created_at', yearEnd);

      if (error) throw error;
      
      // Priority ordering: gold < silver < bronze
      const priorityOrder = { gold: 0, silver: 1, bronze: 2 };

      // Sort: prioritize by gold > silver > bronze, then newest first
      const sortedData = (data || []).sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority as 'gold' | 'silver' | 'bronze'] - priorityOrder[b.priority as 'gold' | 'silver' | 'bronze'];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // Normalize and parse checklist items
      const parsedData = sortedData.map(goal => ({
        ...goal,
        type: (goal.type === 'habit' || goal.type === 'target') ? goal.type : 'target',
        success_checklist: Array.isArray(goal.success_checklist) 
          ? (goal.success_checklist as unknown as SuccessChecklistItem[])
          : []
      })) as Goal[];
      
      setGoals(parsedData);
    } catch (error) {
      // Show toast on fetch error
      console.error('Error fetching goals:', error);
      toast({
        title: "Error",
        description: "Failed to load goals",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Checks if the user can create/update a goal with the given priority.
   * Enforces 3 gold / 5 silver per user (not counting completed/archived or updated goal).
   * @param priority 
   * @param excludeGoalId - Used when editing, to not count the goal being updated
   */
  const validatePriorityLimit = (
    priority: 'gold' | 'silver' | 'bronze',
    excludeGoalId?: string
  ): boolean => {
    // Only count active, in-progress, or on-hold goals
    const activeGoals = goals.filter(g =>
      g.status !== 'archived' &&
      g.status !== 'completed' &&
      g.id !== excludeGoalId
    );

    if (priority === 'gold') {
      const goldCount = activeGoals.filter(g => g.priority === 'gold').length;
      return goldCount < 3;
    } else if (priority === 'silver') {
      const silverCount = activeGoals.filter(g => g.priority === 'silver').length;
      return silverCount < 5;
    }
    // Bronze has no upper limit
    return true;
  };

  /**
   * Creates a new goal for the current user.
   * Validates priority limits and normalizes fields before insert.
   * Throws on failure or priority limit hit.
   */
  const createGoal = async (
    goalData: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (isGuest || !user) return;

    // Enforce priority limits before insert
    if (!validatePriorityLimit(goalData.priority)) {
      const limitMessage = goalData.priority === 'gold'
        ? 'Maximum 3 Gold priority goals allowed'
        : 'Maximum 5 Silver priority goals allowed';
      toast({
        title: "Priority Limit Reached",
        description: limitMessage,
        variant: "destructive"
      });
      throw new Error(limitMessage);
    }

    try {
      // Normalize: ensure life wheel area is always array or null (for JSON)
      const lifeWheelAreaNormalized = goalData.life_wheel_area
        ? (Array.isArray(goalData.life_wheel_area) ? goalData.life_wheel_area : [goalData.life_wheel_area])
        : null;
      // Normalize: prepare checklist items for JSON storage 
      const successChecklistData = (goalData.success_checklist || []).map(item => ({
        id: item.id,
        text: item.text,
        completed: item.completed
      }));

      // Insert into Supabase
      const { data, error } = await supabase
        .from('goals')
        .insert([{
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
        }])
        .select()
        .single();

      if (error) throw error;

      // Refetch to keep UI consistent and sorted
      await fetchGoals();
      toast({
        title: "Success",
        description: "Goal created successfully"
      });
      return data;
    } catch (error) {
      console.error('Error creating goal:', error);
      // Only suppress toast for priority limit errors (already shown)
      if (!(error instanceof Error && error.message.includes('Priority Limit'))) {
        toast({
          title: "Error",
          description: "Failed to create goal",
          variant: "destructive"
        });
      }
      throw error;
    }
  };

  /**
   * Update a goal by its id for the current user.
   * Handles partial updates, enforces priority limits if changed.
   */
  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (isGuest || !user) return;

    // Check new priority (if changing) for limits
    if (updates.priority && !validatePriorityLimit(updates.priority, goalId)) {
      const limitMessage = updates.priority === 'gold'
        ? 'Maximum 3 Gold priority goals allowed'
        : 'Maximum 5 Silver priority goals allowed';
      toast({
        title: "Priority Limit Reached",
        description: limitMessage,
        variant: "destructive"
      });
      throw new Error(limitMessage);
    }

    try {
      // Construct only the fields that are being updated
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

      // Update Supabase record
      const { data, error } = await supabase
        .from('goals')
        .update(cleanUpdates)
        .eq('id', goalId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Refetch for UI consistency
      await fetchGoals();
      toast({
        title: "Success",
        description: "Goal updated successfully"
      });
      return data;
    } catch (error) {
      console.error('Error updating goal:', error);
      if (!(error instanceof Error && error.message.includes('Priority Limit'))) {
        toast({
          title: "Error",
          description: "Failed to update goal",
          variant: "destructive"
        });
      }
      throw error;
    }
  };

  /**
   * Delete a goal for this user.
   * After deletion, removes goal from local state and shows toast.
   */
  const deleteGoal = async (goalId: string) => {
    if (isGuest || !user) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from local list for instant UX update
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      toast({
        title: "Success",
        description: "Goal deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive"
      });
      throw error;
    }
  };

  /**
   * Determines if a goal can be "completed".
   * This requires either no checklist, or all items completed.
   */
  const canCompleteGoal = (goal: Goal): boolean => {
    if (!goal.success_checklist || goal.success_checklist.length === 0) {
      return true; // No checklist = allowed to complete.
    }
    // Check every item completed
    return goal.success_checklist.every(item => item.completed);
  };

  /**
   * Calculates progress for a goal's checklist (like for progress bars).
   * Returns completed count and total items.
   */
  const getSuccessChecklistProgress = (goal: Goal): { completed: number; total: number } => {
    if (!goal.success_checklist || goal.success_checklist.length === 0) {
      return { completed: 0, total: 0 };
    }
    const completed = goal.success_checklist.filter(item => item.completed).length;
    return { completed, total: goal.success_checklist.length };
  };

  /**
   * Fetch goals whenever user, guest state, or year changes.
   */
  useEffect(() => {
    fetchGoals();
  }, [user, isGuest, selectedYear]);

  /**
   * Filters goals for provided life wheel areas or value tags.
   * If no filters, returns all.
   * @param filters 
   */
  const filterGoals = (filters: string[]) => {
    if (filters.length === 0) return goals;

    return goals.filter(goal => {
      // Check if life area matches (support array or single string)
      const matchesArea = filters.some(filter =>
        Array.isArray(goal.life_wheel_area)
          ? goal.life_wheel_area.includes(filter)
          : goal.life_wheel_area === filter
      );
      // Check if goal's values/virtues match
      const matchesValue = filters.some(filter =>
        goal.related_values?.includes(filter)
      );
      return matchesArea || matchesValue;
    });
  };

  /**
   * Return all sub-goals for a given parent goal (by id).
   * @param parentGoalId 
   */
  const getSubGoals = (parentGoalId: string) => {
    return goals.filter(goal => goal.parent_goal_id === parentGoalId);
  };

  // API returned by hook
  return {
    goals,
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals,
    filterGoals,
    getSubGoals,
    validatePriorityLimit,
    canCompleteGoal,
    getSuccessChecklistProgress
  };
};
