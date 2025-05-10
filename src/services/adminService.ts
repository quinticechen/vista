
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
export interface VectorSearchParams {
  query_embedding: number[];
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
        created_by: userId 
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
    const response = await supabase.functions.invoke('generate-embeddings', {
      body: { jobId }
    });
    
    if (response.error) {
      console.error("Error starting embedding process:", response.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception starting embedding process:", error);
    return false;
  }
}

// Perform semantic search using vector similarity
export async function semanticSearch(query: string, limit: number = 5): Promise<ContentItem[]> {
  try {
    // First generate an embedding for the search query
    const response = await supabase.functions.invoke('generate-query-embedding', {
      body: { text: query }
    });
    
    if (response.error || !response.data || !response.data.embedding) {
      console.error("Error generating query embedding:", response.error || "No embedding returned");
      return [];
    }
    
    const queryEmbedding = response.data.embedding;
    
    // Define parameters for vector search
    const searchParams: VectorSearchParams = {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: limit
    };
    
    // Use the rpc method correctly without specifying type parameters
    // Let TypeScript infer the types based on the function name and params
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
