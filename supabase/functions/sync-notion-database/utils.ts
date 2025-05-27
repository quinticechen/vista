
// Utility functions for sync-notion-database Edge Function

// Global image counter map to track images per page
const imageCounterMap = new Map<string, number>();

// FIXED: Reset image counters for new sync session
export function resetImageCounters(): void {
  imageCounterMap.clear();
}

// FIXED: Get and increment image index for a specific page
export function getAndIncrementImageIndex(pageId: string): number {
  const currentCount = imageCounterMap.get(pageId) || 0;
  const newCount = currentCount + 1;
  imageCounterMap.set(pageId, newCount);
  return newCount;
}

// Extract rich text content from Notion rich text array
export function extractRichText(richTextArray: any[]): string {
  if (!richTextArray || !Array.isArray(richTextArray)) {
    return "";
  }
  
  return richTextArray
    .map((richText) => richText?.plain_text || "")
    .join("");
}

// FIXED: Extract annotations with proper background color handling
export function extractAnnotationsSimplified(richTextArray: any[]): any[] {
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
    
    // Check if any formatting is applied or if there's a link
    if (bold || italic || strikethrough || underline || code || (color && color !== 'default') || richText.href) {
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

// Extract property values from Notion properties
export function extractProperty(properties: any, propertyName: string, propertyType: string): any {
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
    case 'number':
      return property.number || null;
    case 'checkbox':
      return property.checkbox || false;
    case 'url':
      return property.url || null;
    case 'email':
      return property.email || null;
    case 'phone_number':
      return property.phone_number || null;
    default:
      return null;
  }
}

// Backup image to Supabase Storage and return the new URL
export async function backupImageToStorage(
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
    console.log(`Starting backup for image ${imageIndex} from page ${pageId}: ${imageUrl}`);
    
    // Fetch the image from the original URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return imageUrl; // Return original URL if backup fails
    }
    
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Create a unique filename using page ID and image index
    const fileExtension = contentType.split('/')[1] || 'jpg';
    const fileName = `${userId}/${pageId}/image-${imageIndex}.${fileExtension}`;
    
    console.log(`Uploading image to storage: ${fileName}`);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, imageBuffer, {
        contentType,
        upsert: true // Overwrite if exists
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      return imageUrl; // Return original URL if backup fails
    }
    
    // Get the public URL for the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    const backupUrl = publicUrlData.publicUrl;
    console.log(`Image ${imageIndex} successfully backed up to: ${backupUrl}`);
    
    return backupUrl;
  } catch (error) {
    console.error('Error backing up image:', error);
    return imageUrl; // Return original URL if backup fails
  }
}
