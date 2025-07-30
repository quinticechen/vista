export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      content_items: {
        Row: {
          category: string | null
          content: Json | null
          content_translations: Json | null
          created_at: string | null
          description: string | null
          description_translations: Json | null
          embedding: string | null
          end_date: string | null
          id: string
          notion_created_time: string | null
          notion_last_edited_time: string | null
          notion_page_id: string | null
          notion_page_status: string | null
          notion_url: string | null
          start_date: string | null
          tags: string[] | null
          title: string
          title_translations: Json | null
          translated_languages: string[] | null
          translation_status: string | null
          updated_at: string | null
          user_id: string | null
          visitor_count: number | null
        }
        Insert: {
          category?: string | null
          content?: Json | null
          content_translations?: Json | null
          created_at?: string | null
          description?: string | null
          description_translations?: Json | null
          embedding?: string | null
          end_date?: string | null
          id?: string
          notion_created_time?: string | null
          notion_last_edited_time?: string | null
          notion_page_id?: string | null
          notion_page_status?: string | null
          notion_url?: string | null
          start_date?: string | null
          tags?: string[] | null
          title: string
          title_translations?: Json | null
          translated_languages?: string[] | null
          translation_status?: string | null
          updated_at?: string | null
          user_id?: string | null
          visitor_count?: number | null
        }
        Update: {
          category?: string | null
          content?: Json | null
          content_translations?: Json | null
          created_at?: string | null
          description?: string | null
          description_translations?: Json | null
          embedding?: string | null
          end_date?: string | null
          id?: string
          notion_created_time?: string | null
          notion_last_edited_time?: string | null
          notion_page_id?: string | null
          notion_page_status?: string | null
          notion_url?: string | null
          start_date?: string | null
          tags?: string[] | null
          title?: string
          title_translations?: Json | null
          translated_languages?: string[] | null
          translation_status?: string | null
          updated_at?: string | null
          user_id?: string | null
          visitor_count?: number | null
        }
        Relationships: []
      }
      embedding_jobs: {
        Row: {
          completed_at: string | null
          created_by: string | null
          error: string | null
          id: string
          items_processed: number
          started_at: string | null
          status: string
          total_items: number
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_by?: string | null
          error?: string | null
          id?: string
          items_processed?: number
          started_at?: string | null
          status?: string
          total_items?: number
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_by?: string | null
          error?: string | null
          id?: string
          items_processed?: number
          started_at?: string | null
          status?: string
          total_items?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      home_page_settings: {
        Row: {
          created_at: string | null
          custom_input_placeholder: string | null
          footer_name: string
          hero_description: string | null
          hero_subtitle: string
          hero_title: string
          id: string
          interactive_subtitle: string | null
          interactive_title: string
          option_buttons: Json | null
          profile_id: string
          submit_button_text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_input_placeholder?: string | null
          footer_name: string
          hero_description?: string | null
          hero_subtitle: string
          hero_title: string
          id?: string
          interactive_subtitle?: string | null
          interactive_title: string
          option_buttons?: Json | null
          profile_id: string
          submit_button_text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_input_placeholder?: string | null
          footer_name?: string
          hero_description?: string | null
          hero_subtitle?: string
          hero_title?: string
          id?: string
          interactive_subtitle?: string | null
          interactive_title?: string
          option_buttons?: Json | null
          profile_id?: string
          submit_button_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_page_settings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notion_webhook_verifications: {
        Row: {
          challenge_type: string | null
          created_at: string | null
          id: string
          received_at: string | null
          user_id: string | null
          verification_token: string
        }
        Insert: {
          challenge_type?: string | null
          created_at?: string | null
          id?: string
          received_at?: string | null
          user_id?: string | null
          verification_token: string
        }
        Update: {
          challenge_type?: string | null
          created_at?: string | null
          id?: string
          received_at?: string | null
          user_id?: string | null
          verification_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "notion_webhook_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          default_language: string
          id: string
          is_admin: boolean
          notion_api_key: string | null
          notion_database_id: string | null
          supported_ai_languages: string[] | null
          url_param: string | null
          verification_token: string | null
        }
        Insert: {
          created_at?: string | null
          default_language?: string
          id: string
          is_admin?: boolean
          notion_api_key?: string | null
          notion_database_id?: string | null
          supported_ai_languages?: string[] | null
          url_param?: string | null
          verification_token?: string | null
        }
        Update: {
          created_at?: string | null
          default_language?: string
          id?: string
          is_admin?: boolean
          notion_api_key?: string | null
          notion_database_id?: string | null
          supported_ai_languages?: string[] | null
          url_param?: string | null
          verification_token?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_visitor_count: {
        Args: { content_id: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_content_items: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          title: string
          description: string
          category: string
          tags: string[]
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      store_content_embedding: {
        Args: { content_id: string; embedding_vector: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
