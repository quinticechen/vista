
import { supabase } from "@/integrations/supabase/client";

// Define the profile type to match our database
export interface Profile {
  id: string;
  is_admin: boolean;
  created_at?: string;
}

// Define the embedding job type
export interface EmbeddingJob {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  items_processed: number;
  total_items: number;
  error: string | null;
  created_by: string;
  updated_at: string;
}

// Define the content item type with embedding
export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  embedding?: number[];
  created_at?: string;
  updated_at?: string;
  similarity?: number;
}

// Define interface for vector search parameters
// Update: changed query_embedding type from number[] to string to match what the DB expects
export interface VectorSearchParams {
  query_embedding: string;
  match_threshold: number;
  match_count: number;
}

// Define the interface for match_content_items function return type
export interface MatchContentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  similarity: number;
}

// Check if a user is an admin
export async function checkAdminStatus(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
    
    return !!data?.is_admin;
  } catch (error) {
    console.error("Exception checking admin status:", error);
    return false;
  }
}

// Fetch embedding jobs
export async function fetchEmbeddingJobs(): Promise<EmbeddingJob[]> {
  try {
    // Use "embedding_jobs" as a string literal
    const { data, error } = await supabase
      .from("embedding_jobs")
      .select('*')
      .order('updated_at', { ascending: false }) // Changed from 'created_at' to 'updated_at'
      .limit(10);
    
    if (error) {
      console.error("Error fetching embedding jobs:", error);
      return [];
    }
    
    return data as EmbeddingJob[] || [];
  } catch (error) {
    console.error("Exception fetching embedding jobs:", error);
    return [];
  }
}

// Get specific embedding job
export async function getEmbeddingJob(jobId: string): Promise<EmbeddingJob | null> {
  try {
    // Use "embedding_jobs" as a string literal
    const { data, error } = await supabase
      .from("embedding_jobs")
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error) {
      console.error("Error fetching embedding job:", error);
      return null;
    }
    
    return data as EmbeddingJob;
  } catch (error) {
    console.error("Exception fetching embedding job:", error);
    return null;
  }
}

// Create a new embedding job
export async function createEmbeddingJob(userId: string): Promise<EmbeddingJob | null> {
  try {
    // Use "embedding_jobs" as a string literal
    const { data, error } = await supabase
      .from("embedding_jobs")
      .insert([{ 
        status: 'pending', 
        created_by: userId,
        items_processed: 0,
        total_items: 0,
        error: null
      }])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating embedding job:", error);
      return null;
    }
    
    return data as EmbeddingJob;
  } catch (error) {
    console.error("Exception creating embedding job:", error);
    return null;
  }
}

// Start the embedding process
export async function startEmbeddingProcess(jobId: string): Promise<boolean> {
  try {
    console.log(`Starting embedding process for job: ${jobId}`);
    const response = await supabase.functions.invoke('generate-embeddings', {
      body: { jobId }
    });
    
    if (response.error) {
      console.error("Error starting embedding process:", response.error);
      return false;
    }
    
    console.log("Embedding process started successfully");
    return true;
  } catch (error) {
    console.error("Exception starting embedding process:", error);
    return false;
  }
}

// Perform semantic search using vector similarity
export async function semanticSearch(
      query: string,
      limit: number = 8, 
      matchThreshold: number = 0.45 // Lower threshold to ensure we get results
): Promise<ContentItem[]> {
  try {
    // Log query length to help debug short query issues
    console.log(`Starting semantic search for query: "${query}" (length: ${query.length}) with limit: ${limit}, threshold: ${matchThreshold}`);
    
    // For very short queries, add some context to help the embedding generation
    const enrichedQuery = query.length < 5 
      ? `Find content related to the term: ${query}` 
      : query;
    
    console.log(`Using enriched query: "${enrichedQuery}"`);
    
    // First generate an embedding for the search query
    const response = await supabase.functions.invoke('generate-query-embedding', {
      body: { text: enrichedQuery }
    });
    
    if (response.error || !response.data || !response.data.embedding) {
      console.error("Error generating query embedding:", response.error || "No embedding returned");
      return [];
    }
    
    const queryEmbedding = response.data.embedding;
    console.log(`Successfully generated embedding with ${queryEmbedding.length} dimensions`);
    
    // Define parameters for vector search
    const searchParams: VectorSearchParams = {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: matchThreshold,
      match_count: limit
    };
    
    console.log(`Executing vector search with parameters:`, {
      match_threshold: matchThreshold,
      match_count: limit,
      embeddingLength: queryEmbedding.length
    });
    
    // Use the rpc method without specifying type parameters to let TypeScript infer them
    const { data, error } = await supabase.rpc(
      'match_content_items',
      searchParams
    );
    
    if (error) {
      console.error("Error executing vector search:", error);
      return [];
    }
    
    // Convert the results to ContentItem[]
    const results = data as MatchContentItem[];
    console.log(`Vector search returned ${results.length} results`);
    
    // Debug the first few results
    if (results.length > 0) {
      console.log("Top results:", results.slice(0, 3).map(r => ({
        title: r.title,
        similarity: r.similarity,
        category: r.category
      })));
    } else {
      console.log("No matching results found. Consider lowering the match threshold.");
    }
    
    // Map the results to ContentItem format
    return results.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      tags: item.tags,
      similarity: item.similarity
    }));
  } catch (error) {
    console.error("Exception during semantic search:", error);
    return [];
  }
}
