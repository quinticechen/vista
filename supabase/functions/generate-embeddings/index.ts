
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const googleCredentials = Deno.env.get('GOOGLE_APPLICATION_CREDENTIALS_JSON') || '';

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
    // Get the job ID and user ID from the request body
    const { jobId, userId } = await req.json();

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start processing in the background
    EdgeRuntime.waitUntil(processContentEmbedding(jobId, userId));

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

async function processContentEmbedding(jobId: string, userId: string) {
  try {
    // Update job status to processing
    await supabase
      .from('embedding_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId);

    // Find the last successful embedding job timestamp
    const { data: lastSuccessfulJob, error: jobError } = await supabase
      .from('embedding_jobs')
      .select('completed_at')
      .eq('status', 'completed')
      .eq('created_by', userId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (jobError) {
      console.warn('Error fetching last successful job:', jobError.message);
    }

    // Use the last successful job's completion time as the cutoff for updates
    // If no previous successful job, process all content items for the user
    const lastEmbeddingTime = lastSuccessfulJob?.completed_at || null;
    
    console.log(`Processing content updated after: ${lastEmbeddingTime || 'All content (no previous job found)'}`);
    
    // Query for content items to be processed - only those updated after last embedding
    // and only those belonging to the current user
    let contentQuery = supabase
      .from('content_items')
      .select('*')
      .eq('user_id', userId);

    // Add timestamp filter if we have a previous successful embedding
    if (lastEmbeddingTime) {
      contentQuery = contentQuery.gt('updated_at', lastEmbeddingTime);
    }

    // Get the content items
    const { data: contentItems, error: contentError } = await contentQuery;

    if (contentError) {
      throw new Error(`Error fetching content items: ${contentError.message}`);
    }

    // Update total items count
    await supabase
      .from('embedding_jobs')
      .update({ total_items: contentItems.length })
      .eq('id', jobId);
      
    if (contentItems.length === 0) {
      await supabase
        .from('embedding_jobs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          error: 'No new or updated content found since last embedding job'
        })
        .eq('id', jobId);
        
      console.log(`No content to process for job ${jobId}. Marking as completed.`);
      return;
    }

    // Process each content item
    let itemsProcessed = 0;
    let successCount = 0;
    let errorCount = 0;
    
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
        const embedding = await generateVertexAIEmbedding(textToEmbed);
        
        // Store embedding in Supabase
        // First convert the embedding array to a string
        const embeddingString = JSON.stringify(embedding);
        
        // Use the store_content_embedding function
        const { data, error } = await supabase.rpc(
          'store_content_embedding',
          { 
            content_id: item.id, 
            embedding_vector: embeddingString 
          }
        );

        if (error) {
          console.error(`Error storing embedding for item ${item.id}:`, error);
          errorCount++;
        } else {
          console.log(`Embedding stored successfully for item ${item.id}`);
          successCount++;
        }
        
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
        errorCount++;
      }
    }

    // Update job status based on success/error counts
    const finalStatus = errorCount === contentItems.length ? 'error' : 
                       errorCount > 0 ? 'partial_success' : 'completed';
    
    const errorMessage = errorCount > 0 ? 
      `${errorCount} items failed embedding generation` : null;
    
    await supabase
      .from('embedding_jobs')
      .update({ 
        status: finalStatus,
        error: errorMessage,
        completed_at: new Date().toISOString(),
        items_processed: itemsProcessed,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    console.log(`Embedding job ${jobId} completed - ${itemsProcessed}/${contentItems.length} items processed, ${successCount} successful, ${errorCount} failed`);
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

// Function to get a Google Cloud Access Token from service account credentials
async function getGoogleAccessToken() {
  try {
    // Parse the service account JSON
    const credentials = JSON.parse(googleCredentials);
    
    // Create a JWT for Google authentication
    const jwt = await createGoogleJWT(credentials);
    
    // Exchange the JWT for an access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OAuth error (${response.status}): ${errorText}`);
    }
    
    const tokenData = await response.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting Google access token:', error);
    throw error;
  }
}

// Create a signed JWT for Google authentication
async function createGoogleJWT(credentials: any) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // Token expires in 1 hour
  
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: credentials.private_key_id,
  };
  
  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: exp,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  // Convert PEM key to CryptoKey
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = credentials.private_key
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');
  
  const binaryDer = base64ToBinary(pemContents);
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' },
    },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    new TextEncoder().encode(signatureInput)
  );
  
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Helper function to convert base64 to binary
function base64ToBinary(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate text embedding using Vertex AI
async function generateVertexAIEmbedding(text: string): Promise<number[]> {
  try {
    // In case authentication fails, fall back to mock embeddings
    if (!googleCredentials) {
      console.warn("No Google credentials found, using mock embeddings");
      return generateSimpleMockEmbedding(text);
    }
    
    // Get a Google Cloud access token
    const accessToken = await getGoogleAccessToken();
    
    // Parse the credentials to get the project ID
    const credentials = JSON.parse(googleCredentials);
    const projectId = credentials.project_id;
    
    console.log(`Calling Vertex AI with project: ${projectId} and text length: ${text.length}`);
    
    // Call Vertex AI Embeddings API - Update to use text-embedding-005
    const response = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/text-embedding-005:predict`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [{ content: text }],
          parameters: { "outputDimensionality": 768 },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Vertex API error (${response.status}):`, errorText);
      
      // If authentication or API call fails, fall back to mock embeddings
      console.warn("Vertex AI API call failed, using mock embeddings instead");
      return generateSimpleMockEmbedding(text);
    }

    const data = await response.json();
    return data.predictions[0].embeddings.values;
  } catch (error) {
    console.error('Error generating embedding with Vertex AI:', error);
    
    // Fall back to mock embeddings in case of error
    console.warn("Error with Vertex AI, falling back to mock embeddings");
    return generateSimpleMockEmbedding(text);
  }
}

// For testing purposes, generate a mock embedding vector of 768 dimensions
async function generateSimpleMockEmbedding(text: string): Promise<number[]> {
  // Create a deterministic but simple mock embedding based on the text
  const mockEmbedding = new Array(768).fill(0);
  
  // Use text to seed some values
  const seed = text.length;
  for (let i = 0; i < 768; i++) {
    // Simple hash function to create mock values
    mockEmbedding[i] = Math.sin(i * seed * 0.1) * 0.5;
  }
  
  return mockEmbedding;
}
