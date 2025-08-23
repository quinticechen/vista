-- Drop the overly permissive public policy that exposes sensitive data
DROP POLICY IF EXISTS "Public can read profiles with url_param" ON public.profiles;

-- Create a security definer function that returns only safe profile fields for public access
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_url_param text)
RETURNS TABLE (
  url_param text,
  default_language text,
  supported_ai_languages text[],
  created_at timestamp with time zone
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    p.url_param,
    p.default_language,
    p.supported_ai_languages,
    p.created_at
  FROM profiles p
  WHERE p.url_param = profile_url_param
    AND p.url_param IS NOT NULL;
$$;

-- Create a new restricted policy for public profile access
-- This policy will deny access by default (no public SELECT policy)
-- Public access will go through the security definer function instead

-- Keep existing policies for authenticated users
-- Users can still read their own complete profile
-- Users can still update their own profile

-- Grant execute permission on the public function to anonymous users
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO authenticated;