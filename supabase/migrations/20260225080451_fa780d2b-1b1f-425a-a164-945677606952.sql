
-- Add year column to life_wheel (default to current year for existing data)
ALTER TABLE public.life_wheel ADD COLUMN year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now())::integer;

-- Add achieved_score column to life_wheel
ALTER TABLE public.life_wheel ADD COLUMN achieved_score integer DEFAULT NULL;

-- Drop existing unique constraint on user_id, area_name
ALTER TABLE public.life_wheel DROP CONSTRAINT IF EXISTS life_wheel_user_id_area_name_key;

-- Create new unique constraint including year
ALTER TABLE public.life_wheel ADD CONSTRAINT life_wheel_user_id_area_name_year_key UNIQUE (user_id, area_name, year);

-- Add vision_5y column to vision table
ALTER TABLE public.vision ADD COLUMN vision_5y text DEFAULT NULL;
