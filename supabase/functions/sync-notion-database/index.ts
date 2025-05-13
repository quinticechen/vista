
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.5.0'
import { Client } from 'https://deno.land/x/notion_sdk/src/mod.ts'

// Define the expected request body structure
interface RequestBody {
  notionDatabaseId: string;
  notionApiKey: string;
  userId: string;
}

// Define the structure of a Notion database item
interface NotionDatabaseItem {
  id: string;
  properties: Record<string, any>;
  url: string;
  created_time: string;
  last_edited_time: string;
}

// Define proper CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  // This is needed for CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Get the JWT token from the request headers
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    // Get the API keys from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    // Parse the request body
    let reqBody: RequestBody
    
    try {
      reqBody = await req.json() as RequestBody
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }
    
    // Extract necessary data from the request body
    const { notionDatabaseId, notionApiKey, userId } = reqBody
    
    // Validate required fields
    if (!notionDatabaseId || !notionApiKey || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    // Verify the user ID matches
    if (userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'User ID mismatch' }),
        { 
          status: 403, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    // Initialize the Notion client with the provided API key
    const notion = new Client({ auth: notionApiKey })
    
    // Format the database ID by removing any hyphens
    // Notion API expects IDs without hyphens
    const formattedDatabaseId = notionDatabaseId.replace(/-/g, '')
    
    console.log(`Attempting to query Notion database with ID: ${formattedDatabaseId}`)
    
    // Query the Notion database
    const response = await notion.databases.query({
      database_id: formattedDatabaseId,
    })
    
    // Process each item in the Notion database
    const syncResults = await Promise.all(
      response.results.map(async (page: NotionDatabaseItem) => {
        try {
          // Extract metadata
          const pageId = page.id
          const pageUrl = page.url
          const createdTime = page.created_time
          const lastEditedTime = page.last_edited_time
          
          // Extract page properties for mapping to Supabase fields
          const props = page.properties
          
          // Prepare the content item data
          const contentItem = {
            title: extractProperty(props, 'Name', 'title') || extractProperty(props, 'Title', 'title') || 'Untitled',
            description: extractProperty(props, 'Description', 'rich_text'),
            category: extractProperty(props, 'Category', 'select'),
            tags: extractProperty(props, 'Tags', 'multi_select'),
            created_at: createdTime,
            updated_at: lastEditedTime,
            start_date: extractProperty(props, 'Start date', 'date'),
            end_date: extractProperty(props, 'End date', 'date'),
            notion_url: pageUrl,
            user_id: userId,
            // We'll need to fetch page content separately for detailed content
            content: {} // This will be populated with page content in a production implementation
          }
          
          // Check if this item already exists in Supabase
          const { data: existingItem, error: fetchError } = await supabase
            .from('content_items')
            .select('id')
            .eq('notion_url', pageUrl)
            .eq('user_id', userId)
            .single()
          
          let operation
          
          if (existingItem) {
            // Update existing item
            const { data, error } = await supabase
              .from('content_items')
              .update(contentItem)
              .eq('id', existingItem.id)
              .select()
            
            if (error) throw error
            operation = 'updated'
            return { id: existingItem.id, title: contentItem.title, operation }
          } else {
            // Insert new item
            const { data, error } = await supabase
              .from('content_items')
              .insert(contentItem)
              .select()
            
            if (error) throw error
            operation = 'inserted'
            return { id: data?.[0]?.id, title: contentItem.title, operation }
          }
        } catch (error) {
          console.error("Error syncing page:", page.id, error)
          return { id: page.id, error: error.message, operation: 'failed' }
        }
      })
    )
    
    return new Response(
      JSON.stringify({ 
        status: 'success', 
        message: 'Notion content synced successfully', 
        results: syncResults 
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
    console.error("Sync error:", error)
    
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: error.message || 'An error occurred while syncing with Notion' 
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

// Helper function to extract properties from Notion page object based on property type
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
