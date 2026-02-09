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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          category: string | null
          created_at: string
          download_url: string | null
          id: number
          image_url: string | null
          name: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          download_url?: string | null
          id?: number
          image_url?: string | null
          name?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          download_url?: string | null
          id?: number
          image_url?: string | null
          name?: string | null
        }
        Relationships: []
      }
      custom_units: {
        Row: {
          cameo_file_path: string | null
          category: string
          created_at: string
          display_name: string
          faction: string
          id: string
          internal_name: string
          name: string
          rules_json: Json
          shp_file_path: string | null
        }
        Insert: {
          cameo_file_path?: string | null
          category?: string
          created_at?: string
          display_name?: string
          faction?: string
          id?: string
          internal_name: string
          name: string
          rules_json?: Json
          shp_file_path?: string | null
        }
        Update: {
          cameo_file_path?: string | null
          category?: string
          created_at?: string
          display_name?: string
          faction?: string
          id?: string
          internal_name?: string
          name?: string
          rules_json?: Json
          shp_file_path?: string | null
        }
        Relationships: []
      }
      default_units: {
        Row: {
          armor_type: string | null
          build_time: number | null
          category: string
          cost: number
          created_at: string | null
          description: string | null
          faction: string
          id: string
          image_url: string | null
          name: string
          primary_damage: number | null
          primary_weapon: string | null
          secondary_damage: number | null
          secondary_weapon: string | null
          speed: number
          strength: number
          tech_level: number | null
          updated_at: string | null
        }
        Insert: {
          armor_type?: string | null
          build_time?: number | null
          category: string
          cost: number
          created_at?: string | null
          description?: string | null
          faction: string
          id: string
          image_url?: string | null
          name: string
          primary_damage?: number | null
          primary_weapon?: string | null
          secondary_damage?: number | null
          secondary_weapon?: string | null
          speed: number
          strength: number
          tech_level?: number | null
          updated_at?: string | null
        }
        Update: {
          armor_type?: string | null
          build_time?: number | null
          category?: string
          cost?: number
          created_at?: string | null
          description?: string | null
          faction?: string
          id?: string
          image_url?: string | null
          name?: string
          primary_damage?: number | null
          primary_weapon?: string | null
          secondary_damage?: number | null
          secondary_weapon?: string | null
          speed?: number
          strength?: number
          tech_level?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ppm_assets: {
        Row: {
          asset_code: string
          cameo_filename: string | null
          category: string
          created_at: string | null
          creator_name: string | null
          description: string | null
          faction: string
          id: string
          is_spotlighted: boolean | null
          name: string
          preview_image_url: string | null
          shp_filename: string | null
          source_url: string | null
          suggested_armor: string | null
          suggested_cost: number | null
          suggested_speed: number | null
          suggested_strength: number | null
          suggested_weapon: string | null
          tags: string[] | null
          updated_at: string | null
          voxel_filename: string | null
        }
        Insert: {
          asset_code: string
          cameo_filename?: string | null
          category: string
          created_at?: string | null
          creator_name?: string | null
          description?: string | null
          faction: string
          id?: string
          is_spotlighted?: boolean | null
          name: string
          preview_image_url?: string | null
          shp_filename?: string | null
          source_url?: string | null
          suggested_armor?: string | null
          suggested_cost?: number | null
          suggested_speed?: number | null
          suggested_strength?: number | null
          suggested_weapon?: string | null
          tags?: string[] | null
          updated_at?: string | null
          voxel_filename?: string | null
        }
        Update: {
          asset_code?: string
          cameo_filename?: string | null
          category?: string
          created_at?: string | null
          creator_name?: string | null
          description?: string | null
          faction?: string
          id?: string
          is_spotlighted?: boolean | null
          name?: string
          preview_image_url?: string | null
          shp_filename?: string | null
          source_url?: string | null
          suggested_armor?: string | null
          suggested_cost?: number | null
          suggested_speed?: number | null
          suggested_strength?: number | null
          suggested_weapon?: string | null
          tags?: string[] | null
          updated_at?: string | null
          voxel_filename?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          art_json: Json
          created_at: string | null
          id: string
          name: string
          project_id: string | null
          rules_json: Json
          shp_file_path: string | null
        }
        Insert: {
          art_json: Json
          created_at?: string | null
          id?: string
          name: string
          project_id?: string | null
          rules_json: Json
          shp_file_path?: string | null
        }
        Update: {
          art_json?: Json
          created_at?: string | null
          id?: string
          name?: string
          project_id?: string | null
          rules_json?: Json
          shp_file_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_units: {
        Row: {
          armor: string | null
          category: string
          cost: number
          created_at: string | null
          custom_image_url: string | null
          default_unit_id: string | null
          faction: string
          id: string
          name: string
          notes: string | null
          ppm_asset_id: string | null
          speed: number
          strength: number
          unit_code: string
          updated_at: string | null
          user_id: string | null
          weapon: string | null
        }
        Insert: {
          armor?: string | null
          category: string
          cost: number
          created_at?: string | null
          custom_image_url?: string | null
          default_unit_id?: string | null
          faction: string
          id?: string
          name: string
          notes?: string | null
          ppm_asset_id?: string | null
          speed: number
          strength: number
          unit_code: string
          updated_at?: string | null
          user_id?: string | null
          weapon?: string | null
        }
        Update: {
          armor?: string | null
          category?: string
          cost?: number
          created_at?: string | null
          custom_image_url?: string | null
          default_unit_id?: string | null
          faction?: string
          id?: string
          name?: string
          notes?: string | null
          ppm_asset_id?: string | null
          speed?: number
          strength?: number
          unit_code?: string
          updated_at?: string | null
          user_id?: string | null
          weapon?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_units_default_unit_id_fkey"
            columns: ["default_unit_id"]
            isOneToOne: false
            referencedRelation: "default_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_units_ppm_asset_id_fkey"
            columns: ["ppm_asset_id"]
            isOneToOne: false
            referencedRelation: "ppm_assets"
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
