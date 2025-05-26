
-- Create table to map Notion databases to users
CREATE TABLE notion_database_user_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_database_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notion_database_id, user_id)
);

-- Add RLS
ALTER TABLE notion_database_user_mapping ENABLE ROW LEVEL SECURITY;

-- Users can only see their own mappings
CREATE POLICY "Users can view their own database mappings" ON notion_database_user_mapping
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own mappings
CREATE POLICY "Users can create their own database mappings" ON notion_database_user_mapping
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own mappings
CREATE POLICY "Users can update their own database mappings" ON notion_database_user_mapping
  FOR UPDATE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_notion_database_user_mapping_database_id ON notion_database_user_mapping(notion_database_id);
CREATE INDEX idx_notion_database_user_mapping_user_id ON notion_database_user_mapping(user_id);

-- Function to automatically create/update mapping when user saves Notion settings
CREATE OR REPLACE FUNCTION upsert_notion_database_mapping()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if notion_database_id is being set
  IF NEW.notion_database_id IS NOT NULL AND NEW.notion_database_id != '' THEN
    INSERT INTO notion_database_user_mapping (notion_database_id, user_id)
    VALUES (NEW.notion_database_id, NEW.id)
    ON CONFLICT (notion_database_id, user_id) 
    DO UPDATE SET updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update mapping when profile is updated
CREATE TRIGGER trigger_upsert_notion_database_mapping
  AFTER UPDATE OF notion_database_id ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION upsert_notion_database_mapping();
