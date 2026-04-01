/**
 * useAllActivities Hook
 * 
 * This hook provides a comprehensive way to fetch all user activities and their associated goals,
 * as well as any check-ins for those activities within the last 31 days. It also exposes
 * helper functions for creating and deleting check-ins, updating local state optimistically.
 *
 * Main responsibilities:
 * - Fetch all "active" activities for the current user for the selected year
 * - Include parent goal info for each activity in the returned data
 * - Fetch recent check-ins for those activities to track completion
 * - Expose utility functions to create and delete activity check-ins
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useYear } from '@/contexts/YearContext';
import { Activity } from './useActivities';
import { Goal } from './useGoals';

// Activity shape extended with lightweight goal info for quick lookups
export interface ActivityWithGoal extends Activity {
  goal: Pick<Goal, 'id' | 'title' | 'priority' | 'start_date'>;
}

// Minimal check-in record to track which activities are completed when
export interface CheckInRecord {
  id: string;
  activity_id: string;
  date: string;
  progress_value: string;
  created_at?: string;
}

const COMPLETED_PROGRESS_VALUES = ['done', 'no_evolution', 'some_evolution', 'good_evolution'];
const TRACKED_TASK_PROGRESS_VALUES = [...COMPLETED_PROGRESS_VALUES, 'not_done'];

const toCanonicalExecutionDateISO = (executionDateISO?: string) => {
  if (!executionDateISO) return new Date().toISOString();
  const parsed = new Date(executionDateISO);
  return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0)).toISOString();
};

export const useAllActivities = () => {
  // Local state for activities, check-ins, and loading
  const [activities, setActivities] = useState<ActivityWithGoal[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isGuest } = useAuth();
  const { selectedYear } = useYear();

  /**
   * Fetches all activities (with goal info) and relevant check-ins for the current user and year.
   */
  const fetchData = useCallback(async () => {
    // If not logged in or is a guest, clear state and skip fetching
    if (isGuest || !user) {
      setActivities([]);
      setCheckIns([]);
      setIsLoading(false);
      return;
    }

    // --- Calculate date range for the selected year (inclusive) ---
    const yearStart = new Date(selectedYear, 0, 1).toISOString();
    const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString();

    try {
      // --- Fetch all user activities joined with their active parent goals in the selected year ---
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
        // Only activities created by this user
        .eq('user_id', user.id)
        // Only active activities
        .eq('status', 'active')
        // Only activities whose parent goal is also active and created in the specified year
        .eq('goals.status', 'active')
        .gte('goals.created_at', yearStart)
        .lte('goals.created_at', yearEnd);

      if (activitiesError) throw activitiesError;

      // --- Normalize/transform DB data to ActivityWithGoal[]
      const transformedActivities: ActivityWithGoal[] = (activitiesData || []).map((item: any) => ({
        id: item.id,
        goal_id: item.goal_id,
        user_id: item.user_id,
        title: item.title || item.description, // Fallback if no title
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

      // Set activities state
      setActivities(transformedActivities);

      // --- Fetch all check-ins for these activities in the last 31 days ---
      // This covers tasks that were due in the last month (for calendar/task views)
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      const { data: checkInsData, error: checkInsError } = await supabase
        .from('check_ins')
        .select('id, activity_id, date, progress_value, created_at')
        // Only this user's check-ins
        .eq('user_id', user.id)
        // Only those from the last 31 days
        .gte('date', thirtyOneDaysAgo.toISOString())
        // Only check-ins related to activities (not direct goal check-ins)
        .not('activity_id', 'is', null);

      if (checkInsError) throw checkInsError;

      // Set check-ins state (cast for type-safety)
      setCheckIns((checkInsData || []) as CheckInRecord[]);
    } catch (error) {
      // Log error, but don't crash UI
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isGuest, selectedYear]);

  /**
   * Creates a check-in for a specific activity, associated goal, and an optional execution date.
   * Used to mark a task as done.
   */
  const createCheckIn = async (activityId: string, goalId: string, executionDateISO?: string) => {
    // Only logged-in (non-guest) users can create check-ins
    if (isGuest || !user) return;

    try {
      const canonicalDate = toCanonicalExecutionDateISO(executionDateISO);

      await deleteCheckInsByDay(activityId, canonicalDate);

      // Insert new check-in into Supabase
      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          activity_id: activityId,
          goal_id: goalId,
          user_id: user.id,
          // Store the intended execution date (default to now if not specified)
          date: canonicalDate,
          progress_value: 'done',
          input_type: 'checkbox',
        })
        // Return only essential fields back
        .select('id, activity_id, date, progress_value, created_at')
        .single();

      if (error) throw error;

      // Optimistically update local checkIns state
      setCheckIns((prev) => [data as CheckInRecord, ...prev]);
      return data;
    } catch (error) {
      // Log error so the UI can show a toast or similar
      console.error('Error creating check-in:', error);
      throw error;
    }
  };

  const markCheckInAsNotDone = async (activityId: string, goalId: string, executionDateISO: string) => {
    if (isGuest || !user) return;

    try {
      const canonicalDate = toCanonicalExecutionDateISO(executionDateISO);

      await deleteCheckInsByDay(activityId, canonicalDate);

      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          activity_id: activityId,
          goal_id: goalId,
          user_id: user.id,
          date: canonicalDate,
          progress_value: 'not_done',
          input_type: 'checkbox',
        })
        .select('id, activity_id, date, progress_value, created_at')
        .single();

      if (error) throw error;

      setCheckIns((prev) => [data as CheckInRecord, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating not_done check-in:', error);
      throw error;
    }
  };

  const deleteCheckInsByDay = async (activityId: string, executionDateISO: string) => {
    if (isGuest || !user) return;

    const executionDate = new Date(executionDateISO);
    const dayStart = new Date(executionDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(executionDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { error } = await supabase
      .from('check_ins')
      .delete()
      .eq('activity_id', activityId)
      .eq('user_id', user.id)
      .in('progress_value', TRACKED_TASK_PROGRESS_VALUES)
      .gte('date', dayStart.toISOString())
      .lte('date', dayEnd.toISOString());

    if (error) throw error;

    setCheckIns((prev) =>
      prev.filter((ci) => {
        if (ci.activity_id !== activityId) return true;
        const ciDate = new Date(ci.date);
        const isTrackedValue = TRACKED_TASK_PROGRESS_VALUES.includes(ci.progress_value);
        return ciDate < dayStart || ciDate > dayEnd || !isTrackedValue;
      })
    );
  };

  /**
   * Deletes any check-in(s) for the specified activity and date, within the same day window
   * (Used to mark a task as NOT done). Removes any check-in with a "completion" value for that day.
   */
  const deleteCheckIn = async (activityId: string, executionDateISO: string) => {
    // Only logged-in (non-guest) users can delete check-ins
    if (isGuest || !user) return;

    try {
      // Calculate the start and end of that day in local time
      const canonicalDate = toCanonicalExecutionDateISO(executionDateISO);
      await deleteCheckInsByDay(activityId, canonicalDate);
    } catch (error) {
      // Print error for user feedback
      console.error('Error deleting check-in:', error);
      throw error;
    }
  };

  // Fetch data initially and whenever dependencies change (user, year, etc.)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Return all useful hook outputs
  return {
    activities,       // All normalized activities for the user and year
    checkIns,         // All recent check-ins mapped by activity
    isLoading,        // Data loading state
    createCheckIn,    // Helper to mark task as done (creates check-in)
    markCheckInAsNotDone,
    deleteCheckIn,    // Helper to undo task (deletes check-in)
    refetch: fetchData, // Refetch all data from server
  };
};
