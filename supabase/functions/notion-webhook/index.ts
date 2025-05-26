
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotionWebhookPayload {
  type?: string;
  challenge?: string;
  object?: string;
  event_type?: string;
  page?: {
    id: string;
    created_time: string;
    last_edited_time: string;
    url: string;
    properties?: any;
  };
  workspace?: {
    id: string;
  };
}

Deno.serve(async (req) => {
  console.log('=== Notion Webhook Request ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: NotionWebhookPayload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    // Handle Notion verification challenge
    if (payload.type === 'url_verification' && payload.challenge) {
      console.log('Handling verification challenge:', payload.challenge);
      
      // Store the verification token in the database
      const { error: insertError } = await supabase
        .from('notion_webhook_verifications')
        .insert({
          verification_token: payload.challenge,
          challenge_type: 'url_verification'
        });
      
      if (insertError) {
        console.error('Error storing verification token:', insertError);
      } else {
        console.log('Verification token stored successfully');
      }
      
      // Return the challenge as required by Notion
      return new Response(
        JSON.stringify({ challenge: payload.challenge }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Handle page updates
    if (payload.object === 'event' && payload.page) {
      console.log('Processing page update for page:', payload.page.id);
      
      // Process the page update similar to sync-notion-database
      // This ensures data format consistency
      const pageData = {
        notion_page_id: payload.page.id,
        notion_created_time: payload.page.created_time,
        notion_last_edited_time: payload.page.last_edited_time,
        notion_url: payload.page.url,
        updated_at: new Date().toISOString()
      };

      console.log('Page data to process:', pageData);
      
      // Here you would typically fetch the full page content from Notion
      // and update the content_items table with the same format as sync-notion-database
      // For now, just log that we received the update
      
      return new Response(
        JSON.stringify({ status: 'success', message: 'Page update processed' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Unknown webhook type
    console.log('Unknown webhook payload type:', payload.type || 'undefined');
    return new Response(
      JSON.stringify({ status: 'success', message: 'Webhook received but not processed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
