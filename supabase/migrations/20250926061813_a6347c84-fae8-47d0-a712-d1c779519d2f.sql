/**************************************************************************************************
* Migration: Add History Table and Profile Notification Preference
*
* Description:
*   - Introduces the "history" table in the public schema to store annual summaries, accomplishments,
*     and goal statistics for each user by year.
*   - Implements row-level security (RLS) policies so users can only access and manipulate their own history.
*   - Sets up a trigger on the "history" table to automatically maintain the "updated_at" timestamp.
*   - Extends the existing "profiles" table by adding a "notifications_enabled" column to allow
*     users to opt in or out of email/push notifications.
**************************************************************************************************/

------------------------------------------------------------
-- 1. Create the history table for storing annual summaries
------------------------------------------------------------
CREATE TABLE public.history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,        -- Unique history row ID
  user_id UUID NOT NULL,                                         -- FK to auth.users (the user)
  year INTEGER NOT NULL,                                         -- Calendar year for this summary
  summary TEXT,                                                  -- Optional: narrative/text summary of the year
  achievements TEXT[],                                           -- Optional: list of accomplishment descriptions
  completed_goals_count INTEGER DEFAULT 0,                       -- Number of completed goals in this year
  total_goals_count INTEGER DEFAULT 0,                           -- Total number of goals (all statuses)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),    -- Row creation timestamp
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),    -- Updated automatically on updates
  UNIQUE(user_id, year)                                          -- One history row per user per year
);

------------------------------------------------------------
-- 2. Enable Row Level Security (RLS) on the history table
------------------------------------------------------------
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

------------------------------------------------------------
-- 3. RLS Policies: Restrict CRUD to the owning user only
------------------------------------------------------------

-- Users can view only their own history
CREATE POLICY "Users can view their own history" 
  ON public.history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert only their own history rows
CREATE POLICY "Users can create their own history" 
  ON public.history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own history rows
CREATE POLICY "Users can update their own history" 
  ON public.history 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete only their own history rows
CREATE POLICY "Users can delete their own history" 
  ON public.history 
  FOR DELETE 
  USING (auth.uid() = user_id);

------------------------------------------------------------
-- 4. Trigger: Auto-update the updated_at timestamp on update
------------------------------------------------------------
CREATE TRIGGER update_history_updated_at
  BEFORE UPDATE ON public.history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

------------------------------------------------------------
-- 5. Add notifications preference column to profiles table
------------------------------------------------------------
-- Allows user to enable/disable email or push notifications.
ALTER TABLE public.profiles 
  ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;
