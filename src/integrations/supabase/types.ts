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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string | null
          created_at: string
          day_of_month: number | null
          days_of_week: string[] | null
          description: string
          end_date: string | null
          frequency: string | null
          frequency_type: string | null
          frequency_value: number | null
          goal_id: string
          id: string
          status: string | null
          target_value: string | null
          time_of_day: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type?: string | null
          created_at?: string
          day_of_month?: number | null
          days_of_week?: string[] | null
          description: string
          end_date?: string | null
          frequency?: string | null
          frequency_type?: string | null
          frequency_value?: number | null
          goal_id: string
          id?: string
          status?: string | null
          target_value?: string | null
          time_of_day?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type?: string | null
          created_at?: string
          day_of_month?: number | null
          days_of_week?: string[] | null
          description?: string
          end_date?: string | null
          frequency?: string | null
          frequency_type?: string | null
          frequency_value?: number | null
          goal_id?: string
          id?: string
          status?: string | null
          target_value?: string | null
          time_of_day?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          activity_id: string | null
          created_at: string
          date: string
          goal_id: string
          id: string
          input_type: string | null
          progress_value: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          date?: string
          goal_id: string
          id?: string
          input_type?: string | null
          progress_value: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          date?: string
          goal_id?: string
          id?: string
          input_type?: string | null
          progress_value?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_job_registry: {
        Row: {
          created_at: string | null
          id: number
          job_id: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          job_id?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          job_id?: string | null
          name?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          category: string | null
          created_at: string
          deeper_motivation: string | null
          description: string | null
          end_date: string | null
          id: string
          identity_motivation: string | null
          life_wheel_area: string[] | null
          parent_goal_id: string | null
          priority: string
          related_values: string[] | null
          start_date: string | null
          status: string | null
          success_checklist: Json | null
          surface_motivation: string | null
          target_date: string | null
          target_value: string | null
          title: string
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          deeper_motivation?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          identity_motivation?: string | null
          life_wheel_area?: string[] | null
          parent_goal_id?: string | null
          priority?: string
          related_values?: string[] | null
          start_date?: string | null
          status?: string | null
          success_checklist?: Json | null
          surface_motivation?: string | null
          target_date?: string | null
          target_value?: string | null
          title: string
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          deeper_motivation?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          identity_motivation?: string | null
          life_wheel_area?: string[] | null
          parent_goal_id?: string | null
          priority?: string
          related_values?: string[] | null
          start_date?: string | null
          status?: string | null
          success_checklist?: Json | null
          surface_motivation?: string | null
          target_date?: string | null
          target_value?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_parent_goal_id_fkey"
            columns: ["parent_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      history: {
        Row: {
          achievements: string[] | null
          completed_goals_count: number | null
          consistency_engagement: string | null
          created_at: string
          goal_achievement: string | null
          id: string
          personal_impact: string | null
          summary: string | null
          total_goals_count: number | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          achievements?: string[] | null
          completed_goals_count?: number | null
          consistency_engagement?: string | null
          created_at?: string
          goal_achievement?: string | null
          id?: string
          personal_impact?: string | null
          summary?: string | null
          total_goals_count?: number | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          achievements?: string[] | null
          completed_goals_count?: number | null
          consistency_engagement?: string | null
          created_at?: string
          goal_achievement?: string | null
          id?: string
          personal_impact?: string | null
          summary?: string | null
          total_goals_count?: number | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      life_wheel: {
        Row: {
          achieved_score: number | null
          area_name: string
          created_at: string
          current_score: number
          desired_score: number
          id: string
          is_focus_area: boolean | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          achieved_score?: number | null
          area_name: string
          created_at?: string
          current_score?: number
          desired_score?: number
          id?: string
          is_focus_area?: boolean | null
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          achieved_score?: number | null
          area_name?: string
          created_at?: string
          current_score?: number
          desired_score?: number
          id?: string
          is_focus_area?: boolean | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      monthly_reflections: {
        Row: {
          consistency: string | null
          created_at: string
          goal_progress: string | null
          id: string
          month: number
          overall_sentiment: number | null
          personal_evolution: string | null
          reflection_text: string | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          consistency?: string | null
          created_at?: string
          goal_progress?: string | null
          id?: string
          month: number
          overall_sentiment?: number | null
          personal_evolution?: string | null
          reflection_text?: string | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          consistency?: string | null
          created_at?: string
          goal_progress?: string | null
          id?: string
          month?: number
          overall_sentiment?: number | null
          personal_evolution?: string | null
          reflection_text?: string | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      notification_schedules: {
        Row: {
          active: boolean | null
          cadence: string
          created_at: string | null
          cron_expr: string | null
          id: string
          name: string
          next_run: string | null
          payload: Json
        }
        Insert: {
          active?: boolean | null
          cadence: string
          created_at?: string | null
          cron_expr?: string | null
          id?: string
          name: string
          next_run?: string | null
          payload: Json
        }
        Update: {
          active?: boolean | null
          cadence?: string
          created_at?: string | null
          cron_expr?: string | null
          id?: string
          name?: string
          next_run?: string | null
          payload?: Json
        }
        Relationships: []
      }
      notifications_queue: {
        Row: {
          created_at: string | null
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
          schedule_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          schedule_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_queue_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "notification_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          language: string | null
          name: string | null
          notifications_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          language?: string | null
          name?: string | null
          notifications_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          language?: string | null
          name?: string | null
          notifications_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          subscription: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          subscription: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          subscription?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      values: {
        Row: {
          created_at: string
          id: string
          selected: boolean
          updated_at: string
          user_id: string
          value_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          selected?: boolean
          updated_at?: string
          user_id: string
          value_name: string
        }
        Update: {
          created_at?: string
          id?: string
          selected?: boolean
          updated_at?: string
          user_id?: string
          value_name?: string
        }
        Relationships: []
      }
      vision: {
        Row: {
          created_at: string
          id: string
          phrase_year: string | null
          updated_at: string
          user_id: string
          vision_1y: string | null
          vision_3y: string | null
          vision_5y: string | null
          word_year: string | null
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          phrase_year?: string | null
          updated_at?: string
          user_id: string
          vision_1y?: string | null
          vision_3y?: string | null
          vision_5y?: string | null
          word_year?: string | null
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          phrase_year?: string | null
          updated_at?: string
          user_id?: string
          vision_1y?: string | null
          vision_3y?: string | null
          vision_5y?: string | null
          word_year?: string | null
          year?: number
        }
        Relationships: []
      }
      weekly_evaluations: {
        Row: {
          created_at: string
          id: string
          month: number
          scale_category: string
          scale_value: number
          updated_at: string
          user_id: string
          week_number: number
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          scale_category: string
          scale_value: number
          updated_at?: string
          user_id: string
          week_number: number
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          scale_category?: string
          scale_value?: number
          updated_at?: string
          user_id?: string
          week_number?: number
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      enqueue_due_notifications: { Args: never; Returns: undefined }
      enqueue_notification: {
        Args: { schedule_id: string }
        Returns: undefined
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
