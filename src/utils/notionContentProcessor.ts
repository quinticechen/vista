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

// Update ExtendedContentItem type to include cover_image and is_heic_cover
export interface ExtendedContentItem extends ContentItemFromDB {
  similarity?: number;
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

// Process Notion blocks for rendering
export const processNotionContent = (contentItem: ContentItemFromDB): ExtendedContentItem => {
  try {
    // Create a deep clone to avoid modifying the original
    const processed = JSON.parse(JSON.stringify(contentItem)) as ExtendedContentItem;
    
    // Process content if it's an array
    if (processed.content && Array.isArray(processed.content)) {
      console.log("Content has array structure, ready for rendering");
      
      // Process the content to properly handle all elements
      processed.content = (processed.content as any[]).map((block: any) => {
        // Deep clone to avoid modifying the original
        const processedBlock = JSON.parse(JSON.stringify(block));
        
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
        
        // Ensure text annotations are properly processed
        if (processedBlock.annotations && processedBlock.annotations.length > 0) {
          processedBlock.annotations = processedBlock.annotations.map((ann: any) => {
            // Fix background colors by ensuring proper format
            if (ann.color && ann.color.includes("background") && !ann.color.includes("_background")) {
              ann.color = ann.color.replace("background", "_background");
            }
            return ann;
          });
        }

        // Detect and mark HEIC images for better error handling
        if ((processedBlock.type === 'image' || processedBlock.media_type === 'image') && 
            (processedBlock.media_url || processedBlock.url)) {
          const imageUrl = processedBlock.media_url || processedBlock.url;
          if (isHeicImage(imageUrl)) {
            processedBlock.is_heic = true;
            console.warn("HEIC image detected in content:", imageUrl);
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
            
            // Handle nested annotations
            if (processedChild.annotations && processedChild.annotations.length > 0) {
              processedChild.annotations = processedChild.annotations.map((ann: any) => {
                if (ann.color && ann.color.includes("background") && !ann.color.includes("_background")) {
                  ann.color = ann.color.replace("background", "_background");
                }
                return ann;
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
    
    return processed;
  } catch (error) {
    console.error("Error processing content:", error);
    toast.error("Error processing content");
    return contentItem as ExtendedContentItem;
  }
};
