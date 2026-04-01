-- Weekly overall sentiment now supports 1-10 scale
ALTER TABLE public.weekly_evaluations
  ALTER COLUMN scale_value TYPE INTEGER;

-- Persist monthly overall sentiment (1-10)
ALTER TABLE public.monthly_reflections
  ADD COLUMN overall_sentiment INTEGER CHECK (overall_sentiment BETWEEN 1 AND 10);
