
# Vector Column Migration

Make sure the content_items table has a vector column for embeddings by running the following SQL in the Supabase SQL editor:

```sql
-- Check if the pgvector extension is installed
CREATE EXTENSION IF NOT EXISTS vector;

-- Add an embedding column to the content_items table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'content_items'
        AND column_name = 'embedding'
    ) THEN
        ALTER TABLE public.content_items ADD COLUMN embedding vector(768);
    END IF;
END
$$;
```

# Fix for embedding_jobs Table

If you're having issues with the embedding_jobs table's created_at column, you can ensure the table has the right structure by running:

```sql
-- Ensure embedding_jobs has correct columns
ALTER TABLE public.embedding_jobs 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
```

# Create Vector Similarity Search Function

To enable semantic search functionality, add this SQL function to your Supabase database:

```sql
-- Create a function that performs vector similarity search
CREATE OR REPLACE FUNCTION match_content_items(query_embedding vector(768), match_threshold float, match_count int)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    category text,
    tags text[],
    similarity float
)
LANGUAGE plpgsql
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
```
