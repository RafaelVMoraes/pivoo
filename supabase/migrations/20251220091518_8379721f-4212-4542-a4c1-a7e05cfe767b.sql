/**************************************************************************************************
* Migration: Enable Row Level Security (RLS) and User-Oriented Policies for Push Subscriptions & Notification Tables
*
* Description:
*   - This migration secures the `push_subscriptions` table by enabling RLS and defining explicit
*     user-centric policies that allow users to access and manage only their own records.
*   - RLS is also enabled on notification-related system tables (notification_schedules,
*     notifications_queue, cron_job_registry) so that only service roles will have unrestricted access.
*   - User-focused policies are not added for these system tables, as direct user access is not expected.
*   - This improves data privacy and enforces separation of user data.
**************************************************************************************************/

----------------------------------------------------------
-- 1. Secure user push subscriptions table
----------------------------------------------------------

-- Enable Row Level Security (RLS) on push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view *only* their own push subscriptions
CREATE POLICY "Users can view their own push subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Allow users to insert rows *only* for themselves
CREATE POLICY "Users can create their own push subscriptions"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to update *only* their own rows
CREATE POLICY "Users can update their own push subscriptions"
  ON public.push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Allow users to delete *only* their own rows
CREATE POLICY "Users can delete their own push subscriptions"
  ON public.push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

----------------------------------------------------------
-- 2. Secure notification-related system tables
----------------------------------------------------------

-- Enable RLS on notification scheduling and system tables.
-- User-facing policies are NOT added, as access is intended only for internal or service roles.

ALTER TABLE public.notification_schedules ENABLE ROW LEVEL SECURITY;     -- For notification scheduling logic

ALTER TABLE public.notifications_queue ENABLE ROW LEVEL SECURITY;        -- For queued outbound notifications

ALTER TABLE public.cron_job_registry ENABLE ROW LEVEL SECURITY;          -- For background job metadata

-- Note: These tables do not receive explicit user policies, as they are intended for
-- use by backend systems and privileged roles only.
