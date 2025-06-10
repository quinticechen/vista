// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.5.0';
import { Client } from 'https://deno.land/x/notion_sdk/src/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Global image counter map to track images per page for webhook
const webhookImageCounterMap = new Map<string, number>();

// Get and increment image index for webhook processing
function getAndIncrementWebhookImageIndex(pageId: string): number {
  const currentCount = webhookImageCounterMap.get(pageId) || 0;
  const newCount = currentCount + 1;
  webhookImageCounterMap.set(pageId, newCount);
  return newCount;
}

// ENHANCED: Backup image to Supabase Storage for webhook
async function backupWebhookImageToStorage(
  imageUrl: string, 
  options: {
    supabase: any;
    bucketName: string;
    userId: string;
    pageId: string;
    imageIndex: number;
  }
): Promise<string | null> {
  const { supabase, bucketName, userId, pageId, imageIndex } = options;
  
  try {
    console.log(`[Webhook] Starting backup for image ${imageIndex} from page ${pageId}: ${imageUrl}`);
    
    // Skip backup if URL doesn't look like a Notion expiring URL
    if (!imageUrl || (!imageUrl.includes('notion.so') && !imageUrl.includes('amazonaws.com'))) {
      console.log(`[Webhook] Skipping backup for non-expiring URL: ${imageUrl}`);
      return imageUrl;
    }
    
    // Fetch the image from the original URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`[Webhook] Failed to fetch image: ${response.status} ${response.statusText}`);
      return imageUrl; // Return original URL if backup fails
    }
    
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Create a unique filename using page ID and image index
    const fileExtension = contentType.split('/')[1] || 'jpg';
    const fileName = `${userId}/${pageId}/image-${imageIndex}.${fileExtension}`;
    
    console.log(`[Webhook] Uploading image to storage: ${fileName}`);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, imageBuffer, {
        contentType,
        upsert: true // Overwrite if exists
      });
    
    if (error) {
      console.error('[Webhook] Storage upload error:', error);
      return imageUrl; // Return original URL if backup fails
    }
    
    // Get the public URL for the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    const backupUrl = publicUrlData.publicUrl;
    console.log(`[Webhook] Image ${imageIndex} successfully backed up to: ${backupUrl}`);
    
    return backupUrl;
  } catch (error) {
    console.error('[Webhook] Error backing up image:', error);
    return imageUrl; // Return original URL if backup fails
  }
}

// FIXED: Extract annotations with proper background color handling - Enhanced version
function extractAnnotationsSimplified(richTextArray: any[]): any[] {
  if (!richTextArray || !Array.isArray(richTextArray) || richTextArray.length === 0) {
    return [];
  }
  
  const annotations: any[] = [];
  let currentPosition = 0;
  
  for (const richText of richTextArray) {
    if (!richText || !richText.annotations) {
      currentPosition += (richText?.plain_text || "").length;
      continue;
    }
    
    const { bold, italic, strikethrough, underline, code, color } = richText.annotations;
    const textLength = (richText.plain_text || "").length;
    
    // Check if any formatting is applied, if there's a background color, or if there's a link
    const hasFormatting = bold || italic || strikethrough || underline || code;
    const hasColor = color && color !== 'default';
    const hasLink = richText.href;
    
    if (hasFormatting || hasColor || hasLink) {
      const annotation: any = {
        text: richText.plain_text,
        start: currentPosition,
        end: currentPosition + textLength,
        bold: bold || false,
        italic: italic || false,
        strikethrough: strikethrough || false,
        underline: underline || false,
        code: code || false
      };
      
      // Handle background colors properly (format: color_background)
      if (color && color !== 'default') {
        if (color.includes('_background')) {
          const baseColor = color.replace('_background', '');
          // Only add background_color if it's not default
          if (baseColor && baseColor !== 'default') {
            annotation.background_color = baseColor;
          }
        } else {
          // Regular text color
          annotation.color = color;
        }
      }
      
      // Handle links
      if (richText.href) {
        annotation.href = richText.href;
      }
      
      annotations.push(annotation);
    }
    
    currentPosition += textLength;
  }
  
  return annotations;
}

// Extract rich text content from Notion rich text array
function extractRichText(richTextArray: any[]): string {
  if (!richTextArray || !Array.isArray(richTextArray)) {
    return "";
  }
  
  return richTextArray
    .map((richText) => richText?.plain_text || "")
    .join("");
}

// ENHANCED: Process a single block with image backup for webhook
async function processBlockWithWebhook(
  block: any,
  supabase: any,
  bucketName: string,
  userId: string,
  pageId: string
): Promise<any> {
  const blockType = block.type;
  const baseBlock: any = { type: blockType };
  
  // Process specific block types with background color support
  switch (blockType) {
    case 'paragraph':
      baseBlock.text = extractRichText(block.paragraph.rich_text);
      baseBlock.annotations = extractAnnotationsSimplified(block.paragraph.rich_text);
      break;
      
    case 'heading_1':
      baseBlock.text = extractRichText(block.heading_1.rich_text);
      baseBlock.annotations = extractAnnotationsSimplified(block.heading_1.rich_text);
      break;
      
    case 'heading_2':
      baseBlock.text = extractRichText(block.heading_2.rich_text);
      baseBlock.annotations = extractAnnotationsSimplified(block.heading_2.rich_text);
      break;
      
    case 'heading_3':
      baseBlock.text = extractRichText(block.heading_3.rich_text);
      baseBlock.annotations = extractAnnotationsSimplified(block.heading_3.rich_text);
      break;
      
    case 'bulleted_list_item':
      baseBlock.text = extractRichText(block.bulleted_list_item.rich_text);
      baseBlock.is_list_item = true;
      baseBlock.list_type = 'bulleted_list';
      baseBlock.annotations = extractAnnotationsSimplified(block.bulleted_list_item.rich_text);
      break;
      
    case 'numbered_list_item':
      baseBlock.text = extractRichText(block.numbered_list_item.rich_text);
      baseBlock.is_list_item = true;
      baseBlock.list_type = 'numbered_list';
      baseBlock.annotations = extractAnnotationsSimplified(block.numbered_list_item.rich_text);
      break;
      
    case 'to_do':
      baseBlock.text = extractRichText(block.to_do.rich_text);
      baseBlock.checked = block.to_do.checked;
      baseBlock.annotations = extractAnnotationsSimplified(block.to_do.rich_text);
      break;
      
    case 'toggle':
      baseBlock.text = extractRichText(block.toggle.rich_text);
      baseBlock.annotations = extractAnnotationsSimplified(block.toggle.rich_text);
      break;
      
    case 'quote':
      baseBlock.text = extractRichText(block.quote.rich_text);
      baseBlock.annotations = extractAnnotationsSimplified(block.quote.rich_text);
      break;
      
    case 'callout':
      baseBlock.text = extractRichText(block.callout.rich_text);
      baseBlock.icon = block.callout.icon;
      baseBlock.annotations = extractAnnotationsSimplified(block.callout.rich_text);
      break;
      
    case 'code':
      baseBlock.text = extractRichText(block.code.rich_text);
      baseBlock.language = block.code.language;
      baseBlock.annotations = extractAnnotationsSimplified(block.code.rich_text);
      break;
      
    case 'image':
      // ENHANCED: Get unique image counter for this specific page and image
      const imageIndex = getAndIncrementWebhookImageIndex(pageId);
      
      baseBlock.media_type = 'image';
      
      // Get original URL
      const imageUrl = block.image.type === 'external' ? 
        block.image.external.url : 
        block.image.type === 'file' ? block.image.file.url : null;
      
      console.log(`[Webhook] Processing image ${imageIndex} for page ${pageId}: ${imageUrl}`);
      
      // Check if it's a HEIC image by examining the URL
      const isHeic = imageUrl && (
        imageUrl.toLowerCase().endsWith('.heic') || 
        imageUrl.toLowerCase().includes('/heic') || 
        imageUrl.toLowerCase().includes('heic.')
      );
      
      // Mark HEIC images
      if (isHeic) {
        baseBlock.is_heic = true;
      }
      
      // ENHANCED: Always attempt to backup the image with proper error handling
      if (imageUrl) {
        try {
          const backupUrl = await backupWebhookImageToStorage(
            imageUrl, 
            { supabase, bucketName, userId, pageId, imageIndex }
          );
          baseBlock.media_url = backupUrl || imageUrl; // Use backup URL or fallback to original
          console.log(`[Webhook] Image ${imageIndex} processed: ${baseBlock.media_url}`);
        } catch (error) {
          console.error(`[Webhook] Failed to backup image ${imageIndex}:`, error);
          baseBlock.media_url = imageUrl; // Use original URL as fallback
        }
      } else {
        baseBlock.media_url = null;
      }
      
      baseBlock.caption = block.image.caption ? extractRichText(block.image.caption) : null;
      break;
      
    case 'video':
      // For videos, we don't download them but we try to backup thumbnails if needed
      baseBlock.media_type = 'video';
      baseBlock.media_url = block.video.type === 'external' ? block.video.external.url : block.video.file.url;
      baseBlock.caption = block.video.caption ? extractRichText(block.video.caption) : null;
      break;
      
    case 'embed':
      // Handle embed blocks
      baseBlock.media_type = 'embed';
      baseBlock.media_url = block.embed.url;
      baseBlock.caption = block.embed.caption ? extractRichText(block.embed.caption) : null;
      break;
      
    case 'divider':
      // Divider needs no additional properties
      break;
      
    case 'table':
      // Table needs no additional properties
      break;
      
    case 'table_row':
      // Table row needs no additional properties
      break;
      
    default:
      if (block[blockType]?.rich_text) {
        baseBlock.text = extractRichText(block[blockType].rich_text);
        baseBlock.annotations = extractAnnotationsSimplified(block[blockType].rich_text);
      }
      break;
  }
  
  return baseBlock;
}

Deno.serve(async (req) => {
  console.log('=== Notion Webhook Request ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract user_id from URL parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    console.log('User ID from URL:', userId);

    if (!userId) {
      console.error('Missing user_id parameter');
      return new Response(
        JSON.stringify({ error: 'user_id parameter is required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    // Parse the webhook payload
    let payload;
    try {
      payload = await req.json();
      console.log('Webhook payload received:', JSON.stringify(payload, null, 2));
    } catch (parseError) {
      console.error('Failed to parse webhook payload:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    // Get the API keys from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's Notion credentials from profile
    console.log('Fetching user profile for user ID:', userId);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('notion_database_id, notion_api_key')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    const { notion_database_id: notionDatabaseId, notion_api_key: notionApiKey } = profile;
    console.log('User database ID:', notionDatabaseId);

    if (!notionDatabaseId || !notionApiKey) {
      console.error('User has not configured Notion credentials');
      return new Response(
        JSON.stringify({ error: 'User has not configured Notion credentials' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    // Check if the webhook is for the user's database
    const webhookDatabaseId = payload.data?.parent?.id;
    const formattedUserDatabaseId = notionDatabaseId.replace(/-/g, '');
    const formattedWebhookDatabaseId = webhookDatabaseId?.replace(/-/g, '');

    console.log('Comparing database IDs:');
    console.log('User database ID (formatted):', formattedUserDatabaseId);
    console.log('Webhook database ID (formatted):', formattedWebhookDatabaseId);

    if (formattedWebhookDatabaseId !== formattedUserDatabaseId) {
      console.log('Webhook is not for this user\'s database, ignoring');
      return new Response(
        JSON.stringify({ message: 'Webhook ignored - not for this user\'s database' }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    // Log webhook verification record
    try {
      await supabase
        .from('notion_webhook_verifications')
        .insert({
          verification_token: payload.id || 'unknown',
          challenge_type: payload.type || 'unknown',
          user_id: userId
        });
      console.log('Webhook verification logged successfully');
    } catch (logError) {
      console.error('Failed to log webhook verification:', logError);
      // Continue processing even if logging fails
    }

    // Process the webhook based on the event type
    if (payload.type === 'page.created' || payload.type === 'page.properties_updated' || payload.type === 'page.content_updated') {
      const pageId = payload.entity.id;
      console.log(`Processing page event: ${payload.type} for page: ${pageId}`);

      // Reset image counter for this page
      webhookImageCounterMap.delete(pageId);

      // Initialize the Notion client
      const notion = new Client({ auth: notionApiKey });

      try {
        // Fetch the page details
        console.log(`Fetching page details for: ${pageId}`);
        const page = await notion.pages.retrieve({ page_id: pageId });

        // Fetch the page blocks (content)
        console.log(`Fetching page blocks for: ${pageId}`);
        const { results: blocks } = await notion.blocks.children.list({
          block_id: pageId,
          page_size: 100,
        });

        // ENHANCED: Process blocks with reliable image backup
        const processedBlocks = await processBlocksSimplifiedWithImageBackup(
          blocks,
          notion,
          supabase,
          'notion-images',
          userId,
          pageId
        );

        // Extract properties
        const extractProperty = (properties: any, propertyName: string, propertyType: string): any => {
          const property = properties[propertyName];
          if (!property) return null;
          
          switch (propertyType) {
            case 'title':
              return property.title?.[0]?.plain_text || null;
            case 'rich_text':
              return extractRichText(property.rich_text);
            case 'select':
              return property.select?.name || null;
            case 'multi_select':
              return property.multi_select?.map((option: any) => option.name) || [];
            case 'date':
              return property.date?.start || null;
            default:
              return null;
          }
        };

        // Prepare the content item
        const contentItem = {
          title: extractProperty(page.properties, 'Name', 'title') || extractProperty(page.properties, 'Title', 'title') || 'Untitled',
          description: extractProperty(page.properties, 'Description', 'rich_text'),
          category: extractProperty(page.properties, 'Category', 'select'),
          tags: extractProperty(page.properties, 'Tags', 'multi_select'),
          created_at: page.created_time,
          updated_at: page.last_edited_time,
          start_date: extractProperty(page.properties, 'Start date', 'date'),
          end_date: extractProperty(page.properties, 'End date', 'date'),
          notion_url: page.url,
          user_id: userId,
          content: processedBlocks,
          notion_page_id: pageId,
          notion_created_time: page.created_time,
          notion_last_edited_time: page.last_edited_time,
          notion_page_status: 'active'
        };

        console.log('Prepared content item:', JSON.stringify(contentItem, null, 2));

        // Check if the content item already exists
        const { data: existingItem } = await supabase
          .from('content_items')
          .select('id')
          .eq('notion_page_id', pageId)
          .eq('user_id', userId)
          .single();

        if (existingItem) {
          // Update existing item
          const { error: updateError } = await supabase
            .from('content_items')
            .update(contentItem)
            .eq('id', existingItem.id);

          if (updateError) {
            console.error('Error updating content item:', updateError);
            throw updateError;
          }

          console.log(`Content item updated successfully: ${existingItem.id}`);
        } else {
          // Insert new item
          const { data: newItem, error: insertError } = await supabase
            .from('content_items')
            .insert(contentItem)
            .select();

          if (insertError) {
            console.error('Error inserting content item:', insertError);
            throw insertError;
          }

          console.log(`Content item created successfully: ${newItem?.[0]?.id}`);
        }
      } catch (notionError) {
        console.error('Error processing Notion content:', notionError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to process Notion content',
            message: notionError.message 
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
    } else {
      console.log(`Unhandled webhook event type: ${payload.type}`);
    }

    console.log('Webhook processed successfully');
    return new Response(
      JSON.stringify({ message: 'Webhook processed successfully' }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process webhook',
        message: error.message,
        stack: error.stack
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
});

// ENHANCED: Process blocks recursively with image backup and background color support
async function processBlocksSimplifiedWithImageBackup(
  blocks: any[],
  notionClient: any,
  supabase: any,
  bucketName: string,
  userId: string,
  pageId?: string
): Promise<any[]> {
  const processedBlocks = [];
  
  for (const block of blocks) {
    const currentPageId = pageId || block.id;
    
    // Process the current block based on its type with simplified format
    const processedBlock = await processBlockWithWebhook(
      block, 
      supabase, 
      bucketName, 
      userId, 
      currentPageId
    );
    
    // Check if block has children
    if (block.has_children) {
      try {
        const { results: childBlocks } = await notionClient.blocks.children.list({
          block_id: block.id,
          page_size: 100,
        });
        
        const processedChildren = await processBlocksSimplifiedWithImageBackup(
          childBlocks, 
          notionClient, 
          supabase, 
          bucketName, 
          userId, 
          currentPageId
        );
        
        processedBlock.children = processedChildren;
      } catch (error) {
        console.error(`Error fetching children for block ${block.id}:`, error);
        processedBlock.children = [];
      }
    }
    
    processedBlocks.push(processedBlock);
  }
  
  return processedBlocks;
}
