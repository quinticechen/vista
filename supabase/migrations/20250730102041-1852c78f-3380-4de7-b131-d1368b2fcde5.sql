-- Add visitor_count column to content_items table
ALTER TABLE public.content_items 
ADD COLUMN IF NOT EXISTS visitor_count integer DEFAULT 0;

-- Add index for better performance when querying by visitor count
CREATE INDEX IF NOT EXISTS idx_content_items_visitor_count ON public.content_items(visitor_count);

-- Create function to safely increment visitor count
CREATE OR REPLACE FUNCTION increment_visitor_count(content_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.content_items
  SET visitor_count = COALESCE(visitor_count, 0) + 1
  WHERE id = content_id;
  
  RETURN FOUND;
END;
$$;