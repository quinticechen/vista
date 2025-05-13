
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
          
          // Fetch the page blocks (content)
          console.log(`Fetching blocks for page: ${pageId}`)
          const { results: blocks } = await notion.blocks.children.list({
            block_id: pageId,
            page_size: 100, // Fetch up to 100 blocks
          })
          
          // Process blocks recursively to include children
          const processedBlocks = await processBlocks(blocks, notion)
          
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
            content: processedBlocks
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

// Process blocks recursively to capture nested structure
async function processBlocks(blocks: any[], notionClient: Client): Promise<any[]> {
  const processedBlocks = []
  
  for (const block of blocks) {
    // Process the current block based on its type
    const processedBlock = processBlock(block)
    
    // Check if block has children
    if (block.has_children) {
      try {
        // Fetch child blocks
        const { results: childBlocks } = await notionClient.blocks.children.list({
          block_id: block.id,
          page_size: 100,
        })
        
        // Process child blocks recursively
        const processedChildren = await processBlocks(childBlocks, notionClient)
        
        // Add children to the processed block
        processedBlock.children = processedChildren
      } catch (error) {
        console.error(`Error fetching children for block ${block.id}:`, error)
        processedBlock.children = []
      }
    }
    
    processedBlocks.push(processedBlock)
  }
  
  return processedBlocks
}

// Process a single block
function processBlock(block: any): any {
  // Basic block data
  const baseBlock = {
    id: block.id,
    type: block.type,
    created_time: block.created_time,
    last_edited_time: block.last_edited_time,
  }
  
  // Process the block content based on its type
  switch (block.type) {
    case 'paragraph':
      return {
        ...baseBlock,
        text: extractRichText(block.paragraph.rich_text),
        annotations: extractAnnotations(block.paragraph.rich_text),
      }
    case 'heading_1':
      return {
        ...baseBlock,
        text: extractRichText(block.heading_1.rich_text),
        annotations: extractAnnotations(block.heading_1.rich_text),
      }
    case 'heading_2':
      return {
        ...baseBlock,
        text: extractRichText(block.heading_2.rich_text),
        annotations: extractAnnotations(block.heading_2.rich_text),
      }
    case 'heading_3':
      return {
        ...baseBlock,
        text: extractRichText(block.heading_3.rich_text),
        annotations: extractAnnotations(block.heading_3.rich_text),
      }
    case 'bulleted_list_item':
      return {
        ...baseBlock,
        text: extractRichText(block.bulleted_list_item.rich_text),
        annotations: extractAnnotations(block.bulleted_list_item.rich_text),
      }
    case 'numbered_list_item':
      return {
        ...baseBlock,
        text: extractRichText(block.numbered_list_item.rich_text),
        annotations: extractAnnotations(block.numbered_list_item.rich_text),
      }
    case 'to_do':
      return {
        ...baseBlock,
        text: extractRichText(block.to_do.rich_text),
        checked: block.to_do.checked,
        annotations: extractAnnotations(block.to_do.rich_text),
      }
    case 'toggle':
      return {
        ...baseBlock,
        text: extractRichText(block.toggle.rich_text),
        annotations: extractAnnotations(block.toggle.rich_text),
      }
    case 'quote':
      return {
        ...baseBlock,
        text: extractRichText(block.quote.rich_text),
        annotations: extractAnnotations(block.quote.rich_text),
      }
    case 'callout':
      return {
        ...baseBlock,
        text: extractRichText(block.callout.rich_text),
        icon: block.callout.icon,
        annotations: extractAnnotations(block.callout.rich_text),
      }
    case 'code':
      return {
        ...baseBlock,
        text: extractRichText(block.code.rich_text),
        language: block.code.language,
        annotations: extractAnnotations(block.code.rich_text),
      }
    case 'image':
      return {
        ...baseBlock,
        url: block.image.type === 'external' ? block.image.external.url : 
             block.image.type === 'file' ? block.image.file.url : null,
        caption: block.image.caption ? extractRichText(block.image.caption) : null,
      }
    case 'video':
      return {
        ...baseBlock,
        url: block.video.type === 'external' ? block.video.external.url : 
             block.video.type === 'file' ? block.video.file.url : null,
        caption: block.video.caption ? extractRichText(block.video.caption) : null,
      }
    case 'divider':
      return {
        ...baseBlock,
      }
    case 'table':
      return {
        ...baseBlock,
        table_width: block.table.table_width,
        has_row_header: block.table.has_row_header,
        has_column_header: block.table.has_column_header,
      }
    case 'column_list':
      return {
        ...baseBlock,
      }
    case 'column':
      return {
        ...baseBlock,
      }
    case 'equation':
      return {
        ...baseBlock,
        expression: block.equation.expression,
      }
    default:
      return {
        ...baseBlock,
        unsupported: true,
      }
  }
}

// Helper function to extract text content from rich_text arrays
function extractRichText(richText: any[]): string {
  if (!richText || richText.length === 0) return ''
  return richText.map(rt => rt.plain_text).join('')
}

// Helper function to extract annotations from rich_text arrays
function extractAnnotations(richText: any[]): any[] {
  if (!richText || richText.length === 0) return []
  
  return richText.map(rt => {
    if (!rt.annotations) return null
    
    return {
      bold: rt.annotations.bold,
      italic: rt.annotations.italic,
      strikethrough: rt.annotations.strikethrough,
      underline: rt.annotations.underline,
      code: rt.annotations.code,
      color: rt.annotations.color,
      text: rt.plain_text,
      href: rt.href, // For links
    }
  }).filter(Boolean)
}
