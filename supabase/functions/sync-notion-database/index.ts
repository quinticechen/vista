
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
    
    // Check if notion-images bucket exists, create it if not
    const { data: existingBuckets } = await supabase.storage.listBuckets()
    const notionImagesBucket = 'notion-images'
    const bucketExists = existingBuckets?.some(bucket => bucket.name === notionImagesBucket)
    
    if (!bucketExists) {
      // Create a public bucket for storing Notion images
      await supabase.storage.createBucket(notionImagesBucket, {
        public: true, // Make it public so images are accessible
        fileSizeLimit: 10485760, // 10MB limit
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
      })
    }
    
    // First, get all content items for this user with Notion page IDs to track existing pages
    const { data: existingContentItems } = await supabase
      .from('content_items')
      .select('id, notion_page_id, notion_url')
      .eq('user_id', userId)
      .not('notion_page_id', 'is', null);
    
    // Create a map of existing notion page IDs to content item IDs
    const existingPageMap = new Map<string, string>();
    if (existingContentItems) {
      existingContentItems.forEach(item => {
        if (item.notion_page_id) {
          existingPageMap.set(item.notion_page_id, item.id);
        }
      });
    }
    
    // Keep track of page IDs that we process from the Notion database
    const processedPageIds = new Set<string>();
    
    // Process each item in the Notion database
    const syncResults = await Promise.all(
      response.results.map(async (page: NotionDatabaseItem) => {
        try {
          // Extract metadata
          const pageId = page.id;
          processedPageIds.add(pageId);
          
          const pageUrl = page.url;
          const createdTime = page.created_time;
          const lastEditedTime = page.last_edited_time;
          
          // Extract page properties for mapping to Supabase fields
          const props = page.properties;
          
          // Fetch the page blocks (content)
          console.log(`Fetching blocks for page: ${pageId}`);
          const { results: blocks } = await notion.blocks.children.list({
            block_id: pageId,
            page_size: 100, // Fetch up to 100 blocks
          });
          
          // Process blocks recursively to include children (with the new simplified format)
          // Also backup and replace image URLs
          const processedBlocks = await processBlocksSimplifiedWithImageBackup(
            blocks, 
            notion, 
            supabase, 
            notionImagesBucket, 
            userId,
            pageId
          );
          
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
            content: processedBlocks,
            notion_page_id: pageId,
            notion_created_time: createdTime,
            notion_last_edited_time: lastEditedTime,
            notion_page_status: 'active'
          };
          
          // Check if this item exists in our map of existing Notion pages
          const existingItemId = existingPageMap.get(pageId);
          let operation;
          
          if (existingItemId) {
            // Update existing item
            const { data, error } = await supabase
              .from('content_items')
              .update(contentItem)
              .eq('id', existingItemId)
              .select();
            
            if (error) throw error;
            operation = 'updated';
            return { id: existingItemId, title: contentItem.title, operation };
          } else {
            // Insert new item
            const { data, error } = await supabase
              .from('content_items')
              .insert(contentItem)
              .select();
            
            if (error) throw error;
            operation = 'inserted';
            return { id: data?.[0]?.id, title: contentItem.title, operation };
          }
        } catch (error) {
          console.error("Error syncing page:", page.id, error);
          return { id: page.id, error: error.message, operation: 'failed' };
        }
      })
    );
    
    // Find and mark as removed any pages that exist in Supabase but no longer exist in Notion
    const removedPages = [];
    if (existingContentItems) {
      for (const item of existingContentItems) {
        if (item.notion_page_id && !processedPageIds.has(item.notion_page_id)) {
          // This page exists in Supabase but was not found in the Notion database
          try {
            const { data, error } = await supabase
              .from('content_items')
              .update({ notion_page_status: 'removed' })
              .eq('id', item.id)
              .select();
              
            if (error) throw error;
            removedPages.push({
              id: item.id,
              title: data?.[0]?.title || 'Unknown',
              operation: 'marked as removed'
            });
          } catch (error) {
            console.error("Error marking page as removed:", item.id, error);
            removedPages.push({
              id: item.id,
              error: error.message,
              operation: 'failed to mark as removed'
            });
          }
        }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        status: 'success', 
        message: 'Notion content synced successfully', 
        results: syncResults,
        removedPages: removedPages 
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    console.error("Sync error:", error);
    
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
    );
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

// Function to check if a URL is a Notion asset URL that might expire
function isExpiringAssetUrl(url: string): boolean {
  if (!url) return false
  
  // Check for signatures of expiring URLs
  return (
    url.includes('s3.') && 
    (url.includes('amazonaws.com') || url.includes('X-Amz-')) ||
    (url.includes('file.notion.so') && url.includes('secure='))
  )
}

// Generate a filename for storage from an image URL
function generateImageFilename(imageUrl: string, pageId: string, index: number): string {
  // Extract original filename if available
  let filename = '';
  try {
    const urlObj = new URL(imageUrl);
    const pathname = urlObj.pathname;
    const pathParts = pathname.split('/');
    const originalFilename = pathParts[pathParts.length - 1];
    
    // Clean up any query parameters
    const filenameParts = originalFilename.split('?');
    filename = filenameParts[0];
    
    // If we couldn't extract a meaningful filename, generate one
    if (!filename || filename.length < 5) {
      throw new Error('Invalid filename');
    }
  } catch (error) {
    // Generate a filename with page ID, timestamp, and image index
    const timestamp = Date.now();
    const extension = imageUrl.match(/\.(jpe?g|png|gif|webp)/i) 
      ? imageUrl.match(/\.(jpe?g|png|gif|webp)/i)![0]
      : '.jpg';
    
    filename = `notion-${pageId.substring(0, 8)}-${timestamp}-${index}${extension}`;
  }
  
  return filename;
}

// Download an image from a URL and upload it to Supabase Storage
async function backupImageToStorage(
  imageUrl: string,
  supabase: any,
  bucketName: string,
  userId: string,
  pageId: string,
  imageIndex: number
): Promise<string | null> {
  try {
    // Skip if not an expiring asset URL
    if (!isExpiringAssetUrl(imageUrl)) {
      return imageUrl;
    }
    
    // Generate a unique filename for storage that includes the image index
    const filename = generateImageFilename(imageUrl, pageId, imageIndex);
    const filePath = `${userId}/${pageId}/${filename}`;
    
    // Check if file already exists in storage - using more specific search
    const { data: existingFiles } = await supabase.storage
      .from(bucketName)
      .list(`${userId}/${pageId}`, {
        search: filename
      });
    
    if (existingFiles && existingFiles.length > 0) {
      // File exists, return the public URL
      const { data: publicUrl } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      console.log(`Using existing image file: ${filename}`);
      return publicUrl.publicUrl;
    }
    
    // Download the image from the URL
    console.log(`Downloading image from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    
    // Get the image binary data
    const imageBlob = await imageResponse.blob();
    
    // Upload the image to Supabase Storage
    console.log(`Uploading image to: ${bucketName}/${filePath}`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, imageBlob, {
        contentType: imageBlob.type,
        upsert: true
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL for the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    console.log(`Image backed up successfully: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error backing up image:", error);
    // If backup fails, return the original URL
    return imageUrl;
  }
}

// Track image counts per page
const pageImageCounts = new Map<string, number>();

// Process blocks recursively with image backup
async function processBlocksSimplifiedWithImageBackup(
  blocks: any[],
  notionClient: Client,
  supabase: any,
  bucketName: string,
  userId: string,
  pageId?: string
): Promise<any[]> {
  const processedBlocks = []
  
  // Initialize image count for this page if not already done
  if (pageId && !pageImageCounts.has(pageId)) {
    pageImageCounts.set(pageId, 0);
  }
  
  for (const block of blocks) {
    // Use block ID as pageId if not provided
    const currentPageId = pageId || block.id;
    
    // Process the current block based on its type with simplified format
    const processedBlock = await processBlockWithImageBackup(
      block, 
      supabase, 
      bucketName, 
      userId, 
      currentPageId
    );
    
    // Check if block has children
    if (block.has_children) {
      try {
        // Fetch child blocks
        const { results: childBlocks } = await notionClient.blocks.children.list({
          block_id: block.id,
          page_size: 100,
        })
        
        // Process child blocks recursively
        const processedChildren = await processBlocksSimplifiedWithImageBackup(
          childBlocks, 
          notionClient, 
          supabase, 
          bucketName, 
          userId, 
          currentPageId
        );
        
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

// Process a single block with image backup
async function processBlockWithImageBackup(
  block: any,
  supabase: any,
  bucketName: string,
  userId: string,
  pageId: string
): Promise<any> {
  // Get the block type
  const blockType = block.type
  
  // Base block for the simplified format
  const baseBlock: any = {
    type: blockType,
  }
  
  // Process specific block types
  switch (blockType) {
    case 'paragraph':
      baseBlock.text = extractRichText(block.paragraph.rich_text)
      baseBlock.annotations = extractAnnotationsSimplified(block.paragraph.rich_text)
      break
      
    case 'heading_1':
      baseBlock.text = extractRichText(block.heading_1.rich_text)
      baseBlock.annotations = extractAnnotationsSimplified(block.heading_1.rich_text)
      break
      
    case 'heading_2':
      baseBlock.text = extractRichText(block.heading_2.rich_text)
      baseBlock.annotations = extractAnnotationsSimplified(block.heading_2.rich_text)
      break
      
    case 'heading_3':
      baseBlock.text = extractRichText(block.heading_3.rich_text)
      baseBlock.annotations = extractAnnotationsSimplified(block.heading_3.rich_text)
      break
      
    case 'bulleted_list_item':
      baseBlock.text = extractRichText(block.bulleted_list_item.rich_text)
      baseBlock.is_list_item = true
      baseBlock.list_type = 'bulleted_list'
      baseBlock.annotations = extractAnnotationsSimplified(block.bulleted_list_item.rich_text)
      break
      
    case 'numbered_list_item':
      baseBlock.text = extractRichText(block.numbered_list_item.rich_text)
      baseBlock.is_list_item = true
      baseBlock.list_type = 'numbered_list'
      baseBlock.annotations = extractAnnotationsSimplified(block.numbered_list_item.rich_text)
      break
      
    case 'to_do':
      baseBlock.text = extractRichText(block.to_do.rich_text)
      baseBlock.checked = block.to_do.checked
      baseBlock.annotations = extractAnnotationsSimplified(block.to_do.rich_text)
      break
      
    case 'toggle':
      baseBlock.text = extractRichText(block.toggle.rich_text)
      baseBlock.annotations = extractAnnotationsSimplified(block.toggle.rich_text)
      break
      
    case 'quote':
      baseBlock.text = extractRichText(block.quote.rich_text)
      baseBlock.annotations = extractAnnotationsSimplified(block.quote.rich_text)
      break
      
    case 'callout':
      baseBlock.text = extractRichText(block.callout.rich_text)
      baseBlock.icon = block.callout.icon
      baseBlock.annotations = extractAnnotationsSimplified(block.callout.rich_text)
      break
      
    case 'code':
      baseBlock.text = extractRichText(block.code.rich_text)
      baseBlock.language = block.code.language
      baseBlock.annotations = extractAnnotationsSimplified(block.code.rich_text)
      break
      
    case 'image':
      // Backup image if it's a Notion expiring URL
      baseBlock.media_type = 'image'
      
      // Get original URL
      const imageUrl = block.image.type === 'external' ? 
        block.image.external.url : 
        block.image.type === 'file' ? block.image.file.url : null
      
      // Increment the image counter for this page before processing
      const imageIndex = pageImageCounts.get(pageId) || 0;
      pageImageCounts.set(pageId, imageIndex + 1);
      
      // Backup the image if it's an expiring URL, using the image index
      if (imageUrl) {
        baseBlock.media_url = await backupImageToStorage(
          imageUrl, 
          supabase, 
          bucketName, 
          userId, 
          pageId,
          imageIndex
        )
      } else {
        baseBlock.media_url = null
      }
      
      baseBlock.caption = block.image.caption ? extractRichText(block.image.caption) : null
      break
      
    case 'video':
      // For videos, we don't download them but we try to backup thumbnails if needed
      baseBlock.media_type = 'video'
      
      // We keep the original video URL as-is
      baseBlock.media_url = block.video.type === 'external' ? 
        block.video.external.url : 
        block.video.type === 'file' ? block.video.file.url : null
        
      baseBlock.caption = block.video.caption ? extractRichText(block.video.caption) : null
      
      // If this is a YouTube video, we don't need to back it up
      if (baseBlock.media_url && 
        !baseBlock.media_url.includes('youtube.com') && 
        !baseBlock.media_url.includes('youtu.be')) {
        console.log('Non-YouTube video found in Notion block - keeping original URL')
      }
      break
      
    case 'embed':
      // Handle embed blocks
      baseBlock.media_type = 'embed'
      baseBlock.media_url = block.embed.url
      baseBlock.caption = block.embed.caption ? extractRichText(block.embed.caption) : null
      break
      
    case 'divider':
      // Divider needs no additional properties
      break
      
    case 'table':
      baseBlock.table_width = block.table.table_width
      baseBlock.has_row_header = block.table.has_row_header
      baseBlock.has_column_header = block.table.has_column_header
      break
      
    default:
      if (block[blockType]?.rich_text) {
        baseBlock.text = extractRichText(block[blockType].rich_text)
        baseBlock.annotations = extractAnnotationsSimplified(block[blockType].rich_text)
      }
      break
  }
  
  return baseBlock
}

// Helper function to extract text content from rich_text arrays
function extractRichText(richText: any[]): string {
  if (!richText || richText.length === 0) return ''
  return richText.map(rt => rt.plain_text).join('')
}

// Helper function to extract simplified annotations from rich_text arrays
function extractAnnotationsSimplified(richText: any[]): any[] {
  if (!richText || richText.length === 0) return []
  
  const annotations = []
  
  // Process each rich text segment
  for (const rt of richText) {
    if (!rt || !rt.annotations) continue
    
    const {
      bold, italic, strikethrough, underline, code, color
    } = rt.annotations
    
    // Only create an annotation if there's formatting applied
    if (bold || italic || strikethrough || underline || code || (color && color !== 'default') || rt.href) {
      annotations.push({
        text: rt.plain_text,
        start: annotations.length > 0 ? annotations[annotations.length-1].end : 0,
        end: (annotations.length > 0 ? annotations[annotations.length-1].end : 0) + rt.plain_text.length,
        bold,
        italic,
        strikethrough,
        underline,
        code,
        color: color !== 'default' ? color : undefined,
        href: rt.href || undefined
      })
    }
  }
  
  return annotations
}
