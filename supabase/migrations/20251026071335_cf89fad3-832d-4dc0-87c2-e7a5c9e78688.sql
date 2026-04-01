/**************************************************************************************************
* Migration: Extend Goals & Activities Schema for Advanced Structuring
*
* Description:
*   - Enhances the "goals" table to support multiple life wheel areas per goal.
*   - Adds hierarchical goal support via sub-goals (parent-child relationships).
*   - Extends the "activities" table with structured frequency tracking fields.
*   - Adds index and constraint for improved performance and data integrity.
*
* Changes:
*   1. Make 'life_wheel_area' plural (text[]) for multi-area support on goals.
*   2. Add 'parent_goal_id' to goals for sub-goal organization.
*   3. Add 'frequency_type' and 'frequency_value' to activities for flexible recurrence tracking.
*   4. Create an index for efficient parent_goal_id queries.
*   5. Enforce allowed values for 'frequency_type' with a CHECK constraint.
**************************************************************************************************/

------------------------------------------------------------
-- 1. Allow multiple life wheel areas to be linked to a goal
------------------------------------------------------------
ALTER TABLE goals 
  ALTER COLUMN life_wheel_area TYPE text[] 
    USING ARRAY[life_wheel_area]::text[];

------------------------------------------------------------
-- 2. Enable sub-goal (parent-child) relationships in goals
------------------------------------------------------------
ALTER TABLE goals 
  ADD COLUMN parent_goal_id uuid REFERENCES goals(id) ON DELETE CASCADE;

------------------------------------------------------------
-- 3. Add structured recurrence support to activities table
------------------------------------------------------------
ALTER TABLE activities 
  ADD COLUMN frequency_type text DEFAULT 'custom',   -- e.g., 'daily', 'weekly', etc.; see constraint below
  ADD COLUMN frequency_value integer;                -- Optional: Number indicating frequency count/interval

------------------------------------------------------------
-- 4. Index for fast parent_goal_id lookups in goals table
------------------------------------------------------------
CREATE INDEX idx_goals_parent_goal_id 
  ON goals(parent_goal_id);

------------------------------------------------------------
-- 5. Ensure frequency_type is only one of allowed options
------------------------------------------------------------
ALTER TABLE activities 
  ADD CONSTRAINT activities_frequency_type_check 
  CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'custom'));