/**************************************************************************************************
* Migration: Add Reflection Fields to Goals Table
*
* Description:
*   - This migration enhances the "goals" table in the public schema by adding three new columns
*     to store different levels of user motivation behind each goal. 
*   - These fields support deeper self-reflection and allow for richer goal-tracking and analytics.
*
*   Added Columns:
*     • surface_motivation  : Captures the initial or surface-level reasons for pursuing the goal.
*     • deeper_motivation   : Records more thoughtful or underlying motivations the user may have.
*     • identity_motivation : Stores motivations tied to the user's self-identity or core values.
**************************************************************************************************/

-- Add columns for various motivation reflections to the "goals" table.
ALTER TABLE public.goals 
  ADD COLUMN IF NOT EXISTS surface_motivation TEXT,      -- User's apparent/first-level reason for this goal
  ADD COLUMN IF NOT EXISTS deeper_motivation TEXT,       -- User's deeper or underlying motivation for this goal
  ADD COLUMN IF NOT EXISTS identity_motivation TEXT;     -- Motivation for the goal that connects to user identity/core values
