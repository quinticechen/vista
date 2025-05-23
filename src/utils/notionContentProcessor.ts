
import { Json } from "@/integrations/supabase/types";
import { toast } from "@/components/ui/sonner";

// Define the content item type returned from Supabase to match the database schema
export interface ContentItemFromDB {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  content?: Json; 
  created_at?: string;
  updated_at?: string;
  start_date?: string;
  end_date?: string;
  user_id: string;
  notion_page_status?: string;
  notion_page_id?: string;
  embedding?: string | null;
  content_translations?: Json;
  description_translations?: Json;
  title_translations?: Json;
  cover_image?: string;
  is_heic_cover?: boolean;
}

// Update ExtendedContentItem type to include cover_image, is_heic_cover, and orientation
export interface ExtendedContentItem extends ContentItemFromDB {
  similarity?: number;
  orientation?: 'portrait' | 'landscape' | 'square';
  preview_image?: string; // Add preview_image property for first image in content
  preview_is_heic?: boolean; // Flag for preview image format
}

// Helper function to check if an image URL is a HEIC format
export const isHeicImage = (url?: string): boolean => {
  if (!url) return false;
  const urlLower = url.toLowerCase();
  return urlLower.endsWith('.heic') || 
         urlLower.includes('/heic') || 
         urlLower.includes('heic.') ||
         urlLower.includes('image/heic');
};

// Detect image orientation based on width and height
export const detectImageOrientation = (width?: number, height?: number): 'portrait' | 'landscape' | 'square' => {
  if (!width || !height) return 'landscape'; // Default to landscape if dimensions unknown
  
  if (width > height) {
    return 'landscape';
  } else if (height > width) {
    return 'portrait';
  } else {
    return 'square';
  }
};

// Extract first image from content blocks for preview
export const extractFirstImageUrl = (blocks: any[]): { url: string | undefined, isHeic: boolean } => {
  if (!Array.isArray(blocks)) {
    return { url: undefined, isHeic: false };
  }
  
  // Helper recursive function to check blocks and their children
  const findFirstImage = (blocks: any[]): { url: string | undefined, isHeic: boolean } => {
    for (const block of blocks) {
      // Check if the block is an image type
      if ((block.type === 'image' || block.media_type === 'image') && 
          (block.media_url || block.url)) {
        const imageUrl = block.media_url || block.url;
        const isHeic = block.is_heic || isHeicImage(imageUrl);
        return { url: imageUrl, isHeic };
      }
      
      // If this block has children, recursively check them
      if (block.children && Array.isArray(block.children)) {
        const imageFromChildren = findFirstImage(block.children);
        if (imageFromChildren.url) {
          return imageFromChildren;
        }
      }
    }
    
    return { url: undefined, isHeic: false };
  };
  
  return findFirstImage(blocks);
};

// Process Notion blocks for rendering
export const processNotionContent = (contentItem: ContentItemFromDB): ExtendedContentItem => {
  try {
    // Create a deep clone to avoid modifying the original
    const processed = JSON.parse(JSON.stringify(contentItem)) as ExtendedContentItem;
    
    // Initialize processed.orientation as landscape by default
    processed.orientation = 'landscape';
    
    // Process content if it's an array
    if (processed.content && Array.isArray(processed.content)) {
      console.log("Content has array structure, ready for rendering");
      
      // Look for the first image in the content to determine orientation
      let foundFirstImage = false;
      
      // Extract the first image for preview
      const { url: previewImageUrl, isHeic: previewIsHeic } = extractFirstImageUrl(processed.content as any[]);
      
      if (previewImageUrl) {
        processed.preview_image = previewImageUrl;
        processed.preview_is_heic = previewIsHeic;
        console.log("Found preview image:", previewImageUrl, "Is HEIC:", previewIsHeic);
      }
      
      // Process the content to properly handle all elements
      processed.content = (processed.content as any[]).map((block: any) => {
        // Deep clone to avoid modifying the original
        const processedBlock = JSON.parse(JSON.stringify(block));
        
        // Process annotations to ensure they're valid
        if (processedBlock.annotations && Array.isArray(processedBlock.annotations)) {
          // Make sure annotations have valid start/end values relative to the text
          const textLength = processedBlock.text?.length || 0;
          
          // Filter out invalid annotations and fix any issues
          processedBlock.annotations = processedBlock.annotations
            .filter((anno: any) => {
              // Skip annotations without proper formatting properties
              return anno && typeof anno === 'object';
            })
            .map((anno: any) => {
              // Create a clean copy of the annotation
              const cleanAnno = { ...anno };
              
              // Fix color properties
              if (cleanAnno.color && cleanAnno.color.includes("background") && !cleanAnno.color.includes("_background")) {
                cleanAnno.color = cleanAnno.color.replace("background", "_background");
              }
              
              // Check if this is a positional annotation (has start/end)
              if (cleanAnno.start !== undefined && cleanAnno.end !== undefined) {
                // Ensure start/end are valid numbers and within the text bounds
                if (typeof cleanAnno.start !== 'number' || cleanAnno.start < 0) {
                  cleanAnno.start = 0;
                }
                if (typeof cleanAnno.end !== 'number' || cleanAnno.end > textLength || cleanAnno.end <= cleanAnno.start) {
                  cleanAnno.end = Math.max(textLength, cleanAnno.start + 1);
                }
              }
              
              return cleanAnno;
            });
        }
        
        // Process line breaks in text
        if (processedBlock.text && typeof processedBlock.text === 'string') {
          // Keep line breaks intact for proper rendering
          processedBlock.text = processedBlock.text;
        }
        
        // Process any icon objects to ensure they're safely renderable
        if (processedBlock.icon && typeof processedBlock.icon === 'object') {
          // Extract emoji from icon if present
          if (processedBlock.icon.emoji) {
            processedBlock.emoji = processedBlock.icon.emoji;
          }
        }
        
        // Process list types to ensure proper hierarchy and rendering
        if (processedBlock.type === "bulleted_list_item" && !processedBlock.list_type) {
          processedBlock.list_type = "bulleted_list";
          processedBlock.is_list_item = true;
        }
        
        if (processedBlock.type === "numbered_list_item" && !processedBlock.list_type) {
          processedBlock.list_type = "numbered_list";
          processedBlock.is_list_item = true;
        }
        
        // Process for tables - ensure they have proper structure
        if (processedBlock.type === 'table' && processedBlock.children) {
          // Make sure each row has cells with proper structure
          processedBlock.children = processedBlock.children.map((row: any) => {
            if (!row.children || !Array.isArray(row.children)) {
              row.children = []; // Ensure children is an array
            }
            return row;
          });
        }
        
        // Process for columns - ensure proper structure
        if ((processedBlock.type === 'column_list' || processedBlock.type === 'column') && processedBlock.children) {
          // Make sure each column has proper structure
          processedBlock.children = processedBlock.children.map((column: any) => {
            if (!column.children) {
              column.children = [];
            }
            return column;
          });
        }
        
        // Fix toggle blocks
        if (processedBlock.type === 'toggle' && !processedBlock.children) {
          processedBlock.children = [];
        }
        
        // Detect and mark HEIC images for better error handling
        if ((processedBlock.type === 'image' || processedBlock.media_type === 'image') && 
            (processedBlock.media_url || processedBlock.url)) {
          const imageUrl = processedBlock.media_url || processedBlock.url;
          if (isHeicImage(imageUrl)) {
            processedBlock.is_heic = true;
            console.warn("HEIC image detected in content:", imageUrl);
          }
          
          // If this is the first image and we haven't determined orientation yet
          if (!foundFirstImage) {
            foundFirstImage = true;
            
            // Determine orientation from image dimensions if available
            if (processedBlock.width && processedBlock.height) {
              processed.orientation = detectImageOrientation(processedBlock.width, processedBlock.height);
              processedBlock.orientation = processed.orientation;
              console.log(`Detected first image orientation: ${processed.orientation}`);
            } else if (processedBlock.aspect_ratio) {
              // If aspect_ratio is directly provided
              processed.orientation = processedBlock.aspect_ratio < 1 ? 'portrait' : 'landscape';
              processedBlock.orientation = processed.orientation;
              console.log(`Using provided aspect ratio: ${processed.orientation}`);
            }
          }
        }
        
        // Recursively process children
        if (processedBlock.children && Array.isArray(processedBlock.children)) {
          processedBlock.children = processedBlock.children.map((child: any) => {
            // Process each child block using the same logic
            const processedChild = JSON.parse(JSON.stringify(child));
            
            // Fix list types for nested items
            if (processedChild.type === "bulleted_list_item" && !processedChild.list_type) {
              processedChild.list_type = "bulleted_list";
              processedChild.is_list_item = true;
            }
            
            if (processedChild.type === "numbered_list_item" && !processedChild.list_type) {
              processedChild.list_type = "numbered_list";
              processedChild.is_list_item = true;
            }
            
            // Process child annotations 
            if (processedChild.annotations && Array.isArray(processedChild.annotations)) {
              // Apply the same annotation processing to children
              const childTextLength = processedChild.text?.length || 0;
              
              processedChild.annotations = processedChild.annotations
                .filter((anno: any) => anno && typeof anno === 'object')
                .map((anno: any) => {
                  const cleanAnno = { ...anno };
                  
                  // Fix color properties
                  if (cleanAnno.color && cleanAnno.color.includes("background") && !cleanAnno.color.includes("_background")) {
                    cleanAnno.color = cleanAnno.color.replace("background", "_background");
                  }
                  
                  // Fix start/end positions
                  if (cleanAnno.start !== undefined && cleanAnno.end !== undefined) {
                    if (typeof cleanAnno.start !== 'number' || cleanAnno.start < 0) {
                      cleanAnno.start = 0;
                    }
                    if (typeof cleanAnno.end !== 'number' || cleanAnno.end > childTextLength || cleanAnno.end <= cleanAnno.start) {
                      cleanAnno.end = Math.max(childTextLength, cleanAnno.start + 1);
                    }
                  }
                  
                  return cleanAnno;
                });
            }

            // Detect and mark HEIC images in children
            if ((processedChild.type === 'image' || processedChild.media_type === 'image') && 
                (processedChild.media_url || processedChild.url)) {
              const imageUrl = processedChild.media_url || processedChild.url;
              if (isHeicImage(imageUrl)) {
                processedChild.is_heic = true;
                console.warn("HEIC image detected in child content:", imageUrl);
              }
              
              // If this is the first image and we haven't determined orientation yet
              if (!foundFirstImage) {
                foundFirstImage = true;
                
                // Determine orientation from image dimensions if available
                if (processedChild.width && processedChild.height) {
                  processed.orientation = detectImageOrientation(processedChild.width, processedChild.height);
                  processedChild.orientation = processed.orientation;
                  console.log(`Detected first child image orientation: ${processed.orientation}`);
                } else if (processedChild.aspect_ratio) {
                  // If aspect_ratio is directly provided
                  processed.orientation = processedChild.aspect_ratio < 1 ? 'portrait' : 'landscape';
                  processedChild.orientation = processed.orientation;
                  console.log(`Using provided child aspect ratio: ${processed.orientation}`);
                }
              }
            }
            
            return processedChild;
          });
        }
        
        return processedBlock;
      });
    }

    // Check if cover image is HEIC
    if (processed.cover_image && isHeicImage(processed.cover_image)) {
      processed.is_heic_cover = true;
      console.warn("HEIC cover image detected:", processed.cover_image);
    }
    
    // If we have no cover image but found a preview image, use it as cover
    if (!processed.cover_image && processed.preview_image) {
      processed.cover_image = processed.preview_image;
      processed.is_heic_cover = processed.preview_is_heic || false;
      console.log("Using preview image as cover:", processed.cover_image);
    }
    
    return processed;
  } catch (error) {
    console.error("Error processing content:", error);
    toast.error("Error processing content");
    return contentItem as ExtendedContentItem;
  }
};
