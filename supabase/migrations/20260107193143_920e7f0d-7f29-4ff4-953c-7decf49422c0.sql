/**************************************************************************************************
* Migration: Extend Goals and Activities Tables - Dates, Checklist, and Types
*
* Description:
*   - Adds temporal and structural fields to the "goals" and "activities" tables to support new behaviors.
*   - Enhances "goals" with start/end dates, a JSON success checklist, and target values.
*   - Consolidates and limits goal types, transitioning legacy values to new enumeration.
*   - Expands "activities" with title, end date, target value, and an activity_type marker.
*   - Includes comments for column documentation and migration intent throughout.
**************************************************************************************************/

-----------------------------------------------------------------------------------
-- 1. Add additional fields to "goals" table
-----------------------------------------------------------------------------------
ALTER TABLE public.goals 
  ADD COLUMN IF NOT EXISTS start_date date,                                    -- When goal begins (for scheduling)
  ADD COLUMN IF NOT EXISTS end_date date,                                      -- Intended completion date
  ADD COLUMN IF NOT EXISTS success_checklist jsonb DEFAULT '[]'::jsonb,        -- For a definition-of-success checklist
  ADD COLUMN IF NOT EXISTS target_value text;                                  -- Value to reach, when applicable

-----------------------------------------------------------------------------------
-- 2. Update goal types to new scheme ('outcome' -> 'target', 'process' -> 'habit')
-----------------------------------------------------------------------------------
-- Drop the old type check constraint to allow update
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_type_check;

-- Migrate legacy type values to new values:
UPDATE public.goals SET type = 'target' WHERE type = 'outcome';
UPDATE public.goals SET type = 'habit' WHERE type = 'process';

-- Reinstate check constraint with narrowed acceptable values
ALTER TABLE public.goals 
  ADD CONSTRAINT goals_type_check CHECK (type IN ('habit', 'target'));

-----------------------------------------------------------------------------------
-- 3. Add new fields to "activities" table
-----------------------------------------------------------------------------------
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS title text,                                         -- Required descriptive title (copied from description for existing)
  ADD COLUMN IF NOT EXISTS end_date date,                                      -- For "target" type activities
  ADD COLUMN IF NOT EXISTS target_value text,                                  -- Value to reach for a specific activity
  ADD COLUMN IF NOT EXISTS activity_type text DEFAULT 'habit';                 -- Classification: 'habit' or 'target'

-- Update existing rows: set title = description for backwards compatibility
UPDATE public.activities SET title = description WHERE title IS NULL;

-----------------------------------------------------------------------------------
-- 4. Documentation comments for newly added/updated columns
-----------------------------------------------------------------------------------
COMMENT ON COLUMN public.goals.success_checklist IS 
  'JSON array of {id: string, text: string, completed: boolean} for Definition of Success';
COMMENT ON COLUMN public.goals.start_date IS 
  'Date when goal starts generating activities, default is day after creation';
COMMENT ON COLUMN public.goals.end_date IS 
  'Target end date, default is end of year';
COMMENT ON COLUMN public.activities.activity_type IS 
  'Either habit (recurring, no end date) or target (has end date, generates 1 task/month)';