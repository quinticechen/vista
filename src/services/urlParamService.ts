
import { supabase } from "@/integrations/supabase/client";

export interface UrlParamProfile {
  id: string;
  url_param: string;
  is_admin: boolean;
  default_language: string;
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
    const { data, error } = await supabase
      .from('profiles')
      .select('id, url_param, is_admin, default_language')
      .eq('url_param', urlParam)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data as UrlParamProfile;
  } catch (error) {
    console.error('Error getting profile by URL parameter:', error);
    return null;
  }
};

// Get content items for a specific user
export const getUserContentItems = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting user content items:', error);
    return [];
  }
};

// Get a specific content item by ID
export const getContentItemById = async (contentId: string) => {
  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', contentId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting content item by ID:', error);
    return null;
  }
};
