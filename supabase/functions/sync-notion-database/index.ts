
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { notionDatabaseId, notionApiKey, userId } = await req.json();
    
    if (!notionDatabaseId || !notionApiKey || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch the database from Notion
    const database = await fetchNotionDatabase(notionDatabaseId, notionApiKey);
    
    // Process and store each page
    for (const page of database) {
      await processNotionPage(page, notionApiKey, supabase, userId);
    }
    
    return new Response(
      JSON.stringify({ success: true, message: `Synced ${database.length} items from Notion` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchNotionDatabase(databaseId: string, apiKey: string): Promise<any[]> {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 100,
        sorts: [{ property: 'Created time', direction: 'descending' }]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Notion API error: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching Notion database:", error);
    throw error;
  }
}

async function processNotionPage(page: any, apiKey: string, supabase: any, userId: string): Promise<void> {
  try {
    // Extract page ID and URL
    const pageId = page.id;
    const notionUrl = page.url;
    
    // Extract properties
    const properties = page.properties;
    const title = properties.Name?.title?.[0]?.plain_text || 'Untitled';
    const description = properties.Description?.rich_text?.[0]?.plain_text || null;
    const category = properties.Category?.select?.name || null;
    const tags = properties.Tags?.multi_select?.map((tag: any) => tag.name) || [];
    const createdTime = properties['Created time']?.created_time || null;
    const updatedTime = properties['Last edited time']?.last_edited_time || null;
    const startDate = properties['Start date']?.date?.start || null;
    const endDate = properties['End date']?.date?.start || null;
    
    // Fetch page content blocks
    const pageContent = await fetchNotionPageContent(pageId, apiKey);
    
    // Prepare data for Supabase
    const contentData = {
      title,
      description,
      category,
      tags,
      created_at: createdTime,
      updated_at: updatedTime,
      start_date: startDate,
      end_date: endDate,
      notion_url: notionUrl,
      content: pageContent,
      user_id: userId,
      translation_status: 'pending',
      translated_languages: ['en']
    };
    
    // Check if the page already exists in Supabase
    const { data: existingPage } = await supabase
      .from('content_items')
      .select('id')
      .eq('notion_url', notionUrl)
      .eq('user_id', userId)
      .single();
    
    if (existingPage) {
      // Update existing page
      await supabase
        .from('content_items')
        .update(contentData)
        .eq('id', existingPage.id);
      
      console.log(`Updated page ${title} (${existingPage.id})`);
    } else {
      // Insert new page
      const { data, error } = await supabase
        .from('content_items')
        .insert(contentData)
        .select('id')
        .single();
      
      if (error) throw error;
      
      console.log(`Created page ${title} (${data.id})`);
    }
  } catch (error) {
    console.error(`Error processing page ${page.id}:`, error);
    throw error;
  }
}

async function fetchNotionPageContent(pageId: string, apiKey: string): Promise<any> {
  try {
    const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Notion API error: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error(`Error fetching page content for ${pageId}:`, error);
    throw error;
  }
}
