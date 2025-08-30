-- Create subscription table for email subscriptions
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  profile_url_param TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription access
CREATE POLICY "Allow public subscription creation" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view subscriptions for their URL param" 
ON public.subscriptions 
FOR SELECT 
USING (
  profile_url_param IN (
    SELECT url_param FROM profiles WHERE id = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX idx_subscriptions_profile_url_param ON public.subscriptions(profile_url_param);
CREATE INDEX idx_subscriptions_email ON public.subscriptions(email);