/**************************************************************************************************
* Migration: Goals Table with Row-Level Security (RLS), Policies, and Triggers
*
* Description:
*   - This migration creates the "goals" table in the public schema, designed for users
*     to track personal goals, their statuses, associations with life wheel areas, and related values.
*   - It enforces row-level security, so users can only access and manipulate their own goal records.
*   - Policies for SELECT, INSERT, UPDATE, and DELETE explicitly restrict access based on user_id.
*   - An automated trigger ensures 'updated_at' is refreshed on every update to a row.
**************************************************************************************************/

------------------------------------------------------
-- 1. Create the goals table to store user goals.
------------------------------------------------------
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,           -- Unique goal row ID
  user_id UUID NOT NULL,                                            -- Foreign key to auth.users (the user owner)
  title TEXT NOT NULL,                                              -- Title or name of the goal
  description TEXT,                                                 -- Optional: details/notes about the goal
  category TEXT,                                                    -- Optional: category label for organization
  target_date DATE,                                                 -- Optional: target completion date
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')), -- Goal progress state
  life_wheel_area TEXT,                                             -- Optional: links goal to a life wheel area
  related_values TEXT[],                                            -- Optional: array of value names related to goal
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),       -- Row creation timestamp
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()        -- Auto-managed on updates by trigger
);

------------------------------------------------------
-- 2. Enable Row Level Security (RLS) on the goals table
------------------------------------------------------
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

------------------------------------------------------
-- 3. Define access policies (restrict to goal owner via user_id)
------------------------------------------------------

-- Allow users to SELECT (view) only their own goal records
CREATE POLICY "Users can view their own goals" 
  ON public.goals 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to INSERT (create) goals only for themselves
CREATE POLICY "Users can create their own goals" 
  ON public.goals 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to UPDATE only their own goal records
CREATE POLICY "Users can update their own goals" 
  ON public.goals 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to DELETE only their own goal records
CREATE POLICY "Users can delete their own goals" 
  ON public.goals 
  FOR DELETE 
  USING (auth.uid() = user_id);

------------------------------------------------------
-- 4. Create trigger to auto-update the 'updated_at' timestamp on row update
--    (Assumes public.update_updated_at_column() trigger function exists)
------------------------------------------------------
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();