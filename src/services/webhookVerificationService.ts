
import { supabase } from "@/integrations/supabase/client";

export interface WebhookVerification {
  id: string;
  verification_token: string;
  challenge_type: string;
  received_at: string;
  user_id: string | null;
}

/**
 * Get the verification token for the current user from their profile
 */
export const getUserVerificationToken = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get user's verification token from profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('verification_token')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching verification token:', error);
      return null;
    }

    return profile?.verification_token || null;
  } catch (error) {
    console.error('Error fetching verification token:', error);
    return null;
  }
};

/**
 * Generate user-specific webhook URL
 */
export const getUserSpecificWebhookUrl = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const baseUrl = 'https://oyvbdbajqsqzafpuahvz.supabase.co/functions/v1/notion-webhook';
    return `${baseUrl}?user_id=${user.id}`;
  } catch (error) {
    console.error('Error generating webhook URL:', error);
    return null;
  }
};

/**
 * Subscribe to real-time profile updates for verification token changes
 */
export const subscribeToVerificationUpdates = (
  callback: (token: string) => void
) => {
  const channel = supabase
    .channel('profile-verification-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `verification_token=not.is.null`
      },
      (payload) => {
        const updatedProfile = payload.new as any;
        if (updatedProfile.verification_token) {
          callback(updatedProfile.verification_token);
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

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('notion_database_id, notion_api_key')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error checking notion configuration:', error);
      return false;
    }

    return !!(profile?.notion_database_id && profile?.notion_api_key);
  } catch (error) {
    console.error('Error checking notion configuration:', error);
    return false;
  }
};

/**
 * Clear verification token for current user
 */
export const clearVerificationToken = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ verification_token: null })
      .eq('id', user.id);

    return !error;
  } catch (error) {
    console.error('Error clearing verification token:', error);
    return false;
  }
};

// Legacy function for backward compatibility
export const getLatestVerificationToken = getUserVerificationToken;
