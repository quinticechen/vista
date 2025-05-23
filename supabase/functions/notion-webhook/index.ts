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
    
    // Process blocks recursively to include children
    const processBlocks = async function(blocks, notionClient) {
      const processedBlocks = [];
      
      for (const block of blocks) {
        // Process the current block based on its type
        const processedBlock = processBlock(block);
        
        // Check if block has children
        if (block.has_children) {
          try {
            // Fetch child blocks
            const { results: childBlocks } = await notionClient.blocks.children.list({
              block_id: block.id,
              page_size: 100,
            });
            
            // Process child blocks recursively
            const processedChildren = await processBlocks(childBlocks, notionClient);
            
            // Add children to the processed block
            processedBlock.children = processedChildren;
          } catch (error) {
            console.error(`Error fetching children for block ${block.id}:`, error);
            processedBlock.children = [];
          }
        }
        
        processedBlocks.push(processedBlock);
      }
      
      return processedBlocks;
    };
    
    // Fetch the page blocks (content)
    const { results: blocks } = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100, // Fetch up to 100 blocks
    })
    
    // Process blocks recursively to capture nested structure
    const processedBlocks = await processBlocks(blocks, notion)
    
    // Update the content item in our database
    const updatedContentItem = {
      title: extractProperty(props, 'Name', 'title') || extractProperty(props, 'Title', 'title') || 'Untitled',
      description: extractProperty(props, 'Description', 'rich_text'),
      category: extractProperty(props, 'Category', 'select'),
      tags: extractProperty(props, 'Tags', 'multi_select'),
      updated_at: page.last_edited_time,
      start_date: extractProperty(props, 'Start date', 'date'),
      end_date: extractProperty(props, 'End date', 'date'),
      content: processedBlocks
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

// Process a single block
function processBlock(block) {
  // Basic block data
  const baseBlock = {
    id: block.id,
    type: block.type,
    created_time: block.created_time,
    last_edited_time: block.last_edited_time,
  };
  
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
      const imageUrl = block.image.type === 'external' ? block.image.external.url : 
                     block.image.type === 'file' ? block.image.file.url : null;
      
      // Check if it's a HEIC image by examining the URL
      const isHeic = imageUrl && (
        imageUrl.toLowerCase().endsWith('.heic') || 
        imageUrl.toLowerCase().includes('/heic') || 
        imageUrl.toLowerCase().includes('heic.')
      );
      
      return {
        ...baseBlock,
        url: imageUrl,
        is_heic: isHeic, // Mark HEIC images
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
