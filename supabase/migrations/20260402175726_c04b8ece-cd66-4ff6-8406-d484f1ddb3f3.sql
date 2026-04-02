ALTER TABLE public.check_ins ADD COLUMN IF NOT EXISTS execution_status text;
ALTER TABLE public.check_ins ADD COLUMN IF NOT EXISTS score_value integer;