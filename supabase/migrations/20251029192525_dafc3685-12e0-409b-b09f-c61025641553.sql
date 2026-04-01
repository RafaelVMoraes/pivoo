/**************************************************************************************************
* Migration: Enhance Activities Table with Frequency Scheduling Columns
*
* Description:
*   - This migration extends the "activities" table in the public schema to support richer recurring
*     schedule tracking for each activity.
*   - It introduces new columns to allow explicit recording of:
*       • The specific time of day for daily activities.
*       • The exact days of the week for weekly recurrences.
*       • The calendar day for monthly activities.
*   - Clear comments and documentation are included for each change to facilitate maintainability
*     and onboarding of new developers.
**************************************************************************************************/

------------------------------------------------------
-- 1. Add columns for detailed frequency scheduling
------------------------------------------------------
ALTER TABLE activities 
  ADD COLUMN IF NOT EXISTS time_of_day TEXT,            -- E.g., 'morning', 'afternoon', or 'night' (used for daily recurrences)
  ADD COLUMN IF NOT EXISTS days_of_week TEXT[],         -- Array of weekdays (e.g., ['monday', 'wednesday']), for weekly activities
  ADD COLUMN IF NOT EXISTS day_of_month INTEGER;        -- Day number (1-31), for specifying monthly recurrence

------------------------------------------------------
-- 2. Document new columns for clarity and onboarding
------------------------------------------------------
COMMENT ON COLUMN activities.time_of_day IS 'For daily activities: morning, afternoon, or night';
COMMENT ON COLUMN activities.days_of_week IS 'For weekly activities: array of days (monday, tuesday, etc.)';
COMMENT ON COLUMN activities.day_of_month IS 'For monthly activities: day number (1-31)';