/**
 * useProfile.ts
 *
 * React hook to fetch and update the current authenticated user's profile from Supabase.
 *
 * Provides:
 *  - `profile`: Profile object for the current user, kept up-to-date with DB state.
 *  - `loading`: Boolean indicating whether a profile operation is in progress.
 *  - `updateProfile`: Function to update the profile (validated and persisted).
 *  - `refetchProfile`: Manual reload trigger for the user's profile.
 *
 * Fetches data on mount and whenever the user changes.
 * All updates are validated client-side prior to supabase mutation.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { ProfileSchema } from '@/lib/validationSchemas';

/**
 * Shape of the user profile in the app.
 */
interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  language: string;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * useProfile
 *
 * Hook to manage the authenticated user's profile state and CRUD operations.
 */
export const useProfile = () => {
  const { user } = useAuth();        // Current authenticated user
  const { toast } = useToast();      // Toast helper for notifications

  // Profile state: stores profile data for current user
  const [profile, setProfile] = useState<Profile | null>(null);
  // Loading indicator: set true when fetching or updating
  const [loading, setLoading] = useState(false);

  /**
   * Fetch and load the current user's profile from Supabase.
   * Triggers loading state and shows error toast on failure.
   */
  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        toast({
          title: 'Error loading profile',
          description: getUserFriendlyError(error),
          variant: 'destructive',
        });
        return;
      }

      setProfile(data);
    } catch (error) {
      // Unexpected error (network, etc.)
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update the profile for the current user.
   * Validates input prior to attempting update.
   * Shows toast notification for both success and failure.
   *
   * @param updates Partial<Profile> - fields to update
   */
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return;

    // Input validation with Zod schema
    const validation = ProfileSchema.safeParse(updates);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: 'Validation error',
        description: firstError?.message || 'Invalid data provided',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(validation.data)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        toast({
          title: 'Error updating profile',
          description: getUserFriendlyError(error),
          variant: 'destructive',
        });
        return;
      }

      // Update local state on successful DB write
      setProfile(data);

      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error) {
      // Log unexpected errors
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Auto-fetch the profile when the authenticated user changes.
   */
  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    updateProfile,
    refetchProfile: fetchProfile,
  };
};