-- Create function to get public content for a user by URL parameter
CREATE OR REPLACE FUNCTION get_user_content_by_url_param(url_param_value text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category text,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz,
  start_date date,
  end_date date,
  notion_url text,
  content jsonb,
  notion_page_status text,
  notion_page_id text,
  notion_created_time timestamptz,
  notion_last_edited_time timestamptz,
  embedding vector,
  visitor_count integer,
  user_id uuid,
  title_translations jsonb,
  description_translations jsonb,
  content_translations jsonb,
  translated_languages text[],
  translation_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- First, get the user ID for the given URL parameter
  SELECT p.id INTO target_user_id
  FROM profiles p
  WHERE p.url_param = url_param_value;
  
  -- If no user found, return empty result
  IF target_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Return all content items for this user
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.category,
    c.tags,
    c.created_at,
    c.updated_at,
    c.start_date,
    c.end_date,
    c.notion_url,
    c.content,
    c.notion_page_status,
    c.notion_page_id,
    c.notion_created_time,
    c.notion_last_edited_time,
    c.embedding,
    c.visitor_count,
    c.user_id,
    c.title_translations,
    c.description_translations,
    c.content_translations,
    c.translated_languages,
    c.translation_status
  FROM content_items c
  WHERE c.user_id = target_user_id
  ORDER BY c.created_at DESC;
END;
$$;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION get_user_content_by_url_param(text) TO anon, authenticated;