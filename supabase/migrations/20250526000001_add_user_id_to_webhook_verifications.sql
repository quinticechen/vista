
-- Add user_id column to notion_webhook_verifications table
ALTER TABLE notion_webhook_verifications 
ADD COLUMN user_id UUID REFERENCES profiles(id);

-- Create index for faster queries by user_id
CREATE INDEX idx_notion_webhook_verifications_user_id ON notion_webhook_verifications(user_id);

-- Update RLS policies to be user-specific
DROP POLICY IF EXISTS "Anyone can read verification tokens" ON notion_webhook_verifications;

-- Create policy that allows users to read only their own verification tokens
CREATE POLICY "Users can read their own verification tokens" ON notion_webhook_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Update the service role policy to allow inserting with user context
DROP POLICY IF EXISTS "Service role can insert verification tokens" ON notion_webhook_verifications;

CREATE POLICY "Service role can insert verification tokens" ON notion_webhook_verifications
  FOR INSERT WITH CHECK (true);
