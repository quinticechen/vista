
// Types for Notion sync function

export interface RequestBody {
  notionDatabaseId: string;
  notionApiKey: string;
  userId: string;
}

export interface NotionDatabaseItem {
  id: string;
  properties: Record<string, any>;
  url: string;
  created_time: string;
  last_edited_time: string;
}

export interface SyncResult {
  id: string;
  title?: string;
  operation: 'inserted' | 'updated' | 'failed' | 'marked as removed';
  error?: string;
}

export interface ImageBackupOptions {
  supabase: any;
  bucketName: string;
  userId: string;
  pageId: string;
  imageIndex: number;
}

// Define CORS headers for responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};
