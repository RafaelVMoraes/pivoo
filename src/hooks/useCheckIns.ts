/**
 * useCheckIns.ts
 *
 * React hook for managing "check-in" records for goals and activities.
 *
 * Provides:
 *  - Fetching all relevant check-ins for a given goal and/or activity (with automatic refresh on dependency changes)
 *  - Creating a new check-in entry
 *  - Updating an existing check-in
 *  - Deleting a check-in
 *  - Toast notifications and UI error handling
 * 
 * Usage:
 *   const { checkIns, isLoading, createCheckIn, updateCheckIn, deleteCheckIn, refetch } = useCheckIns(goalId, activityId);
 *
 * Each returned check-in includes info on user, date, value, type, etc.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { deriveScoreValue, resolveExecutionStatus, type ExecutionStatus } from '@/lib/checkInStatus';

/**
 * Shape of a single check-in record.
 */
export interface CheckIn {
  id: string;
  activity_id?: string;
  goal_id: string;
  user_id: string;
  date: string;
  progress_value: string;
  input_type: 'numeric' | 'checkbox' | 'percentage';
  execution_status?: ExecutionStatus | null;
  score_value?: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * useCheckIns
 * 
 * Custom hook for fetching and manipulating check-in data for a specific goal (and optionally activity).
 * Keeps check-in state up to date, and shows toast notifications for mutations.
 *
 * @param {string | undefined} goalId - The goal to track check-ins for
 * @param {string | undefined} activityId - (Optional) restrict to check-ins for a specific activity
 * @returns Object with checkIns, loading state, and CRUD utility functions
 */
export const useCheckIns = (goalId?: string, activityId?: string) => {
  // ----- Local state -----
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);        // All check-ins for current query
  const [isLoading, setIsLoading] = useState(true);               // Loading state for queries/mutations

  const { user, isGuest } = useAuth();                            // Auth state/context
  const { toast } = useToast();                                   // Toast utility for feedback

  /**
   * fetchCheckIns
   *
   * Loads check-ins for the authenticated user's given goal (and optionally activity).
   * Handles guest users or not-logged-in gracefully.
   */
  const fetchCheckIns = async () => {
    if (isGuest || !user || !goalId) {
      setCheckIns([]);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .eq('goal_id', goalId);

      if (activityId) {
        query = query.eq('activity_id', activityId); // Only restrict by activity if provided
      }

      // Sort check-ins in descending order by date (most recent first)
      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      setCheckIns((data || []) as CheckIn[]);
    } catch (error) {
      // Error handling for failed fetch
      console.error('Error fetching check-ins:', error);
      toast({
        title: "Error",
        description: "Failed to load check-ins",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * createCheckIn
   *
   * Inserts a new check-in record for this user and goal (and optionally activity).
   * Updates the UI state on success and shows toast notification.
   * @param checkInData - All data except auto-generated/id/user/timestamp fields
   */
  const createCheckIn = async (checkInData: Omit<CheckIn, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (isGuest || !user) return;

    try {
      const derivedExecutionStatus = resolveExecutionStatus(checkInData);
      const derivedScoreValue = deriveScoreValue(checkInData);

      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          ...checkInData,
          user_id: user.id,
          execution_status: checkInData.execution_status ?? derivedExecutionStatus,
          score_value: checkInData.score_value ?? derivedScoreValue,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Prepend new record to checkIns
      setCheckIns(prev => [data as CheckIn, ...prev]);
      toast({
        title: "Success",
        description: "Progress recorded successfully"
      });
      return data;
    } catch (error) {
      // Error handling for failed creation
      console.error('Error creating check-in:', error);
      toast({
        title: "Error",
        description: "Failed to record progress",
        variant: "destructive"
      });
      throw error;
    }
  };

  /**
   * updateCheckIn
   *
   * Updates fields on an existing check-in (for this user only).
   * Updates the local state on success and shows toast notification.
   * @param checkInId - ID of the check-in to update
   * @param updates - Partial fields to update
   */
  const updateCheckIn = async (checkInId: string, updates: Partial<CheckIn>) => {
    if (isGuest || !user) return;

    try {
      const nextUpdates: Partial<CheckIn> = { ...updates };
      const hasProgressUpdate = 'progress_value' in nextUpdates || 'input_type' in nextUpdates;
      if (hasProgressUpdate && !('execution_status' in nextUpdates)) {
        nextUpdates.execution_status = resolveExecutionStatus(nextUpdates);
      }
      if (hasProgressUpdate && !('score_value' in nextUpdates)) {
        nextUpdates.score_value = deriveScoreValue(nextUpdates);
      }

      const { data, error } = await supabase
        .from('check_ins')
        .update(nextUpdates)
        .eq('id', checkInId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      // Replace the updated record in checkIns state
      setCheckIns(prev => prev.map(checkIn => checkIn.id === checkInId ? data as CheckIn : checkIn));
      toast({
        title: "Success",
        description: "Progress updated successfully"
      });
      return data;
    } catch (error) {
      // Error handling for failed update
      console.error('Error updating check-in:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
      throw error;
    }
  };

  /**
   * deleteCheckIn
   *
   * Deletes a check-in (by ID, only for this user).
   * Removes it from the local state and shows toast notification.
   * @param checkInId - ID of check-in to delete
   */
  const deleteCheckIn = async (checkInId: string) => {
    if (isGuest || !user) return;

    try {
      const { error } = await supabase
        .from('check_ins')
        .delete()
        .eq('id', checkInId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Remove the deleted check-in from local state
      setCheckIns(prev => prev.filter(checkIn => checkIn.id !== checkInId));
      toast({
        title: "Success",
        description: "Progress entry deleted successfully"
      });
    } catch (error) {
      // Error handling for failed deletion
      console.error('Error deleting check-in:', error);
      toast({
        title: "Error",
        description: "Failed to delete progress entry",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Effect: automatically (re)fetch check-ins whenever dependencies change (user, goal, activity)
  useEffect(() => {
    fetchCheckIns();
  }, [user, isGuest, goalId, activityId]);

  // Expose state and CRUD helpers to consumers
  return {
    checkIns,
    isLoading,
    createCheckIn,
    updateCheckIn,
    deleteCheckIn,
    refetch: fetchCheckIns
  };
};