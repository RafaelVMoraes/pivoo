-- Reconcile notification schema to the current engine model.
-- Removes legacy schedule artifacts and enforces queue fields used by edge functions.

-- Ensure queue has current columns.
ALTER TABLE public.notifications_queue
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

-- Backfill best-effort values for legacy rows before constraints.
UPDATE public.notifications_queue
SET
  type = COALESCE(type, payload->>'type', 'legacy'),
  scheduled_for = COALESCE(scheduled_for, created_at)
WHERE type IS NULL OR scheduled_for IS NULL;

-- Drop rows that cannot be associated with a user in the new model.
DELETE FROM public.notifications_queue
WHERE user_id IS NULL;

ALTER TABLE public.notifications_queue
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN scheduled_for SET NOT NULL,
  ALTER COLUMN processed SET DEFAULT false,
  ALTER COLUMN created_at SET DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notifications_queue_user_id_fkey'
  ) THEN
    ALTER TABLE public.notifications_queue
      ADD CONSTRAINT notifications_queue_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Legacy schedule-driven queue metadata is no longer used.
ALTER TABLE public.notifications_queue
  DROP COLUMN IF EXISTS schedule_id;

DROP FUNCTION IF EXISTS public.enqueue_due_notifications();
DROP FUNCTION IF EXISTS public.enqueue_notification(uuid);

DROP TABLE IF EXISTS public.notification_schedules;
