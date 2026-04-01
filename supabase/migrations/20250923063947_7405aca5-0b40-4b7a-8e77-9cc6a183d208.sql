/**************************************************************************************************
* Migration: SECURITY DEFINER for handle_new_user() Trigger Function
*
* Purpose:
*   - This migration ensures that the `handle_new_user()` trigger function, which automatically
*     creates a "profiles" row for every new user, is run with elevated privileges (SECURITY DEFINER).
*   - This is necessary because regular insertions may be blocked by Row-Level Security (RLS)
*     policies on the `public.profiles` table. By using SECURITY DEFINER, the function will bypass
*     RLS checks and always successfully create the corresponding profile row for a new user.
*
* Structure:
*   1. Definition of the trigger function with SECURITY DEFINER, including search_path safety.
*   2. Safe (re-)creation of the trigger on the auth.users table.
**************************************************************************************************/

-- 1. Create or replace the handle_new_user() trigger function with SECURITY DEFINER.
--    This function inserts a matching profile row for a new authentication user.
--    Note: With SECURITY DEFINER, the function executes with the privileges of its owner (usually the migration role),
--    allowing bypass of any RLS restrictions on public.profiles insertions.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert a new profile row for the newly registered user.
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- 2. (Re-)create trigger on the auth.users table to ensure it uses the updated function.
--    Drops the trigger if it already exists, then creates it fresh.
--    This trigger will fire immediately AFTER a new auth.users row is inserted.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
