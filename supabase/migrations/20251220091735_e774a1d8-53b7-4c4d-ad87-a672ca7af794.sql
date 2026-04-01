/**************************************************************************************************
* Migration: Notification Scheduling Functions (Documentation Improved)
*
* Description:
*   - This migration defines two utility functions for enqueuing notifications based on schedules:
*       1. enqueue_notification(schedule_id): Enqueues a notification for a specific schedule entry.
*          Handles conditional update of the next_run field using cadence or cron_expr.
*       2. enqueue_due_notifications(): Iterates over all active notification schedules and enqueues
*          notifications for each, invoking the function above.
*   - Both functions explicitly set the search_path to "public".
*   - Comments are included to clarify each step of the logic.
**************************************************************************************************/

-- Function: enqueue_notification(schedule_id)
-- Purpose:   Enqueue a single notification for the schedule with the given ID, if active.
--            Optionally, update its next_run according to cadence or cron_expr rules.
CREATE OR REPLACE FUNCTION public.enqueue_notification(schedule_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
declare
  sched record;  -- Will hold the schedule row for further processing
begin
  -- Retrieve the active schedule row by ID; exit if not found
  select * into sched from notification_schedules where id = schedule_id and active;
  if not found then
    return;
  end if;

  -- Insert a new row into notifications_queue using the schedule's payload
  insert into notifications_queue (schedule_id, payload) values (schedule_id, sched.payload);

  -- Handle scheduling of next_run:
  --   - If cron_expr is present, leave to external cron handling or app parsing.
  --   - If cadence is weekly/monthly, update the next_run accordingly.
  if sched.cron_expr is not null then
    -- Leave next_run to cron jobs; handled by cron system or external code.
    null;
  elsif sched.cadence = 'weekly' then
    update notification_schedules
      set next_run = (coalesce(next_run, now()) + interval '7 days')
      where id = schedule_id;
  elsif sched.cadence = 'monthly' then
    update notification_schedules
      set next_run = (coalesce(next_run, now()) + interval '1 month')
      where id = schedule_id;
  end if;
end;
$function$;

-- Function: enqueue_due_notifications()
-- Purpose:   Enqueue notifications for all currently active notification schedules.
--            Effectively processes all schedules, calling enqueue_notification for each.
CREATE OR REPLACE FUNCTION public.enqueue_due_notifications()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
declare
  sched record; -- Used to iterate over each schedule ID
begin
  -- Loop over all active notification_schedules and enqueue notification for each
  for sched in select id from notification_schedules where active loop
    perform enqueue_notification(sched.id);
  end loop;
end;
$function$;