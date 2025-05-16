
import { supabase } from "@/integrations/supabase/client";
import { ContentItem } from "@/services/adminService";

export interface UrlParamProfile {
  id: string;
  url_param: string;
  is_admin: boolean;
  default_language: string;
  supported_ai_languages?: string[];
}

// Set URL parameter for a user
export const setUrlParam = async (userId: string, urlParam: string): Promise<boolean> => {
  try {
    // First check if the URL param is already taken
    const { data: existingParam, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('url_param', urlParam)
      .not('id', 'eq', userId);
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingParam && existingParam.length > 0) {
      throw new Error('This URL parameter is already taken by another user');
    }
    
    // Update the user's profile with the new URL param
    const { error } = await supabase
      .from('profiles')
      .update({ url_param: urlParam })
      .eq('id', userId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error setting URL parameter:', error);
    throw error;
  }
};

// Get profile by URL parameter
export const getProfileByUrlParam = async (urlParam: string): Promise<UrlParamProfile | null> => {
  try {
    if (!urlParam) {
      console.error('No URL parameter provided');
      return null;
    }
    
    console.log('Looking up profile for URL parameter:', urlParam);
    
    // Use lowercase comparison to make URL parameters case insensitive
    const { data, error } = await supabase
      .from('profiles')
      .select('id, url_param, is_admin, default_language, supported_ai_languages')
      .ilike('url_param', urlParam) // Use case insensitive comparison
      .single();
    
    if (error) {
      console.error('Error fetching profile by URL parameter:', error);
      return null;
    }
    
    console.log('Profile found:', data);
    return data as UrlParamProfile;
  } catch (error) {
    console.error('Exception getting profile by URL parameter:', error);
    return null;
  }
};

// Get content items for a specific user
export const getUserContentItems = async (userId: string): Promise<ContentItem[]> => {
  try {
    console.log('Fetching content items for user:', userId);
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      throw error;
    }
    
    // Process content before returning
    const processedItems = data?.map(item => {
      // Handle JSON content properly
      const processedItem = {
        ...item,
        // Ensure notion_page_status is properly typed
        notion_page_status: item.notion_page_status as ContentItem['notion_page_status']
      } as ContentItem;
      
      // If content is a string, try to parse it as JSON
      if (typeof processedItem.content === 'string') {
        try {
          processedItem.content = JSON.parse(processedItem.content as string);
        } catch (e) {
          // If parsing fails, leave as is
          console.log('Could not parse content JSON for item:', item.id);
        }
      }
      
      return processedItem;
    }) || [];
    
    console.log(`Found ${processedItems.length} content items`);
    return processedItems;
  } catch (error) {
    console.error('Error getting user content items:', error);
    return [];
  }
};

// Get a specific content item by ID
export const getContentItemById = async (contentId: string): Promise<ContentItem | null> => {
  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', contentId)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Process content before returning
    const processedItem = {
      ...data,
      // Ensure notion_page_status is properly typed
      notion_page_status: data.notion_page_status as ContentItem['notion_page_status']
    } as ContentItem;
    
    // If content is a string, try to parse it as JSON
    if (typeof processedItem.content === 'string') {
      try {
        processedItem.content = JSON.parse(processedItem.content as string);
      } catch (e) {
        // If parsing fails, leave as is
        console.log('Could not parse content JSON for item:', data.id);
      }
    }
    
    return processedItem;
  } catch (error) {
    console.error('Error getting content item by ID:', error);
    return null;
  }
};
