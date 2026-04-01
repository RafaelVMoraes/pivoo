/*************************************************************************************************
* Migration: Create and manage user profiles with row-level security and automation
*
* Description:
*   - This migration sets up the core user profiles infrastructure in the public schema.
*   - It enforces row-level security so users can manage/view only their own profile.
*   - Automated triggers/functions handle timestamp maintenance and profile creation on new signup.
*   - Includes all relevant policies, triggers, and supporting functions.
*************************************************************************************************/

-- 1. Create the profiles table to store user details and preferences
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,  -- Unique profile row ID
  user_id UUID NOT NULL UNIQUE,                            -- Foreign key to auth.users (app user)
  name TEXT,                                               -- Optional: user's display name
  email TEXT,                                              -- Optional: copied from auth.users for convenience
  avatar_url TEXT,                                         -- Optional: profile photo or avatar
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'pt', 'fr')), -- Preferred UI language
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),        -- Creation timestamp
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()         -- Last update timestamp (auto-managed)
);

-- 2. Enable Row Level Security (RLS) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow a user to view only their profile row
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Policy: Only allow users to create their own profile
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Policy: Only allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 6. Function: Automatically update 'updated_at' on profile changes
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 7. Trigger: Before updating a profile, refresh 'updated_at'
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Function: When a new user signs up (row in auth.users), auto-create a matching profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 9. Trigger: After a new user is created in auth.users, invoke profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
