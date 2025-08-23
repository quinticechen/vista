-- Create a security definer function to get profile ID by URL parameter
-- This allows public access to resolve URL parameters to profile IDs
CREATE OR REPLACE FUNCTION public.get_profile_id_by_url_param(url_param_input text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_id_result uuid;
BEGIN
    SELECT id INTO profile_id_result
    FROM profiles
    WHERE url_param = url_param_input;
    
    RETURN profile_id_result;
END;
$$;