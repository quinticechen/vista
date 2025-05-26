
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

// Define verification request structure
interface VerificationRequest {
  type: 'url_verification';
  challenge: string;
}

// Define webhook event structure
interface WebhookEvent {
  object: 'event';
  event_type: string;
  page?: {
    id: string;
  };
  workspace?: {
    id: string;
  };
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
    const payload = await req.json()
    console.log("Received webhook from Notion:", JSON.stringify(payload))
    
    // Get the Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Handle verification challenge
    if (payload.type === 'url_verification') {
      console.log("Handling verification challenge:", payload.challenge)
      
      // Store the verification token for all users (since we don't know which user is setting up the webhook)
      // We'll store it with a generic identifier and let the frontend filter by user context
      const { error: insertError } = await supabase
        .from('notion_webhook_verifications')
        .insert({
          verification_token: payload.challenge,
          challenge_type: 'url_verification',
          received_at: new Date().toISOString()
        })
      
      if (insertError) {
        console.error("Error storing verification token:", insertError)
      } else {
        console.log("Verification token stored successfully")
      }
      
      return new Response(
        JSON.stringify({ challenge: payload.challenge }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }
    
    // Validate the webhook payload for actual events
    if (!payload || !payload.page || !payload.page.id) {
      console.log("Invalid webhook payload - missing page information")
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
    
    // Image counter for consistent backup naming (matching sync-notion-database)
    let imageCounter = 0;
    const getAndIncrementImageIndex = () => imageCounter++;
    
    // Backup image function (consistent with sync-notion-database)
    const backupImageToStorage = async (imageUrl: string, options: {
      supabase: any,
      bucketName: string,
      userId: string,
      pageId: string,
      imageIndex: number
    }) => {
      try {
        console.log(`Processing image ${options.imageIndex} for page ${options.pageId}: ${imageUrl}`);
        
        // Download the image
        console.log(`Downloading image from: ${imageUrl}`);
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        
        const imageBuffer = await response.arrayBuffer();
        const fileName = imageUrl.split('/').pop() || `image-${options.imageIndex}`;
        const fileExtension = fileName.split('.').pop() || 'jpg';
        const storagePath = `${options.bucketName}/${options.userId}/${options.pageId}/${fileName}`;
        
        console.log(`Uploading image to: ${storagePath}`);
        
        // Upload to Supabase storage
        const { data, error } = await options.supabase.storage
          .from(options.bucketName)
          .upload(storagePath, imageBuffer, {
            contentType: `image/${fileExtension}`,
            upsert: true
          });
        
        if (error) {
          console.error("Error backing up image:", error);
          return imageUrl; // Return original URL as fallback
        }
        
        // Get the public URL
        const { data: publicUrlData } = options.supabase.storage
          .from(options.bucketName)
          .getPublicUrl(storagePath);
        
        const backupUrl = publicUrlData.publicUrl;
        console.log(`Image ${options.imageIndex} backed up to: ${backupUrl}`);
        return backupUrl;
        
      } catch (error) {
        console.error("Error backing up image:", error);
        return imageUrl; // Return original URL as fallback
      }
    };
    
    // Process blocks recursively (identical to sync-notion-database logic)
    const processBlocks = async function(blocks: any[], notionClient: any) {
      const processedBlocks = [];
      
      for (const block of blocks) {
        // Process the current block based on its type
        const processedBlock = await processBlock(block, notionClient);
        
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
    
    // Process a single block (identical to sync-notion-database logic)
    const processBlock = async (block: any, notionClient?: any) => {
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
            annotations: extractAnnotationsSimplified(block.paragraph.rich_text),
          }
        case 'heading_1':
          return {
            ...baseBlock,
            text: extractRichText(block.heading_1.rich_text),
            annotations: extractAnnotationsSimplified(block.heading_1.rich_text),
          }
        case 'heading_2':
          return {
            ...baseBlock,
            text: extractRichText(block.heading_2.rich_text),
            annotations: extractAnnotationsSimplified(block.heading_2.rich_text),
          }
        case 'heading_3':
          return {
            ...baseBlock,
            text: extractRichText(block.heading_3.rich_text),
            annotations: extractAnnotationsSimplified(block.heading_3.rich_text),
          }
        case 'bulleted_list_item':
          return {
            ...baseBlock,
            text: extractRichText(block.bulleted_list_item.rich_text),
            annotations: extractAnnotationsSimplified(block.bulleted_list_item.rich_text),
          }
        case 'numbered_list_item':
          return {
            ...baseBlock,
            text: extractRichText(block.numbered_list_item.rich_text),
            annotations: extractAnnotationsSimplified(block.numbered_list_item.rich_text),
          }
        case 'to_do':
          return {
            ...baseBlock,
            text: extractRichText(block.to_do.rich_text),
            checked: block.to_do.checked,
            annotations: extractAnnotationsSimplified(block.to_do.rich_text),
          }
        case 'toggle':
          return {
            ...baseBlock,
            text: extractRichText(block.toggle.rich_text),
            annotations: extractAnnotationsSimplified(block.toggle.rich_text),
          }
        case 'quote':
          return {
            ...baseBlock,
            text: extractRichText(block.quote.rich_text),
            annotations: extractAnnotationsSimplified(block.quote.rich_text),
          }
        case 'callout':
          return {
            ...baseBlock,
            text: extractRichText(block.callout.rich_text),
            icon: block.callout.icon,
            annotations: extractAnnotationsSimplified(block.callout.rich_text),
          }
        case 'code':
          return {
            ...baseBlock,
            text: extractRichText(block.code.rich_text),
            language: block.code.language,
            annotations: extractAnnotationsSimplified(block.code.rich_text),
          }
        case 'image':
          const imageUrl = block.image.type === 'external' ? block.image.external.url : 
                         block.image.type === 'file' ? block.image.file.url : null;
          
          if (imageUrl) {
            const imageIndex = getAndIncrementImageIndex();
            console.log(`Page ${pageId}: Image index ${imageIndex} assigned`);
            
            const backupUrl = await backupImageToStorage(imageUrl, {
              supabase,
              bucketName: 'notion-images',
              userId: contentItem.user_id,
              pageId,
              imageIndex
            });
            
            return {
              ...baseBlock,
              url: backupUrl,
              caption: block.image.caption ? extractRichText(block.image.caption) : null,
            }
          }
          
          return {
            ...baseBlock,
            url: null,
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
        default:
          return {
            ...baseBlock,
            unsupported: true,
          }
      }
    };
    
    // Fetch the page blocks (content)
    const { results: blocks } = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100, // Fetch up to 100 blocks
    })
    
    // Process blocks recursively to capture nested structure
    const processedBlocks = await processBlocks(blocks, notion)
    
    // Update the content item in our database (identical format to sync-notion-database)
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

// Helper function to extract properties from Notion page (identical to sync-notion-database)
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

// Helper function to extract text content from rich_text arrays (identical to sync-notion-database)
function extractRichText(richText: any[]): string {
  if (!richText || richText.length === 0) return ''
  return richText.map(rt => rt.plain_text).join('')
}

// Fixed annotation extraction function (identical to sync-notion-database)
function extractAnnotationsSimplified(richText: any[]): any[] {
  if (!richText || richText.length === 0) return []
  
  const annotations = []
  let currentPosition = 0
  
  // Process each rich text segment
  for (const rt of richText) {
    if (!rt || !rt.annotations) {
      currentPosition += rt.plain_text.length
      continue
    }
    
    const {
      bold, italic, strikethrough, underline, code, color
    } = rt.annotations
    
    // Only create an annotation if there's formatting applied
    if (bold || italic || strikethrough || underline || code || (color && color !== 'default') || rt.href) {
      annotations.push({
        text: rt.plain_text,
        start: currentPosition,
        end: currentPosition + rt.plain_text.length,
        bold,
        italic,
        strikethrough,
        underline,
        code,
        color: color !== 'default' ? color : undefined,
        href: rt.href || undefined
      })
    }
    
    currentPosition += rt.plain_text.length
  }
  
  return annotations
}
