
import { Client } from 'https://deno.land/x/notion_sdk/src/mod.ts';
import { backupImageToStorage, extractAnnotationsSimplified, extractRichText, getAndIncrementImageIndex } from './utils.ts';

// Process a single block with image backup
export async function processBlockWithImageBackup(
  block: any,
  supabase: any,
  bucketName: string,
  userId: string,
  pageId: string
): Promise<any> {
  // Get the block type
  const blockType = block.type;
  
  // Base block for the simplified format
  const baseBlock: any = {
    type: blockType,
  };
  
  // Process specific block types
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
      // Backup image if it's a Notion expiring URL
      baseBlock.media_type = 'image';
      
      // Get original URL
      const imageUrl = block.image.type === 'external' ? 
        block.image.external.url : 
        block.image.type === 'file' ? block.image.file.url : null;
      
      // Get the image counter for this page for generating unique filenames
      const imageIndex = getAndIncrementImageIndex(pageId);
      
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
      
      // Try to extract image dimensions if available
      if (block.image.width && block.image.height) {
        baseBlock.width = block.image.width;
        baseBlock.height = block.image.height;
        baseBlock.aspect_ratio = block.image.width / block.image.height;
      }
      
      // Backup the image if it's an expiring URL, using the image index
      if (imageUrl) {
        baseBlock.media_url = await backupImageToStorage(
          imageUrl, 
          { supabase, bucketName, userId, pageId, imageIndex }
        );
      } else {
        baseBlock.media_url = null;
      }
      
      baseBlock.caption = block.image.caption ? extractRichText(block.image.caption) : null;
      break;
      
    case 'video':
      // For videos, we don't download them but we try to backup thumbnails if needed
      baseBlock.media_type = 'video';
      
      // We keep the original video URL as-is
      baseBlock.media_url = block.video.type === 'external' ? 
        block.video.external.url : 
        block.video.type === 'file' ? block.video.file.url : null;
        
      baseBlock.caption = block.video.caption ? extractRichText(block.video.caption) : null;
      
      // If this is a YouTube video, we don't need to back it up
      if (baseBlock.media_url && 
        !baseBlock.media_url.includes('youtube.com') && 
        !baseBlock.media_url.includes('youtu.be')) {
        console.log('Non-YouTube video found in Notion block - keeping original URL');
      }
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
      baseBlock.table_width = block.table.table_width;
      baseBlock.has_row_header = block.table.has_row_header;
      baseBlock.has_column_header = block.table.has_column_header;
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

// Process blocks recursively with image backup
export async function processBlocksSimplifiedWithImageBackup(
  blocks: any[],
  notionClient: Client,
  supabase: any,
  bucketName: string,
  userId: string,
  pageId?: string
): Promise<any[]> {
  const processedBlocks = [];
  
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
        });
        
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
