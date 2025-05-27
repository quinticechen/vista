
import { Client } from 'https://deno.land/x/notion_sdk/src/mod.ts';
import { ImageBackupOptions } from './types.ts';

// Counter for tracking image counts per page to ensure unique filenames
const pageImageCounts = new Map<string, number>();

// Helper function to extract properties from Notion page object based on property type
export function extractProperty(props: Record<string, any>, propertyName: string, propertyType: string): any {
  if (!props || !propertyName) return null;
  
  // Try to find the property (case-insensitive)
  const property = Object.entries(props).find(([key]) => 
    key.toLowerCase() === propertyName.toLowerCase()
  );
  
  if (!property) return null;
  
  const [_, value] = property;
  
  switch (propertyType) {
    case 'title':
      return value.title?.[0]?.plain_text || null;
    case 'rich_text':
      return value.rich_text?.[0]?.plain_text || null;
    case 'select':
      return value.select?.name || null;
    case 'multi_select':
      return value.multi_select?.map(item => item.name) || [];
    case 'date':
      return value.date?.start || null;
    default:
      return null;
  }
}

// Helper function to check if a URL is a Notion asset URL that might expire
export function isExpiringAssetUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for signatures of expiring URLs
  return (
    url.includes('s3.') && 
    (url.includes('amazonaws.com') || url.includes('X-Amz-')) ||
    (url.includes('file.notion.so') && url.includes('secure='))
  );
}

// Generate a filename for storage from an image URL
export function generateImageFilename(imageUrl: string, pageId: string, index: number): string {
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
export async function backupImageToStorage(
  imageUrl: string,
  options: ImageBackupOptions
): Promise<string | null> {
  const { supabase, bucketName, userId, pageId, imageIndex } = options;
  
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

// Helper function to extract text content from rich_text arrays
export function extractRichText(richText: any[]): string {
  if (!richText || richText.length === 0) return '';
  return richText.map(rt => rt.plain_text).join('');
}

// FIXED: Helper function to extract enhanced annotations with proper background color handling
export function extractAnnotationsSimplified(richText: any[]): any[] {
  if (!richText || richText.length === 0) return [];
  
  const annotations = [];
  let currentPosition = 0;
  
  // Process each rich text segment
  for (const rt of richText) {
    if (!rt || !rt.annotations) {
      // Even if no annotations, we need to advance the position
      currentPosition += (rt.plain_text || '').length;
      continue;
    }
    
    const {
      bold, italic, strikethrough, underline, code, color
    } = rt.annotations;
    
    // Only create an annotation if there's formatting applied
    if (bold || italic || strikethrough || underline || code || (color && color !== 'default') || rt.href) {
      const textLength = (rt.plain_text || '').length;
      const annotation: any = {
        text: rt.plain_text,
        start: currentPosition,
        end: currentPosition + textLength,
        bold,
        italic,
        strikethrough,
        underline,
        code,
        href: rt.href || undefined
      };
      
      // FIXED: Handle background colors properly (format: color_background)
      if (color && color !== 'default') {
        if (color.includes('_background')) {
          // Extract the base color name for background
          annotation.background_color = color.replace('_background', '');
        } else {
          // Regular text color
          annotation.color = color;
        }
      }
      
      annotations.push(annotation);
    }
    
    // Always advance position by the text length
    currentPosition += (rt.plain_text || '').length;
  }
  
  return annotations;
}

// Increment and get image count for a page - FIXED: Ensure unique indices per page
export function getAndIncrementImageIndex(pageId: string): number {
  const currentCount = pageImageCounts.get(pageId) || 0;
  const nextCount = currentCount + 1;
  pageImageCounts.set(pageId, nextCount);
  console.log(`Page ${pageId}: Image index ${currentCount} assigned`);
  return currentCount;
}

// Reset image counters (useful for tests or when starting new sync)
export function resetImageCounters(): void {
  pageImageCounts.clear();
  console.log('Image counters reset');
}
