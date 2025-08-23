
import { supabase } from "@/integrations/supabase/client";
import { ContentItem } from "@/services/adminService";

export async function getProfileByUrlParam(urlParam: string) {
  try {
    console.log(`Looking up profile for URL parameter: ${urlParam}`);
    
    // Use the new security definer function for public access to safe profile fields
    const { data, error } = await supabase
      .rpc('get_public_profile', { profile_url_param: urlParam });
    
    if (error) {
      console.error('Error fetching profile by URL parameter:', error);
      return null;
    }
    
    // The RPC function returns an array, get the first result
    if (!data || data.length === 0) {
      console.log(`No profile found for URL parameter: ${urlParam}`);
      return null;
    }
    
    const profile = data[0];
    console.log(`Successfully found profile for ${urlParam}:`, profile);
    
    // For backward compatibility, we need to add an id field for code that expects it
    // We'll create a minimal profile object with the safe fields plus a placeholder id
    return {
      ...profile,
      id: 'public-access', // Placeholder since we can't expose the real user ID
    };
  } catch (error) {
    console.error('Exception fetching profile by URL parameter:', error);
    return null;
  }
}

export async function setUrlParam(userId: string, urlParam: string) {
  try {
    console.log(`Setting URL parameter for user ID: ${userId} to: ${urlParam}`);
    
    // Check if the URL param is already in use
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('url_param', urlParam)
      .neq('id', userId)
      .single();
    
    if (existingProfile) {
      throw new Error('This URL parameter is already in use by another user');
    }
    
    // Update the user's profile with the new URL param
    const { data, error } = await supabase
      .from('profiles')
      .update({ url_param: urlParam })
      .eq('id', userId);
      
    if (error) {
      console.error('Error setting URL parameter:', error);
      throw new Error(error.message || 'Failed to set URL parameter');
    }
    
    console.log('URL parameter set successfully');
    return data;
  } catch (error: any) {
    console.error('Exception setting URL parameter:', error);
    throw error;
  }
}

export async function getContentItemById(contentId: string) {
  try {
    console.log(`Fetching content item with ID: ${contentId}`);
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', contentId)
      .single();
    
    if (error) {
      console.error('Error fetching content item by ID:', error);
      return null;
    }
    
    // Parse the content if it's a JSON string
    if (data && data.content && typeof data.content === 'string') {
      try {
        data.content = JSON.parse(data.content);
        console.log('Successfully parsed content JSON');
      } catch (e) {
        console.error('Error parsing content JSON:', e);
        // Keep the original content as is if it can't be parsed
      }
    }
    
    return data;
  } catch (error) {
    console.error('Exception fetching content item by ID:', error);
    return null;
  }
}

export async function getUserContentItems(userId: string): Promise<ContentItem[]> {
  try {
    console.log(`Fetching content items for user ID: ${userId}`);
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user content items:', error);
      return [];
    }
    
    // Process the data to match ContentItem interface
    const processedData = (data || []).map((item: any) => {
      // Parse content if it's a string
      if (item.content && typeof item.content === 'string') {
        try {
          item.content = JSON.parse(item.content);
        } catch (e) {
          console.error(`Error parsing content JSON for item ${item.id}:`, e);
          // Keep as is if parsing fails
        }
      }
      
      return item as ContentItem;
    });
    
    console.log(`Retrieved ${processedData.length} content items for user`);
    return processedData;
  } catch (error) {
    console.error('Exception fetching user content items:', error);
    return [];
  }
}

export async function searchUserContent(userId: string, query: string): Promise<ContentItem[]> {
  try {
    console.log(`Searching user content for user ID: ${userId} with query: "${query}"`);
    
    // First get all content for this user
    const userContent = await getUserContentItems(userId);
    
    if (!query.trim() || userContent.length === 0) {
      return userContent;
    }
    
    // Simple search implementation - can be enhanced later
    const lowerQuery = query.toLowerCase();
    const results = userContent.filter(item => {
      const titleMatch = item.title?.toLowerCase().includes(lowerQuery);
      const descMatch = item.description?.toLowerCase().includes(lowerQuery);
      const categoryMatch = item.category?.toLowerCase().includes(lowerQuery);
      const tagMatch = item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
      
      return titleMatch || descMatch || categoryMatch || tagMatch;
    });
    
    console.log(`Found ${results.length} matching items for search query`);
    return results;
  } catch (error) {
    console.error('Exception searching user content:', error);
    return [];
  }
}
