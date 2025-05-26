
-- Create table for storing Notion webhook verification tokens
CREATE TABLE notion_webhook_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_token TEXT NOT NULL,
  challenge_type TEXT DEFAULT 'url_verification',
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) 
ALTER TABLE notion_webhook_verifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading verification tokens
-- Since we don't know which user is setting up the webhook during verification,
-- we allow reading all tokens and let the frontend filter by recency
CREATE POLICY "Anyone can read verification tokens" ON notion_webhook_verifications
  FOR SELECT USING (true);

-- Create policy to allow the webhook function to insert verification tokens
-- This uses the service role key, so it bypasses RLS
CREATE POLICY "Service role can insert verification tokens" ON notion_webhook_verifications
  FOR INSERT WITH CHECK (true);

-- Add the table to realtime publication for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE notion_webhook_verifications;

-- Set replica identity to capture all changes for realtime
ALTER TABLE notion_webhook_verifications REPLICA IDENTITY FULL;

-- Create index for faster queries on received_at
CREATE INDEX idx_notion_webhook_verifications_received_at ON notion_webhook_verifications(received_at DESC);
