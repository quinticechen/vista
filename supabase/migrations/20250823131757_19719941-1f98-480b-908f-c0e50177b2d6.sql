-- Fix content_items RLS policies for proper public access
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Allow public read access" ON public.content_items;

-- Create more specific RLS policies
-- Allow public to read content items (this is needed for the blog platform)
CREATE POLICY "Public can read content items" 
ON public.content_items 
FOR SELECT 
USING (true);

-- Allow users to insert their own content items
CREATE POLICY "Users can insert their own content" 
ON public.content_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own content items
CREATE POLICY "Users can update their own content" 
ON public.content_items 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to delete their own content items
CREATE POLICY "Users can delete their own content" 
ON public.content_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix function security by adding search_path
CREATE OR REPLACE FUNCTION public.match_content_items(query_embedding vector, match_threshold double precision, match_count integer)
RETURNS TABLE(id uuid, title text, description text, category text, tags text[], similarity double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        content_items.id,
        content_items.title,
        content_items.description,
        content_items.category,
        content_items.tags,
        1 - (content_items.embedding <=> query_embedding) AS similarity
    FROM content_items
    WHERE 1 - (content_items.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;