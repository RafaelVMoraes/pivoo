-- Ensure monthly overall sentiment is available in all environments
ALTER TABLE public.monthly_reflections
  ADD COLUMN IF NOT EXISTS overall_sentiment INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'monthly_reflections_overall_sentiment_check'
  ) THEN
    ALTER TABLE public.monthly_reflections
      ADD CONSTRAINT monthly_reflections_overall_sentiment_check
      CHECK (overall_sentiment IS NULL OR overall_sentiment BETWEEN 1 AND 10);
  END IF;
END $$;
