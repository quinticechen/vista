
import { supabase } from "@/integrations/supabase/client";

export interface WebhookVerification {
  id: string;
  verification_token: string;
  challenge_type: string;
  received_at: string;
  user_id: string | null;
}

/**
 * Get the latest webhook verification token for the current user
 * Uses profiles table to find user's database and then matches verification tokens
 */
export const getLatestVerificationToken = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get user's notion database ID from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('notion_database_id')
      .eq('id', user.id)
      .single();

    if (!profile?.notion_database_id) return null;

    // Get the latest verification token
    // Since verification tokens are stored without user_id initially,
    // we get the most recent one and assume it's for the current user's setup
    const { data: verification } = await supabase
      .from('notion_webhook_verifications')
      .select('verification_token')
      .order('received_at', { ascending: false })
      .limit(1)
      .single();

    return verification?.verification_token || null;
  } catch (error) {
    console.error('Error fetching verification token:', error);
    return null;
  }
};

/**
 * Subscribe to real-time webhook verification updates
 */
export const subscribeToVerificationUpdates = (
  callback: (token: string) => void
) => {
  const channel = supabase
    .channel('webhook-verifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notion_webhook_verifications'
      },
      (payload) => {
        const newVerification = payload.new as WebhookVerification;
        if (newVerification.verification_token) {
          callback(newVerification.verification_token);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Check if user has a notion database configured
 */
export const hasNotionDatabaseConfigured = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('notion_database_id, notion_api_key')
      .eq('id', user.id)
      .single();

    return !!(profile?.notion_database_id && profile?.notion_api_key);
  } catch (error) {
    console.error('Error checking notion configuration:', error);
    return false;
  }
};
