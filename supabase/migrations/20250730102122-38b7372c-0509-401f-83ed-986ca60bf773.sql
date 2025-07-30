-- Update the increment_visitor_count function with proper search_path
CREATE OR REPLACE FUNCTION increment_visitor_count(content_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE content_items
  SET visitor_count = COALESCE(visitor_count, 0) + 1
  WHERE id = content_id;
  
  RETURN FOUND;
END;
$$;