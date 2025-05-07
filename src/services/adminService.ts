
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
    const { data, error } = await supabase
      .from('embedding_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error("Error fetching embedding jobs:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Exception fetching embedding jobs:", error);
    return [];
  }
}

// Get specific embedding job
export async function getEmbeddingJob(jobId: string): Promise<EmbeddingJob | null> {
  try {
    const { data, error } = await supabase
      .from('embedding_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error) {
      console.error("Error fetching embedding job:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Exception fetching embedding job:", error);
    return null;
  }
}

// Create a new embedding job
export async function createEmbeddingJob(userId: string): Promise<EmbeddingJob | null> {
  try {
    const { data, error } = await supabase
      .from('embedding_jobs')
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
    
    return data;
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
