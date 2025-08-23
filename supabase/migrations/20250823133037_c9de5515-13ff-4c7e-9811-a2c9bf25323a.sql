-- Create a security definer function to get URL parameter by user ID for content ownership lookup
CREATE OR REPLACE FUNCTION public.get_url_param_by_user_id(target_user_id uuid)
RETURNS TABLE(url_param text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.url_param
  FROM profiles p
  WHERE p.id = target_user_id
    AND p.url_param IS NOT NULL;
$function$;