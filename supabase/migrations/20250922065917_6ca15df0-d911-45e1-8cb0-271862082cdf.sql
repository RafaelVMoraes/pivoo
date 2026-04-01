/**************************************************************************************************
* Migration: LifeWheel, Values, and Vision Tables with RLS and Triggers
*
* Description:
*   - Adds three tables in the public schema for user self-development features:
*       1. life_wheel: To track scores across different life domains for each user.
*       2. values: For users to identify and select their personal values.
*       3. vision: For storing users' vision and goals for specific years.
*   - Enforces row-level security (RLS) so users can only interact with their own data.
*   - Defines policies to restrict SELECT, INSERT, and UPDATE based on user_id = auth.uid().
*   - Adds triggers to auto-update the "updated_at" timestamp on updates (assumes trigger function exists).
*
* No logic has been changed from the original. Only improved documentation and organization.
**************************************************************************************************/

--------------------------------------------
-- Table 1: life_wheel
--------------------------------------------
-- Tracks scores in each life area for a user

CREATE TABLE public.life_wheel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, -- Unique row ID
  user_id UUID NOT NULL,                                  -- FK to auth.users (the user)
  area_name TEXT NOT NULL,                                -- Life area (e.g. "Health", "Career")
  current_score INTEGER NOT NULL DEFAULT 1 CHECK (current_score >= 1 AND current_score <= 10),  -- (1-10)
  desired_score INTEGER NOT NULL DEFAULT 1 CHECK (desired_score >= 1 AND desired_score <= 10),  -- (1-10)
  evolution_description TEXT,                             -- Optional: user notes about progress/growth
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),   -- Row creation timestamp
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),   -- Modified automatically on update
  UNIQUE(user_id, area_name)                              -- User can have only one row per area
);

-- Enable Row Level Security on the table
ALTER TABLE public.life_wheel ENABLE ROW LEVEL SECURITY;

-- Policies: Restrict access to only the owning user via auth.uid()
CREATE POLICY "Users can view their own life wheel data" 
  ON public.life_wheel 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own life wheel data" 
  ON public.life_wheel 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own life wheel data" 
  ON public.life_wheel 
  FOR UPDATE 
  USING (auth.uid() = user_id);

--------------------------------------------
-- Table 2: values
--------------------------------------------
-- Stores user's selection of predefined personal values

CREATE TABLE public.values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, -- Unique row ID
  user_id UUID NOT NULL,                                  -- FK to auth.users
  value_name TEXT NOT NULL,                               -- Name of the value (e.g. "Integrity")
  selected BOOLEAN NOT NULL DEFAULT false,                -- Has user selected this value?
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- Creation timestamp
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- Modified automatically on update
  UNIQUE(user_id, value_name)                             -- Unique value per user
);

-- Enable Row Level Security
ALTER TABLE public.values ENABLE ROW LEVEL SECURITY;

-- RLS Policies: CRUD restricted to the row owner only
CREATE POLICY "Users can view their own values" 
  ON public.values 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own values" 
  ON public.values 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own values" 
  ON public.values 
  FOR UPDATE 
  USING (auth.uid() = user_id);

--------------------------------------------
-- Table 3: vision
--------------------------------------------
-- Stores user's personal vision/goals per year

CREATE TABLE public.vision (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, -- Unique row ID
  user_id UUID NOT NULL,                                  -- FK to auth.users
  year INTEGER NOT NULL,                                  -- e.g. 2024, 2025
  vision_1y TEXT,                                         -- 1-year vision description
  vision_3y TEXT,                                         -- 3-year vision description
  word_year TEXT,                                         -- Chosen "word of the year"
  phrase_year TEXT,                                       -- A phrase representing the year
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- Timestamp of creation
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- Modified on update
  UNIQUE(user_id, year)                                   -- Only one vision per user per year
);

-- Enable Row Level Security
ALTER TABLE public.vision ENABLE ROW LEVEL SECURITY;

-- Owner-only policies
CREATE POLICY "Users can view their own vision" 
  ON public.vision 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vision" 
  ON public.vision 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vision" 
  ON public.vision 
  FOR UPDATE 
  USING (auth.uid() = user_id);

------------------------------------------------
-- Timestamp Triggers
-- (Assumes public.update_updated_at_column() exists)
------------------------------------------------

-- Automatically update 'updated_at' to current time on table UPDATE
CREATE TRIGGER update_life_wheel_updated_at
  BEFORE UPDATE ON public.life_wheel
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_values_updated_at
  BEFORE UPDATE ON public.values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vision_updated_at
  BEFORE UPDATE ON public.vision
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
