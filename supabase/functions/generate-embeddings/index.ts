
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    // Get job ID from request
    const { jobId } = await req.json();
    if (!jobId) {
      throw new Error("Job ID is required");
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get job info
    const { data: job, error: jobError } = await supabase
      .from('embedding_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error(`Failed to get job: ${jobError?.message || "Job not found"}`);
    }

    // Update job status to processing
    await supabase
      .from('embedding_jobs')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', jobId);

    // Get all content items
    const { data: contentItems, error: contentError } = await supabase
      .from('content_items')
      .select('id, title, description, category, tags');

    if (contentError) {
      throw new Error(`Failed to get content items: ${contentError.message}`);
    }

    // Update total items count
    await supabase
      .from('embedding_jobs')
      .update({ total_items: contentItems.length, updated_at: new Date().toISOString() })
      .eq('id', jobId);

    // Vertex AI API key
    const vertexApiKey = Deno.env.get('VERTEX_AI_API_KEY');
    if (!vertexApiKey) {
      throw new Error("VERTEX_AI_API_KEY is not set");
    }

    // Process each content item
    let itemsProcessed = 0;
    for (const item of contentItems) {
      try {
        // Prepare text for embedding
        const text = [
          item.title || "",
          item.description || "",
          item.category || "",
          ...(item.tags || [])
        ].filter(Boolean).join(" ");

        if (!text.trim()) {
          console.log(`Skipping item ${item.id} because it has no text content`);
          continue;
        }

        // Call Vertex AI Embedding API
        const response = await fetch(
          `https://us-central1-aiplatform.googleapis.com/v1/projects/vertex-ai-demo/locations/us-central1/publishers/google/models/textembedding-gecko:predict?key=${vertexApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instances: [{ content: text }],
              parameters: { output_embedding_vector: true }
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Vertex AI API error: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        const embedding = result.predictions[0].embeddings.values;

        // Store embedding in the content_items table
        await supabase
          .from('content_items')
          .update({ embedding })
          .eq('id', item.id);

        // Update progress
        itemsProcessed++;
        if (itemsProcessed % 5 === 0 || itemsProcessed === contentItems.length) {
          await supabase
            .from('embedding_jobs')
            .update({ 
              items_processed: itemsProcessed, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', jobId);
        }
      } catch (error) {
        console.error(`Error processing item ${item.id}:`, error);
      }
    }

    // Update job as completed
    await supabase
      .from('embedding_jobs')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString(),
        items_processed: itemsProcessed,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({ success: true, message: "Embedding generation completed", itemsProcessed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in generate-embeddings function:", error);

    // If we have a job ID, update its status to error
    try {
      const { jobId } = await req.json();
      if (jobId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    } catch (e) {
      console.error("Failed to update job status:", e);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
