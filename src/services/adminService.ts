
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  content?: Json;
  created_at?: string;
  updated_at?: string;
  start_date?: string;
  end_date?: string;
  user_id: string;
  notion_page_status?: string;
  notion_page_id?: string;
  embedding?: string | null;
  content_translations?: Json;
  description_translations?: Json;
  title_translations?: Json;
  cover_image?: string;
  is_heic_cover?: boolean;
  similarity?: number;
  orientation?: 'portrait' | 'landscape' | 'square';
  preview_image?: string;
  preview_is_heic?: boolean;
}

export interface EmbeddingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'partial_success';
  started_at: string;
  completed_at: string | null;
  items_processed: number;
  total_items: number;
  created_by: string | null;
  error: string | null;
}

export const semanticSearch = async (query: string): Promise<ContentItem[]> => {
  console.log(`Starting semantic search for query: "${query}"`);
  
  try {
    const { data, error } = await supabase.functions.invoke('generate-query-embedding', {
      body: { text: query }  // Changed from 'query' to 'text' to match edge function expectations
    });

    if (error) {
      console.error('Error generating query embedding:', error);
      throw new Error('Failed to generate query embedding');
    }

    const queryEmbedding = data.embedding;
    console.log(`Generated embedding for query: "${query}"`);

    // Get semantic search results
    const { data: results, error: searchError } = await supabase.rpc(
      'match_content_items',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.1, // Keep low threshold for initial search
        match_count: 50
      }
    );

    if (searchError) {
      console.error('Error performing semantic search:', searchError);
      throw new Error('Failed to perform semantic search');
    }

    console.log(`Semantic search returned ${results?.length || 0} results`);

    if (!results || results.length === 0) {
      return [];
    }

    // Filter results with similarity >= 50% (0.5)
    const filteredResults = results.filter(result => result.similarity >= 0.5);
    console.log(`Filtered to ${filteredResults.length} results with similarity >= 50%`);

    if (filteredResults.length === 0) {
      console.log('No results met the 50% similarity threshold');
      return [];
    }

    // Get full content items with all fields including content and cover_image
    const contentIds = filteredResults.map(result => result.id);
    const { data: fullContentItems, error: contentError } = await supabase
      .from('content_items')
      .select('*')
      .in('id', contentIds)
      .neq('notion_page_status', 'removed');

    if (contentError) {
      console.error('Error fetching full content items:', contentError);
      throw new Error('Failed to fetch content items');
    }

    // Process the content items to extract images and set proper orientation
    const { processNotionContent } = await import('../utils/notionContentProcessor');
    
    const processedItems = fullContentItems.map(item => {
      // Add similarity from search results
      const searchResult = filteredResults.find(r => r.id === item.id);
      const processed = processNotionContent(item);
      
      return {
        ...processed,
        similarity: searchResult?.similarity || 0
      };
    });

    console.log(`Processed ${processedItems.length} search results with image extraction`);
    
    // Sort by similarity (highest first)
    const sortedResults = processedItems.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    
    console.log(`Returning ${sortedResults.length} semantic search results (filtered for 50%+ similarity)`);
    return sortedResults;
  } catch (error) {
    console.error('Semantic search error:', error);
    throw error;
  }
};

export const getContentItem = async (id: string): Promise<ContentItem | null> => {
  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching content item:', error);
      throw new Error('Failed to fetch content item');
    }

    return data as ContentItem;
  } catch (error) {
    console.error('Get content item error:', error);
    return null;
  }
};

// Check if a user is an admin
export const checkAdminStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return data?.is_admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Fetch embedding jobs
export const fetchEmbeddingJobs = async (): Promise<EmbeddingJob[]> => {
  try {
    const { data, error } = await supabase
      .from('embedding_jobs')
      .select('*')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching embedding jobs:', error);
      throw new Error('Failed to fetch embedding jobs');
    }

    return data as EmbeddingJob[];
  } catch (error) {
    console.error('Error fetching embedding jobs:', error);
    return [];
  }
};

// Get a single embedding job by ID
export const getEmbeddingJob = async (jobId: string): Promise<EmbeddingJob | null> => {
  try {
    const { data, error } = await supabase
      .from('embedding_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching embedding job:', error);
      return null;
    }

    return data as EmbeddingJob;
  } catch (error) {
    console.error('Error fetching embedding job:', error);
    return null;
  }
};

// Create a new embedding job
export const createEmbeddingJob = async (userId: string): Promise<EmbeddingJob | null> => {
  try {
    const { data: contentCount, error: countError } = await supabase
      .from('content_items')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting content items:', countError);
      throw new Error('Failed to count content items');
    }

    const total = contentCount?.length || 0;

    const { data, error } = await supabase
      .from('embedding_jobs')
      .insert([
        { 
          status: 'pending',
          items_processed: 0,
          total_items: total,
          created_by: userId
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating embedding job:', error);
      throw new Error('Failed to create embedding job');
    }

    return data as EmbeddingJob;
  } catch (error) {
    console.error('Error creating embedding job:', error);
    return null;
  }
};

// Start the embedding process
export const startEmbeddingProcess = async (jobId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('generate-embeddings', {
      body: { jobId }
    });

    if (error) {
      console.error('Error starting embedding process:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error starting embedding process:', error);
    return false;
  }
};

