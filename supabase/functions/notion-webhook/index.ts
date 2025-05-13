
// Notion Webhook handler for receiving updates from Notion

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.5.0'
import { Client } from 'https://deno.land/x/notion_sdk/src/mod.ts'

// Define the structure of a Notion page
interface NotionPage {
  id: string;
  properties: Record<string, any>;
  url: string;
  created_time: string;
  last_edited_time: string;
}

// Define CORS headers for the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // This endpoint is designed to be called by Notion, so it doesn't require authentication
    const payload = await req.json()
    console.log("Received webhook from Notion:", JSON.stringify(payload))
    
    // Validate the webhook payload
    if (!payload || !payload.page || !payload.page.id) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }
    
    // Get the Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get the page ID from the webhook payload
    const pageId = payload.page.id
    
    // Format the page ID for use in the URL (remove hyphens)
    const formattedPageId = pageId.replace(/-/g, '')
    const pageUrl = `https://www.notion.so/${formattedPageId}`
    
    // Find the content item in our database that corresponds to this Notion page
    const { data: contentItem, error: findError } = await supabase
      .from('content_items')
      .select('id, user_id')
      .eq('notion_url', pageUrl)
      .single()
    
    if (findError || !contentItem) {
      console.log("No matching content item found for Notion page ID:", pageId)
      return new Response(
        JSON.stringify({ status: 'ignored', message: 'No matching content item found' }),
        { 
          status: 200,  // Return 200 to acknowledge receipt even if we don't process
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }
    
    // Get the user's Notion API key from their profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('notion_api_key, notion_database_id')
      .eq('id', contentItem.user_id)
      .single()
    
    if (profileError || !userProfile || !userProfile.notion_api_key) {
      console.error("Error retrieving user profile or API key:", profileError)
      return new Response(
        JSON.stringify({ status: 'error', message: 'User profile or API key not found' }),
        { 
          status: 200,  // Return 200 to acknowledge receipt
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }
    
    // Initialize the Notion client with the user's API key
    const notion = new Client({ auth: userProfile.notion_api_key })
    
    // Fetch the page details from Notion
    const page = await notion.pages.retrieve({ page_id: pageId }) as unknown as NotionPage
    
    // Extract properties from the page
    const props = page.properties
    
    // Update the content item in our database
    const updatedContentItem = {
      title: extractProperty(props, 'Name', 'title') || extractProperty(props, 'Title', 'title') || 'Untitled',
      description: extractProperty(props, 'Description', 'rich_text'),
      category: extractProperty(props, 'Category', 'select'),
      tags: extractProperty(props, 'Tags', 'multi_select'),
      updated_at: page.last_edited_time,
      start_date: extractProperty(props, 'Start date', 'date'),
      end_date: extractProperty(props, 'End date', 'date'),
    }
    
    // Update the content item in our database
    const { data, error } = await supabase
      .from('content_items')
      .update(updatedContentItem)
      .eq('id', contentItem.id)
    
    if (error) {
      console.error("Error updating content item:", error)
      throw error
    }
    
    return new Response(
      JSON.stringify({ 
        status: 'success', 
        message: 'Content item updated successfully' 
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
    
  } catch (error) {
    console.error("Webhook processing error:", error)
    
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: error.message || 'An error occurred while processing the webhook' 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
})

// Helper function to extract properties from Notion page (same as in sync-notion-database)
function extractProperty(props: Record<string, any>, propertyName: string, propertyType: string): any {
  if (!props || !propertyName) return null
  
  // Try to find the property (case-insensitive)
  const property = Object.entries(props).find(([key]) => 
    key.toLowerCase() === propertyName.toLowerCase()
  )
  
  if (!property) return null
  
  const [_, value] = property
  
  switch (propertyType) {
    case 'title':
      return value.title?.[0]?.plain_text || null
    case 'rich_text':
      return value.rich_text?.[0]?.plain_text || null
    case 'select':
      return value.select?.name || null
    case 'multi_select':
      return value.multi_select?.map(item => item.name) || []
    case 'date':
      return value.date?.start || null
    default:
      return null
  }
}
