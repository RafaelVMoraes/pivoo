-- Add explicit execution status and optional numeric score to check_ins,
-- while keeping progress_value for backward compatibility.

ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS execution_status TEXT,
  ADD COLUMN IF NOT EXISTS score_value NUMERIC NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_ins_execution_status_check'
  ) THEN
    ALTER TABLE public.check_ins
      ADD CONSTRAINT check_ins_execution_status_check
      CHECK (execution_status IN ('done', 'not_done', 'pending'));
  END IF;
END $$;

UPDATE public.check_ins
SET execution_status = CASE
  WHEN progress_value IN ('done', 'no_evolution', 'some_evolution', 'good_evolution', 'true') THEN 'done'
  WHEN progress_value IN ('not_done', 'false') THEN 'not_done'
  ELSE 'pending'
END
WHERE execution_status IS NULL;

UPDATE public.check_ins
SET score_value = CASE
  WHEN progress_value ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN progress_value::numeric
  WHEN progress_value = 'true' THEN 1
  WHEN progress_value = 'false' THEN 0
  ELSE NULL
END
WHERE score_value IS NULL;

ALTER TABLE public.check_ins
  ALTER COLUMN execution_status SET DEFAULT 'pending',
  ALTER COLUMN execution_status SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_check_ins_execution_status_date
  ON public.check_ins (user_id, execution_status, date DESC);
