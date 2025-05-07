
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const vertexApiKey = Deno.env.get('VERTEX_AI_API_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    // Get the job ID from the request body
    const { jobId } = await req.json();

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start processing in the background
    EdgeRuntime.waitUntil(processContentEmbedding(jobId));

    return new Response(
      JSON.stringify({ message: 'Embedding process started' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processContentEmbedding(jobId: string) {
  try {
    // Update job status to processing
    await supabase
      .from('embedding_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId);

    // Get all content items
    const { data: contentItems, error: contentError } = await supabase
      .from('content_items')
      .select('*');

    if (contentError) {
      throw new Error(`Error fetching content items: ${contentError.message}`);
    }

    // Update total items count
    await supabase
      .from('embedding_jobs')
      .update({ total_items: contentItems.length })
      .eq('id', jobId);

    // Process each content item
    let itemsProcessed = 0;
    
    for (const item of contentItems) {
      try {
        // Prepare text for embedding
        const textToEmbed = [
          item.title,
          item.description,
          item.category,
          item.tags ? item.tags.join(' ') : ''
        ].filter(Boolean).join(' ');
        
        if (!textToEmbed.trim()) {
          console.log(`Skipping item ${item.id} - no text content`);
          continue; // Skip items with no text
        }

        // Generate embedding using Vertex AI
        const embedding = await generateEmbedding(textToEmbed);
        
        // Store embedding in Supabase
        await supabase
          .from('content_items')
          .update({ embedding })
          .eq('id', item.id);
        
        // Update processed count
        itemsProcessed++;
        await supabase
          .from('embedding_jobs')
          .update({ items_processed: itemsProcessed })
          .eq('id', jobId);
        
        // Add small delay to avoid API rate limits
        await new Promise(r => setTimeout(r, 100));
      } catch (error) {
        console.error(`Error processing content item ${item.id}:`, error);
      }
    }

    // Update job status to completed
    await supabase
      .from('embedding_jobs')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        items_processed: itemsProcessed,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    console.log(`Embedding job ${jobId} completed - ${itemsProcessed}/${contentItems.length} items processed`);
  } catch (error) {
    console.error(`Error processing embedding job ${jobId}:`, error);
    
    // Update job status to error
    await supabase
      .from('embedding_jobs')
      .update({ 
        status: 'error',
        error: error.message,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Call Vertex AI Embeddings API
    const response = await fetch('https://us-central1-aiplatform.googleapis.com/v1/projects/enduring-coder-409921/locations/us-central1/publishers/google/models/textembedding-gecko@001:predict', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vertexApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{ content: text }],
        parameters: { "outputDimensionality": 768 },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.predictions[0].embeddings.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}
