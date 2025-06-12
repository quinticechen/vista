
-- Create home_page_settings table
CREATE TABLE IF NOT EXISTS home_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hero_title TEXT NOT NULL,
  hero_subtitle TEXT NOT NULL,
  hero_description TEXT,
  interactive_title TEXT NOT NULL,
  interactive_subtitle TEXT,
  custom_input_placeholder TEXT,
  submit_button_text TEXT NOT NULL,
  footer_name TEXT NOT NULL,
  option_buttons JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Add RLS policies for home_page_settings table
ALTER TABLE home_page_settings ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own settings
CREATE POLICY "Users can view their own home page settings"
  ON home_page_settings
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Policy for users to insert their own settings
CREATE POLICY "Users can insert their own home page settings"
  ON home_page_settings
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Policy for users to update their own settings
CREATE POLICY "Users can update their own home page settings"
  ON home_page_settings
  FOR UPDATE
  USING (auth.uid() = profile_id);

-- Policy for users to delete their own settings
CREATE POLICY "Users can delete their own home page settings"
  ON home_page_settings
  FOR DELETE
  USING (auth.uid() = profile_id);

-- Policy to allow public access to settings by profile_id
-- This allows the frontend to fetch settings for URL parameter profiles
CREATE POLICY "Allow public access to home page settings"
  ON home_page_settings
  FOR SELECT
  TO PUBLIC
  USING (true);
