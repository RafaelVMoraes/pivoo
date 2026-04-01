
-- Add year evaluation columns to history table
ALTER TABLE public.history
ADD COLUMN IF NOT EXISTS goal_achievement TEXT,
ADD COLUMN IF NOT EXISTS consistency_engagement TEXT,
ADD COLUMN IF NOT EXISTS personal_impact TEXT;
