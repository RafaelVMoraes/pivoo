/**
 * useActivities.ts 
 *
 * Custom React hook for managing "activities" objects (usually tasks or habits)
 * associated with a specific goal. Provides CRUD operations and state handling
 * for activity items stored in Supabase for the authenticated user.
 *
 * Exposes:
 * - activities: All activities for the selected goal (most recent first)
 * - isLoading: Loading state indicator for activity API calls
 * - createActivity: Function to add a new activity for the goal
 * - updateActivity: Function to edit fields of an existing activity
 * - deleteActivity: Function to delete an activity by id
 * - refetch: Manually triggers data reload (same as fetchActivities)
 *
 * All effectful functions handle consistent mapping, optimistic updates,
 * and toasts for success/error UI feedback.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Activity interface for CRUD and state usage.
 * Each Activity represents a task/habit belonging to a goal.
 */
export interface Activity {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  description: string;
  frequency?: string;
  frequency_type?: 'daily' | 'weekly' | 'monthly' | 'custom';
  frequency_value?: number;
  time_of_day?: 'morning' | 'afternoon' | 'night' | 'whole_day';
  days_of_week?: string[];
  day_of_month?: number;
  status: 'active' | 'completed';
  activity_type: 'habit' | 'target';
  end_date?: string;
  target_value?: string;
  created_at: string;
  updated_at: string;
}

/**
 * useActivities hook
 *
 * @param goalId - Optional goal ID. If set, the hook loads/manages activities for that goal.
 */
export const useActivities = (goalId?: string) => {
  // --------------------- State Setup ---------------------
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // User and guest flags from auth context
  const { user, isGuest } = useAuth();

  // Toast system for error/success feedback
  const { toast } = useToast();

  /**
   * Fetches activities for the given goal and user.
   * Called on hook mount or when dependencies (goal/user/guest) change.
   * Maps and normalizes the returned activities before storing them in state.
   */
  const fetchActivities = async () => {
    // If not logged in, a guest, or no goal selected, return empty
    if (isGuest || !user || !goalId) {
      setActivities([]);
      setIsLoading(false);
      return;
    }

    try {
      // Query all activities for this goal & user, newest first
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('goal_id', goalId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Always ensure title, activity_type & time_of_day are set for each activity
      const mappedData = (data || []).map(activity => ({
        ...activity,
        title: activity.title || activity.description,
        activity_type: activity.activity_type || 'habit',
        time_of_day: activity.time_of_day || 'whole_day',
      })) as Activity[];

      setActivities(mappedData);
    } catch (error) {
      // Show error toast and log failure
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load activities",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Creates a new activity for the current goal (and user).
   * - Adds default fields if not specified.
   * - Optimistically adds new activity to the state list on success.
   */
  const createActivity = async (
    activityData: Omit<Activity, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    // Only logged-in (non-guest) users may create
    if (isGuest || !user) return;

    try {
      // Fill required fields by fallback/defaults
      const insertData = {
        ...activityData,
        title: activityData.title || activityData.description,
        activity_type: activityData.activity_type || 'habit',
        time_of_day: activityData.time_of_day || 'whole_day',
        user_id: user.id,
      };

      // Insert into Supabase and return full new object
      const { data, error } = await supabase
        .from('activities')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Normalize activity shape (matches fetch mapper)
      const mappedActivity = {
        ...data,
        title: data.title || data.description,
        activity_type: data.activity_type || 'habit'
      } as Activity;

      // Add new activity to top of activities array
      setActivities(prev => [mappedActivity, ...prev]);

      toast({
        title: "Success",
        description: "Activity created successfully",
      });
      return data;
    } catch (error) {
      // Log and show toast error, propagate for UI
      console.error('Error creating activity:', error);
      toast({
        title: "Error",
        description: "Failed to create activity",
        variant: "destructive"
      });
      throw error;
    }
  };

  /**
   * Updates an existing activity by activityId.
   * - Only affects user's own activities.
   * - Updates local state entry on success.
   */
  const updateActivity = async (
    activityId: string,
    updates: Partial<Activity>
  ) => {
    // Protect against guests/non-logged in
    if (isGuest || !user) return;

    try {
      // Patch activity using Supabase for this user
      const { data, error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', activityId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Map and update local cache for UI
      const mappedActivity = {
        ...data,
        title: data.title || data.description,
        activity_type: data.activity_type || 'habit'
      } as Activity;

      setActivities(prev =>
        prev.map(activity =>
          activity.id === activityId ? mappedActivity : activity
        )
      );

      toast({
        title: "Success",
        description: "Activity updated successfully"
      });
      return data;
    } catch (error) {
      // Show error to UI & caller
      console.error('Error updating activity:', error);
      toast({
        title: "Error",
        description: "Failed to update activity",
        variant: "destructive"
      });
      throw error;
    }
  };

  /**
   * Deletes an activity by id for the current user.
   * - Removes from backend and local state.
   */
  const deleteActivity = async (activityId: string) => {
    if (isGuest || !user) return;

    try {
      // Remove from DB
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Filter out the deleted activity in front-end list
      setActivities(prev => prev.filter(activity => activity.id !== activityId));

      toast({
        title: "Success",
        description: "Activity deleted successfully"
      });
    } catch (error) {
      // Notify failure to UI
      console.error('Error deleting activity:', error);
      toast({
        title: "Error",
        description: "Failed to delete activity",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Refetch activities when user, guest flag, or goalId change
  useEffect(() => {
    fetchActivities();
  }, [user, isGuest, goalId]);

  // ------------------ Hook Return Value ------------------
  return {
    activities,      // Array of normalized activities for goal
    isLoading,       // true while any fetch is pending
    createActivity,  // Function to add activity
    updateActivity,  // Function to patch activity fields
    deleteActivity,  // Function to remove by id
    refetch: fetchActivities, // Manual reload
  };
};
