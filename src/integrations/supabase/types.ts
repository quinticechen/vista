export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      content_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          notion_url: string | null
          start_date: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          notion_url?: string | null
          start_date?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          notion_url?: string | null
          start_date?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
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
      image_contents: {
        Row: {
          alt_text: string | null
          caption: string | null
          content_id: string | null
          id: string
          image_url: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          content_id?: string | null
          id?: string
          image_url: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          content_id?: string | null
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_contents_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      product_services: {
        Row: {
          content_id: string | null
          details: string | null
          id: string
          image_url: string | null
          name: string
          price: number | null
        }
        Insert: {
          content_id?: string | null
          details?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: number | null
        }
        Update: {
          content_id?: string | null
          details?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_services_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          is_admin: boolean
        }
        Insert: {
          created_at?: string | null
          id: string
          is_admin?: boolean
        }
        Update: {
          created_at?: string | null
          id?: string
          is_admin?: boolean
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_avatar: string | null
          author_name: string
          author_title: string | null
          content_id: string | null
          id: string
          quote: string
          rating: number | null
        }
        Insert: {
          author_avatar?: string | null
          author_name: string
          author_title?: string | null
          content_id?: string | null
          id?: string
          quote: string
          rating?: number | null
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          author_title?: string | null
          content_id?: string | null
          id?: string
          quote?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      text_contents: {
        Row: {
          body: string | null
          content_id: string | null
          format: string | null
          id: string
        }
        Insert: {
          body?: string | null
          content_id?: string | null
          format?: string | null
          id?: string
        }
        Update: {
          body?: string | null
          content_id?: string | null
          format?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "text_contents_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      video_contents: {
        Row: {
          content_id: string | null
          id: string
          provider: string | null
          thumbnail_url: string | null
          video_url: string
        }
        Insert: {
          content_id?: string | null
          id?: string
          provider?: string | null
          thumbnail_url?: string | null
          video_url: string
        }
        Update: {
          content_id?: string | null
          id?: string
          provider?: string | null
          thumbnail_url?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_contents_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
