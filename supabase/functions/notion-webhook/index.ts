import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Client } from 'https://deno.land/x/notion_sdk/src/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotionWebhookPayload {
  type?: string;
  challenge?: string;
  verification_token?: string;
  entity?: {
    id: string;
    type: string;
  };
  data?: {
    parent?: {
      id: string;
      type: string;
    };
    updated_properties?: string[];
    updated_blocks?: Array<{ id: string; type: string }>;
  };
  workspace?: {
    id: string;
  };
}

// Helper function to extract property values (copied from sync-notion-database)
function extractProperty(properties: any, propertyName: string, propertyType: string): any {
  const property = properties[propertyName];
  if (!property) return null;

  switch (propertyType) {
    case 'title':
      return property.title?.[0]?.plain_text || null;
    case 'rich_text':
      return property.rich_text?.[0]?.plain_text || null;
    case 'select':
      return property.select?.name || null;
    case 'multi_select':
      return property.multi_select?.map((item: any) => item.name) || [];
    case 'date':
      return property.date?.start || null;
    default:
      return null;
  }
}

// Helper function to extract rich text (copied from sync-notion-database)
function extractRichText(richTextArray: any[]): string {
  if (!richTextArray || !Array.isArray(richTextArray)) return '';
  return richTextArray.map(item => item.plain_text || '').join('');
}

// Helper function to extract annotations (simplified version)
function extractAnnotationsSimplified(richTextArray: any[]): any[] {
  if (!richTextArray || !Array.isArray(richTextArray)) return [];
  
  return richTextArray
    .filter(item => item.annotations && Object.values(item.annotations).some(val => val === true))
    .map(item => ({
      text: item.plain_text,
      ...item.annotations
    }));
}

// Helper function to process blocks (simplified version for webhook)
async function processBlocksForWebhook(blocks: any[], notionClient: Client): Promise<any[]> {
  const processedBlocks = [];
  
  for (const block of blocks) {
    const blockType = block.type;
    const baseBlock: any = { type: blockType };
    
    // Process specific block types
    switch (blockType) {
      case 'paragraph':
        baseBlock.text = extractRichText(block.paragraph?.rich_text || []);
        baseBlock.annotations = extractAnnotationsSimplified(block.paragraph?.rich_text || []);
        break;
      case 'heading_1':
        baseBlock.text = extractRichText(block.heading_1?.rich_text || []);
        baseBlock.annotations = extractAnnotationsSimplified(block.heading_1?.rich_text || []);
        break;
      case 'heading_2':
        baseBlock.text = extractRichText(block.heading_2?.rich_text || []);
        baseBlock.annotations = extractAnnotationsSimplified(block.heading_2?.rich_text || []);
        break;
      case 'heading_3':
        baseBlock.text = extractRichText(block.heading_3?.rich_text || []);
        baseBlock.annotations = extractAnnotationsSimplified(block.heading_3?.rich_text || []);
        break;
      case 'bulleted_list_item':
        baseBlock.text = extractRichText(block.bulleted_list_item?.rich_text || []);
        baseBlock.is_list_item = true;
        baseBlock.list_type = 'bulleted_list';
        baseBlock.annotations = extractAnnotationsSimplified(block.bulleted_list_item?.rich_text || []);
        break;
      case 'numbered_list_item':
        baseBlock.text = extractRichText(block.numbered_list_item?.rich_text || []);
        baseBlock.is_list_item = true;
        baseBlock.list_type = 'numbered_list';
        baseBlock.annotations = extractAnnotationsSimplified(block.numbered_list_item?.rich_text || []);
        break;
      case 'to_do':
        baseBlock.text = extractRichText(block.to_do?.rich_text || []);
        baseBlock.checked = block.to_do?.checked;
        baseBlock.annotations = extractAnnotationsSimplified(block.to_do?.rich_text || []);
        break;
      case 'image':
        baseBlock.media_type = 'image';
        baseBlock.media_url = block.image?.type === 'external' ? 
          block.image.external?.url : 
          block.image?.type === 'file' ? block.image.file?.url : null;
        baseBlock.caption = block.image?.caption ? extractRichText(block.image.caption) : null;
        break;
      default:
        if (block[blockType]?.rich_text) {
          baseBlock.text = extractRichText(block[blockType].rich_text);
          baseBlock.annotations = extractAnnotationsSimplified(block[blockType].rich_text);
        }
        break;
    }
    
    // Handle child blocks
    if (block.has_children) {
      try {
        const { results: childBlocks } = await notionClient.blocks.children.list({
          block_id: block.id,
          page_size: 50,
        });
        baseBlock.children = await processBlocksForWebhook(childBlocks, notionClient);
      } catch (error) {
        console.error(`Error fetching children for block ${block.id}:`, error);
        baseBlock.children = [];
      }
    }
    
    processedBlocks.push(baseBlock);
  }
  
  return processedBlocks;
}

Deno.serve(async (req) => {
  console.log('=== Notion Webhook Request ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract user_id from URL parameters for user-specific webhooks
    const url = new URL(req.url);
    const userIdParam = url.searchParams.get('user_id');
    
    console.log('User ID from URL:', userIdParam);

    const payload: NotionWebhookPayload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    // Handle Notion verification challenge (standard format)
    if (payload.type === 'url_verification' && payload.challenge) {
      console.log('Handling verification challenge:', payload.challenge);
      
      if (userIdParam) {
        // User-specific webhook: update verification token in profiles table
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            verification_token: payload.challenge
          })
          .eq('id', userIdParam);
        
        if (updateError) {
          console.error('Error updating verification token in profile:', updateError);
        } else {
          console.log('Verification token updated in profile for user:', userIdParam);
        }
      }
      
      // Return the challenge as required by Notion
      return new Response(
        JSON.stringify({ challenge: payload.challenge }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Handle direct verification token (Notion's actual format)
    if (payload.verification_token) {
      console.log('Handling direct verification token:', payload.verification_token);
      
      if (userIdParam) {
        // User-specific webhook: update verification token in profiles table
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            verification_token: payload.verification_token
          })
          .eq('id', userIdParam);
        
        if (updateError) {
          console.error('Error updating verification token in profile:', updateError);
        } else {
          console.log('Verification token updated in profile for user:', userIdParam);
        }
      }
      
      // Return success response
      return new Response(
        JSON.stringify({ status: 'success', message: 'Verification token received' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Handle page events
    if (payload.entity?.type === 'page') {
      const pageId = payload.entity.id;
      const eventType = payload.type;
      
      console.log('Processing page event:', eventType, 'for page:', pageId);
      
      let userId = userIdParam;
      let userProfile = null;
      
      // Get user profile and API key
      if (userId) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('notion_api_key, notion_database_id')
          .eq('id', userId)
          .single();
        
        if (error || !profile) {
          console.error('Error fetching user profile:', error);
          return new Response(
            JSON.stringify({ status: 'error', message: 'User profile not found' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            }
          );
        }
        
        userProfile = profile;
      } else {
        // Legacy support: lookup user by database ID if parent is database
        if (payload.data?.parent?.type === 'database') {
          const databaseId = payload.data.parent.id;
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, notion_api_key, notion_database_id')
            .eq('notion_database_id', databaseId)
            .single();
          
          if (error || !profile) {
            console.log('No user found for database:', databaseId);
            return new Response(
              JSON.stringify({ status: 'success', message: 'No user configuration found for database' }),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
              }
            );
          }
          
          userId = profile.id;
          userProfile = profile;
        }
      }

      // Handle page deletion events
      if (eventType === 'page.deleted') {
        console.log('Handling page deletion event for page:', pageId);
        
        try {
          // Update the content item status to 'removed' without fetching page details
          const { error: updateError } = await supabase
            .from('content_items')
            .update({
              notion_page_status: 'removed',
              updated_at: new Date().toISOString()
            })
            .eq('notion_page_id', pageId)
            .eq('user_id', userId);
          
          if (updateError) {
            console.error('Error updating content item status to removed:', updateError);
            throw updateError;
          }
          
          console.log('Content item marked as removed successfully for page:', pageId);
          
          return new Response(
            JSON.stringify({ 
              status: 'success', 
              message: `Page marked as removed successfully`,
              page_id: pageId,
              user_id: userId,
              operation: 'removed'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
          
        } catch (error) {
          console.error('Error handling page deletion:', error);
          return new Response(
            JSON.stringify({ 
              status: 'error', 
              message: 'Failed to mark page as removed',
              error: error.message 
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            }
          );
        }
      }

      // Handle page moved events (when page is moved out of database)
      if (eventType === 'page.moved') {
        console.log('Handling page moved event for page:', pageId);
        
        try {
          // Update the content item status to 'removed' since page moved out of database
          const { error: updateError } = await supabase
            .from('content_items')
            .update({
              notion_page_status: 'removed',
              updated_at: new Date().toISOString()
            })
            .eq('notion_page_id', pageId)
            .eq('user_id', userId);
          
          if (updateError) {
            console.error('Error updating content item status to removed:', updateError);
            throw updateError;
          }
          
          console.log('Content item marked as removed successfully for moved page:', pageId);
          
          return new Response(
            JSON.stringify({ 
              status: 'success', 
              message: `Page marked as removed successfully`,
              page_id: pageId,
              user_id: userId,
              operation: 'removed'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
          
        } catch (error) {
          console.error('Error handling page move:', error);
          return new Response(
            JSON.stringify({ 
              status: 'error', 
              message: 'Failed to mark page as removed',
              error: error.message 
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            }
          );
        }
      }

      // Handle page restoration event
      if (eventType === 'page.undeleted') {
        console.log('Handling page restoration event for page:', pageId);
        
        if (!userProfile.notion_api_key) {
          console.error('No Notion API key configured for user:', userId);
          return new Response(
            JSON.stringify({ status: 'error', message: 'Notion API key not configured' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }
        
        try {
          // Initialize Notion client with user's API key
          const notion = new Client({ auth: userProfile.notion_api_key });
          
          // Fetch the restored page details and process it like a normal content sync
          console.log('Fetching restored page details for:', pageId);
          const page = await notion.pages.retrieve({ page_id: pageId });
          
          // Fetch page blocks
          console.log('Fetching page blocks for:', pageId);
          const { results: blocks } = await notion.blocks.children.list({
            block_id: pageId,
            page_size: 100,
          });
          
          // Process blocks using simplified processing for webhook
          const processedBlocks = await processBlocksForWebhook(blocks, notion);
          
          // Extract page properties
          const props = (page as any).properties || {};
          
          // Prepare content item data (matching sync-notion-database format)
          const contentItem = {
            title: extractProperty(props, 'Name', 'title') || extractProperty(props, 'Title', 'title') || 'Untitled',
            description: extractProperty(props, 'Description', 'rich_text'),
            category: extractProperty(props, 'Category', 'select'),
            tags: extractProperty(props, 'Tags', 'multi_select'),
            created_at: (page as any).created_time,
            updated_at: (page as any).last_edited_time,
            start_date: extractProperty(props, 'Start date', 'date'),
            end_date: extractProperty(props, 'End date', 'date'),
            notion_url: (page as any).url,
            user_id: userId,
            content: processedBlocks,
            notion_page_id: pageId,
            notion_created_time: (page as any).created_time,
            notion_last_edited_time: (page as any).last_edited_time,
            notion_page_status: 'active' // Restore to active status
          };
          
          console.log('Prepared restored content item:', JSON.stringify(contentItem, null, 2));
          
          // Update existing item with restored content
          const { error: updateError } = await supabase
            .from('content_items')
            .update(contentItem)
            .eq('notion_page_id', pageId)
            .eq('user_id', userId);
          
          if (updateError) {
            console.error('Error updating restored content item:', updateError);
            throw updateError;
          }
          
          console.log('Content item restored successfully:', pageId);
          
          return new Response(
            JSON.stringify({ 
              status: 'success', 
              message: `Page restored successfully`,
              page_id: pageId,
              user_id: userId,
              operation: 'restored'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
          
        } catch (notionError) {
          console.error('Error processing restored Notion page:', notionError);
          return new Response(
            JSON.stringify({ 
              status: 'error', 
              message: 'Failed to restore Notion content',
              error: notionError.message 
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            }
          );
        }
      }

      // Handle content update events (existing logic)
      if (eventType === 'page.created' || eventType === 'page.properties_updated' || eventType === 'page.content_updated') {
        if (!userProfile.notion_api_key) {
          console.error('No Notion API key configured for user:', userId);
          return new Response(
            JSON.stringify({ status: 'error', message: 'Notion API key not configured' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }
        
        try {
          // Initialize Notion client with user's API key
          const notion = new Client({ auth: userProfile.notion_api_key });
          
          // Fetch the updated page details
          console.log('Fetching page details for:', pageId);
          const page = await notion.pages.retrieve({ page_id: pageId });
          
          // Fetch page blocks
          console.log('Fetching page blocks for:', pageId);
          const { results: blocks } = await notion.blocks.children.list({
            block_id: pageId,
            page_size: 100,
          });
          
          // Process blocks using simplified processing for webhook
          const processedBlocks = await processBlocksForWebhook(blocks, notion);
          
          // Extract page properties
          const props = (page as any).properties || {};
          
          // Prepare content item data (matching sync-notion-database format)
          const contentItem = {
            title: extractProperty(props, 'Name', 'title') || extractProperty(props, 'Title', 'title') || 'Untitled',
            description: extractProperty(props, 'Description', 'rich_text'),
            category: extractProperty(props, 'Category', 'select'),
            tags: extractProperty(props, 'Tags', 'multi_select'),
            created_at: (page as any).created_time,
            updated_at: (page as any).last_edited_time,
            start_date: extractProperty(props, 'Start date', 'date'),
            end_date: extractProperty(props, 'End date', 'date'),
            notion_url: (page as any).url,
            user_id: userId,
            content: processedBlocks,
            notion_page_id: pageId,
            notion_created_time: (page as any).created_time,
            notion_last_edited_time: (page as any).last_edited_time,
            notion_page_status: 'active'
          };
          
          console.log('Prepared content item:', JSON.stringify(contentItem, null, 2));
          
          // Check if content item already exists
          const { data: existingItem } = await supabase
            .from('content_items')
            .select('id')
            .eq('notion_page_id', pageId)
            .eq('user_id', userId)
            .single();
          
          let operation = '';
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
            operation = 'updated';
            console.log('Content item updated successfully:', existingItem.id);
          } else {
            // Insert new item
            const { error: insertError } = await supabase
              .from('content_items')
              .insert(contentItem);
            
            if (insertError) {
              console.error('Error inserting content item:', insertError);
              throw insertError;
            }
            operation = 'inserted';
            console.log('Content item inserted successfully');
          }
          
          return new Response(
            JSON.stringify({ 
              status: 'success', 
              message: `Page ${operation} successfully`,
              page_id: pageId,
              user_id: userId,
              operation: operation
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
          
        } catch (notionError) {
          console.error('Error processing Notion page:', notionError);
          return new Response(
            JSON.stringify({ 
              status: 'error', 
              message: 'Failed to sync Notion content',
              error: notionError.message 
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            }
          );
        }
      }
    }

    // Log webhook type but don't error for unknown types
    console.log('Webhook payload type:', payload.type || 'undefined');
    return new Response(
      JSON.stringify({ status: 'success', message: 'Webhook received and processed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
