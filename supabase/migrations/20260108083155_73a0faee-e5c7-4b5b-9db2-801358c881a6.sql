-- Remove the overly permissive INSERT policy on profiles table
-- The handle_new_user() function uses SECURITY DEFINER which bypasses RLS,
-- so this policy is unnecessary and creates a security vulnerability
DROP POLICY IF EXISTS "Allow system trigger to insert profiles" ON public.profiles;

-- Add a comment explaining why this was removed
COMMENT ON TABLE public.profiles IS 'User profiles table. Profile creation during signup is handled by handle_new_user() trigger function which uses SECURITY DEFINER to bypass RLS. Direct user profile creation is protected by the "Users can create their own profile" policy.';