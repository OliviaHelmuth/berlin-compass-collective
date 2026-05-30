export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      events: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          district: string | null
          ends_at: string | null
          external_id: string | null
          host: string | null
          id: string
          source: string | null
          starts_at: string
          submitted_by: string | null
          tags: string[]
          title: string
          url: string | null
          venue: string | null
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          ends_at?: string | null
          external_id?: string | null
          host?: string | null
          id?: string
          source?: string | null
          starts_at: string
          submitted_by?: string | null
          tags?: string[]
          title: string
          url?: string | null
          venue?: string | null
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          ends_at?: string | null
          external_id?: string | null
          host?: string | null
          id?: string
          source?: string | null
          starts_at?: string
          submitted_by?: string | null
          tags?: string[]
          title?: string
          url?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      location_posts: {
        Row: {
          body: string
          created_at: string
          id: string
          location_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          location_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          location_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_posts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          approved: boolean
          category: Database["public"]["Enums"]["location_category"]
          created_at: string
          description: string | null
          district: string | null
          id: string
          lat: number
          lng: number
          name: string
          submitted_by: string | null
          tags: string[]
          website: string | null
        }
        Insert: {
          address?: string | null
          approved?: boolean
          category: Database["public"]["Enums"]["location_category"]
          created_at?: string
          description?: string | null
          district?: string | null
          id?: string
          lat: number
          lng: number
          name: string
          submitted_by?: string | null
          tags?: string[]
          website?: string | null
        }
        Update: {
          address?: string | null
          approved?: boolean
          category?: Database["public"]["Enums"]["location_category"]
          created_at?: string
          description?: string | null
          district?: string | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          submitted_by?: string | null
          tags?: string[]
          website?: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          created_at: string
          deadline: string | null
          description: string | null
          district: string | null
          id: string
          opp_type: string
          org: string | null
          submitted_by: string | null
          tags: string[]
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          district?: string | null
          id?: string
          opp_type: string
          org?: string | null
          submitted_by?: string | null
          tags?: string[]
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          district?: string | null
          id?: string
          opp_type?: string
          org?: string | null
          submitted_by?: string | null
          tags?: string[]
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          arrival_status: string | null
          avatar_url: string | null
          background: string[]
          bio: string | null
          created_at: string
          current_focus: string[]
          display_name: string
          district: string | null
          german_level: string | null
          id: string
          industries: string[]
          interests: string[]
          looking_for: string[]
          onboarded_at: string | null
          residence_status: string | null
          role: string | null
          sector: string | null
          stage: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          arrival_status?: string | null
          avatar_url?: string | null
          background?: string[]
          bio?: string | null
          created_at?: string
          current_focus?: string[]
          display_name: string
          district?: string | null
          german_level?: string | null
          id: string
          industries?: string[]
          interests?: string[]
          looking_for?: string[]
          onboarded_at?: string | null
          residence_status?: string | null
          role?: string | null
          sector?: string | null
          stage?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          arrival_status?: string | null
          avatar_url?: string | null
          background?: string[]
          bio?: string | null
          created_at?: string
          current_focus?: string[]
          display_name?: string
          district?: string | null
          german_level?: string | null
          id?: string
          industries?: string[]
          interests?: string[]
          looking_for?: string[]
          onboarded_at?: string | null
          residence_status?: string | null
          role?: string | null
          sector?: string | null
          stage?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          cons: string | null
          created_at: string
          id: string
          location_id: string
          pros: string | null
          rating: number
          user_id: string
          would_recommend: boolean
        }
        Insert: {
          comment?: string | null
          cons?: string | null
          created_at?: string
          id?: string
          location_id: string
          pros?: string | null
          rating: number
          user_id: string
          would_recommend?: boolean
        }
        Update: {
          comment?: string | null
          cons?: string | null
          created_at?: string
          id?: string
          location_id?: string
          pros?: string | null
          rating?: number
          user_id?: string
          would_recommend?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      location_category:
        | "coworking"
        | "accelerator"
        | "incubator"
        | "university"
        | "vc"
        | "hub"
        | "service"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      location_category: [
        "coworking",
        "accelerator",
        "incubator",
        "university",
        "vc",
        "hub",
        "service",
      ],
    },
  },
} as const
