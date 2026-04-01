/**************************************************************************************************
* Migration: Add Focus Area Flag to Life Wheel Table
*
* Description:
*   - This migration extends the "life_wheel" table by introducing an "is_focus_area" boolean column.
*   - The "is_focus_area" field allows certain life wheel areas to be explicitly marked as key areas of focus
*     for a user, simplifying queries and UI handling.
*   - The default is set to false, so, unless otherwise specified, existing and new rows will not be considered
*     focus areas until updated.
**************************************************************************************************/

-- Add a boolean column "is_focus_area" to indicate if a life wheel area is a primary focus area for the user.
ALTER TABLE life_wheel 
  ADD COLUMN is_focus_area boolean DEFAULT false;