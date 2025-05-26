
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.5.0';
import { Client } from 'https://deno.land/x/notion_sdk/src/mod.ts';
import { RequestBody, NotionDatabaseItem, SyncResult, corsHeaders } from './types.ts';
import { extractProperty, resetImageCounters } from './utils.ts';
import { processBlocksSimplifiedWithImageBackup } from './notion-processor.ts';

Deno.serve(async (req) => {
  // This is needed for CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Get the JWT token from the request headers
    const authHeader = req.headers.get('Authorization');
    
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
      );
    }
    
    // Get the API keys from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
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
      );
    }
    
    // Parse the request body
    let reqBody: RequestBody;
    
    try {
      reqBody = await req.json() as RequestBody;
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
      );
    }
    
    // Extract necessary data from the request body
    const { notionDatabaseId, notionApiKey, userId } = reqBody;
    
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
      );
    }
    
    // Verify the user ID matches and that the user has the notion credentials configured
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
      );
    }

    // Verify the user's profile has the matching notion credentials
    const { data: profile } = await supabase
      .from('profiles')
      .select('notion_database_id, notion_api_key')
      .eq('id', userId)
      .single();

    if (!profile || profile.notion_database_id !== notionDatabaseId || profile.notion_api_key !== notionApiKey) {
      return new Response(
        JSON.stringify({ error: 'Notion credentials do not match user profile' }),
        { 
          status: 403, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    // Initialize the Notion client with the provided API key
    const notion = new Client({ auth: notionApiKey });
    
    // Format the database ID by removing any hyphens
    // Notion API expects IDs without hyphens
    const formattedDatabaseId = notionDatabaseId.replace(/-/g, '');
    
    console.log(`Attempting to query Notion database with ID: ${formattedDatabaseId}`);
    
    // Query the Notion database
    const response = await notion.databases.query({
      database_id: formattedDatabaseId,
    });
    
    // Check if notion-images bucket exists, create it if not
    const { data: existingBuckets } = await supabase.storage.listBuckets();
    const notionImagesBucket = 'notion-images';
    const bucketExists = existingBuckets?.some(bucket => bucket.name === notionImagesBucket);
    
    if (!bucketExists) {
      // Create a public bucket for storing Notion images
      await supabase.storage.createBucket(notionImagesBucket, {
        public: true, // Make it public so images are accessible
        fileSizeLimit: 10485760, // 10MB limit
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
      });
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
    
    // Reset image counters before starting new sync
    resetImageCounters();
    
    // Process each item in the Notion database
    const syncResults: SyncResult[] = await Promise.all(
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
          let operation: SyncResult['operation'];
          let resultId: string;
          
          if (existingItemId) {
            // Update existing item
            const { data, error } = await supabase
              .from('content_items')
              .update(contentItem)
              .eq('id', existingItemId)
              .select();
            
            if (error) throw error;
            operation = 'updated';
            resultId = existingItemId;
            return { id: existingItemId, title: contentItem.title, operation };
          } else {
            // Insert new item
            const { data, error } = await supabase
              .from('content_items')
              .insert(contentItem)
              .select();
            
            if (error) throw error;
            operation = 'inserted';
            resultId = data?.[0]?.id;
            return { id: data?.[0]?.id, title: contentItem.title, operation };
          }
        } catch (error) {
          console.error("Error syncing page:", page.id, error);
          return { id: page.id, error: error.message, operation: 'failed' };
        }
      })
    );
    
    // Find and mark as removed any pages that exist in Supabase but no longer exist in Notion
    const removedPages: SyncResult[] = [];
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
              operation: 'failed'
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
});
