
-- Create a function that properly stores embeddings as vector type
CREATE OR REPLACE FUNCTION public.store_content_embedding(content_id UUID, embedding_vector TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.content_items
  SET embedding = embedding_vector::vector
  WHERE id = content_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.store_content_embedding(UUID, TEXT) TO service_role;
