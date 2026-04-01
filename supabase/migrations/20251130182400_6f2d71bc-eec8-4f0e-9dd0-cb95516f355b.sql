/**************************************************************************************************
* Migration: Add Priority Field to Goals Table
*
* Description:
*   - This migration introduces a new "priority" column to the "goals" table.
*   - The "priority" field enables categorization of goals as 'gold', 'silver', or 'bronze'.
*   - The default priority for all existing and new rows is set to 'bronze'.
*   - A CHECK constraint is enforced to ensure only valid priority values are stored.
**************************************************************************************************/

-- Add the "priority" column to the "goals" table (must be 'gold', 'silver', or 'bronze'; default is 'bronze')
ALTER TABLE public.goals 
  ADD COLUMN priority text NOT NULL DEFAULT 'bronze'
  CHECK (priority IN ('gold', 'silver', 'bronze'));