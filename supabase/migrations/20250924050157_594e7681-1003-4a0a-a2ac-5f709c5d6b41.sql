/**************************************************************************************************
* Migration: Extend Goals Model & Add Activities & Check-Ins Tables with Row-Level Security (RLS)
*
* Description:
*   - Enhances the "goals" table by adding a type field and expanding the allowed status values.
*   - Introduces the "activities" and "check_ins" tables to enable detailed tracking of user goal progress.
*   - Enforces strict row-level security so users can access or manipulate only their own records in these new tables.
*   - Applies standardized triggers to auto-update the 'updated_at' timestamp on updates.
*   - Adds a unique constraint to prevent duplicate goal titles per user.
**************************************************************************************************/

--------------------------------------------------------------
-- 1. Extend Goals Table: Add Type Column & Update Status Enum
--------------------------------------------------------------

-- Add a "type" column to goals to distinguish between outcome and process goals.
ALTER TABLE public.goals 
ADD COLUMN type TEXT CHECK (type IN ('outcome', 'process')) DEFAULT 'outcome';

-- Update the status constraint:
-- Remove any existing status constraint prior to redefining the allowed enum values.
ALTER TABLE public.goals 
DROP CONSTRAINT IF EXISTS goals_status_check;

-- Add new status constraint to cover additional states.
ALTER TABLE public.goals 
ADD CONSTRAINT goals_status_check 
CHECK (status IN ('active', 'in_progress', 'on_hold', 'completed', 'archived'));

----------------------------------------------------------------------
-- 2. Activities Table: Track Actions/Subgoals Linked to Main Goals
----------------------------------------------------------------------

CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,       -- Unique activity row ID
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE, -- FK to parent goal, cascade on goal deletion
  user_id UUID NOT NULL,                                        -- Owner of the activity (matches session user)
  description TEXT NOT NULL,                                    -- Activity/action details
  frequency TEXT,                                               -- Optional: how often (e.g., 'daily', 'weekly')
  status TEXT CHECK (status IN ('active', 'completed')) DEFAULT 'active',  -- Completion status
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),   -- Creation timestamp
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()    -- Auto-updated on modification
);

-- Enable Row Level Security (RLS) on activities for user isolation.
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Activities RLS Policies:

-- Users may view only their own activities.
CREATE POLICY "Users can view their own activities" 
  ON public.activities 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users may insert activities only for themselves.
CREATE POLICY "Users can create their own activities" 
  ON public.activities 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users may update only their own activities.
CREATE POLICY "Users can update their own activities" 
  ON public.activities 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users may delete only their own activities.
CREATE POLICY "Users can delete their own activities" 
  ON public.activities 
  FOR DELETE 
  USING (auth.uid() = user_id);

----------------------------------------------------------------------
-- 3. Check-Ins Table: Log User Progress on Activities (or Goals)
----------------------------------------------------------------------

CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,                      -- Unique check-in row ID
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,         -- (Optional) Link to activity, cascade on delete
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,         -- Link to parent goal, required
  user_id UUID NOT NULL,                                                      -- Owner of the check-in (matches session user)
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),                       -- When the check-in occurred
  progress_value TEXT NOT NULL,                                               -- Value entered by user (can be a number, boolean, etc.)
  input_type TEXT CHECK (input_type IN ('numeric', 'checkbox', 'percentage')) -- How user inputs progress
    DEFAULT 'checkbox',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),                 -- Creation timestamp
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()                  -- Auto-updated on modification
);

-- Enable Row Level Security (RLS) on check_ins.
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Check-Ins RLS Policies:

-- Users may view only their own check-ins.
CREATE POLICY "Users can view their own check-ins" 
  ON public.check_ins 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users may insert check-ins only for themselves.
CREATE POLICY "Users can create their own check-ins" 
  ON public.check_ins 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users may update only their own check-ins.
CREATE POLICY "Users can update their own check-ins" 
  ON public.check_ins 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users may delete only their own check-ins.
CREATE POLICY "Users can delete their own check-ins" 
  ON public.check_ins 
  FOR DELETE 
  USING (auth.uid() = user_id);

----------------------------------------------------------------------
-- 4. Triggers: Keep updated_at In-Sync on Row Changes
----------------------------------------------------------------------

-- Whenever an activity is updated, refresh its 'updated_at' value.
CREATE TRIGGER update_activities_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Whenever a check-in is updated, refresh its 'updated_at' value.
CREATE TRIGGER update_check_ins_updated_at
BEFORE UPDATE ON public.check_ins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

----------------------------------------------------------------------
-- 5. Constraints: Uniqueness of Goal Titles per User
----------------------------------------------------------------------

-- Prevent a user from having two goals with the same title.
ALTER TABLE public.goals 
ADD CONSTRAINT unique_goal_title_per_user 
UNIQUE (user_id, title);
