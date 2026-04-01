
-- Weekly evaluation scales table
CREATE TABLE public.weekly_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL, -- 1-12
  week_number INTEGER NOT NULL, -- 1-5
  scale_category TEXT NOT NULL,
  scale_value INTEGER NOT NULL, -- 1-5
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year, month, week_number, scale_category)
);

ALTER TABLE public.weekly_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly evaluations"
  ON public.weekly_evaluations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own weekly evaluations"
  ON public.weekly_evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly evaluations"
  ON public.weekly_evaluations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly evaluations"
  ON public.weekly_evaluations FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_weekly_evaluations_updated_at
  BEFORE UPDATE ON public.weekly_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Monthly reflections table
CREATE TABLE public.monthly_reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL, -- 1-12
  reflection_text TEXT,
  goal_progress TEXT, -- dropdown value
  consistency TEXT, -- dropdown value
  personal_evolution TEXT, -- dropdown value
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year, month)
);

ALTER TABLE public.monthly_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own monthly reflections"
  ON public.monthly_reflections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own monthly reflections"
  ON public.monthly_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly reflections"
  ON public.monthly_reflections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monthly reflections"
  ON public.monthly_reflections FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_monthly_reflections_updated_at
  BEFORE UPDATE ON public.monthly_reflections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
