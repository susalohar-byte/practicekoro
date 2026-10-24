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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_email: string
          admin_id: string | null
          admin_name: string | null
          admin_role: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          admin_email: string
          admin_id?: string | null
          admin_name?: string | null
          admin_role?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          admin_email?: string
          admin_id?: string | null
          admin_name?: string | null
          admin_role?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          category: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category: string
          description?: string | null
          id: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      attempt_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          is_marked_for_review: boolean
          marks_awarded: number
          question_id: string
          selected_option: string | null
          time_spent_seconds: number
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          is_marked_for_review?: boolean
          marks_awarded?: number
          question_id: string
          selected_option?: string | null
          time_spent_seconds?: number
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          is_marked_for_review?: boolean
          marks_awarded?: number
          question_id?: string
          selected_option?: string | null
          time_spent_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      audiobook_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      audiobook_listens: {
        Row: {
          audiobook_id: string
          created_at: string
          listen_date: string
          user_id: string
        }
        Insert: {
          audiobook_id: string
          created_at?: string
          listen_date?: string
          user_id: string
        }
        Update: {
          audiobook_id?: string
          created_at?: string
          listen_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audiobook_listens_audiobook_id_fkey"
            columns: ["audiobook_id"]
            isOneToOne: false
            referencedRelation: "audiobooks"
            referencedColumns: ["id"]
          },
        ]
      }
      audiobook_subjects: {
        Row: {
          category_id: string
          created_at: string
          display_order: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          display_order?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audiobook_subjects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "audiobook_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      audiobook_topics: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audiobook_topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "audiobook_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      audiobooks: {
        Row: {
          category_id: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          narrator: string | null
          published_at: string | null
          status: string
          subject_id: string
          thumbnail_url: string | null
          title: string
          topic_id: string | null
          updated_at: string
          youtube_url: string
          youtube_video_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          narrator?: string | null
          published_at?: string | null
          status?: string
          subject_id: string
          thumbnail_url?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
          youtube_url: string
          youtube_video_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          narrator?: string | null
          published_at?: string | null
          status?: string
          subject_id?: string
          thumbnail_url?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          youtube_url?: string
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audiobooks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "audiobook_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiobooks_subject_category_fkey"
            columns: ["subject_id", "category_id"]
            isOneToOne: false
            referencedRelation: "audiobook_subjects"
            referencedColumns: ["id", "category_id"]
          },
          {
            foreignKeyName: "audiobooks_topic_subject_fkey"
            columns: ["topic_id", "subject_id"]
            isOneToOne: false
            referencedRelation: "audiobook_topics"
            referencedColumns: ["id", "subject_id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          note: string | null
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean
          name: string
          order_index: number
          parent_id: string | null
          slug: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id: string
          is_active?: boolean
          name: string
          order_index?: number
          parent_id?: string | null
          slug: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          parent_id?: string | null
          slug?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usages: {
        Row: {
          coupon_id: string
          discount_amount: number
          final_amount: number
          id: string
          order_amount: number
          payment_id: string | null
          used_at: string
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          discount_amount: number
          final_amount: number
          id?: string
          order_amount: number
          payment_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          order_amount?: number
          payment_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_plan_id: string | null
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_discount_amount: number | null
          max_uses: number | null
          max_uses_per_user: number
          min_order_amount: number
          updated_at: string
          used_count: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          applicable_plan_id?: string | null
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number
          min_order_amount?: number
          updated_at?: string
          used_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          applicable_plan_id?: string | null
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number
          min_order_amount?: number
          updated_at?: string
          used_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_applicable_plan_id_fkey"
            columns: ["applicable_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      cutoff_records: {
        Row: {
          category: string
          created_at: string | null
          cutoff_marks: number
          cutoff_type: string
          district: string | null
          exam_id: string
          exam_title: string
          gender: string
          id: string
          max_marks: number
          negative_marking: number | null
          notes: string | null
          percentage: number | null
          score_type: string
          source: string
          source_type: string
          source_url: string | null
          stage: string
          status: string
          total_posts: string | null
          updated_at: string | null
          verification_status: string
          verified_by: string | null
          verified_date: string | null
          year: number
        }
        Insert: {
          category: string
          created_at?: string | null
          cutoff_marks: number
          cutoff_type: string
          district?: string | null
          exam_id: string
          exam_title: string
          gender?: string
          id?: string
          max_marks?: number
          negative_marking?: number | null
          notes?: string | null
          percentage?: number | null
          score_type?: string
          source: string
          source_type: string
          source_url?: string | null
          stage: string
          status?: string
          total_posts?: string | null
          updated_at?: string | null
          verification_status?: string
          verified_by?: string | null
          verified_date?: string | null
          year: number
        }
        Update: {
          category?: string
          created_at?: string | null
          cutoff_marks?: number
          cutoff_type?: string
          district?: string | null
          exam_id?: string
          exam_title?: string
          gender?: string
          id?: string
          max_marks?: number
          negative_marking?: number | null
          notes?: string | null
          percentage?: number | null
          score_type?: string
          source?: string
          source_type?: string
          source_url?: string | null
          stage?: string
          status?: string
          total_posts?: string | null
          updated_at?: string | null
          verification_status?: string
          verified_by?: string | null
          verified_date?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "cutoff_records_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          order_index?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      exam_cutoff_configs: {
        Row: {
          allowed_stages: Json | null
          category_enabled: boolean | null
          created_at: string | null
          default_max_marks: number | null
          default_score_type: string | null
          district_enabled: boolean | null
          exam_id: string
          gender_enabled: boolean | null
          stage_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_stages?: Json | null
          category_enabled?: boolean | null
          created_at?: string | null
          default_max_marks?: number | null
          default_score_type?: string | null
          district_enabled?: boolean | null
          exam_id: string
          gender_enabled?: boolean | null
          stage_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_stages?: Json | null
          category_enabled?: boolean | null
          created_at?: string | null
          default_max_marks?: number | null
          default_score_type?: string | null
          district_enabled?: boolean | null
          exam_id?: string
          gender_enabled?: boolean | null
          stage_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_cutoff_configs_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: true
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_topics: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          order_index: number
          topic_id: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          order_index?: number
          topic_id: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          order_index?: number
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_topics_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          banner_url: string | null
          category: string
          created_at: string
          description: string | null
          icon_name: string
          id: string
          is_active: boolean
          order_index: number
          short_name: string | null
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          icon_name?: string
          id: string
          is_active?: boolean
          order_index?: number
          short_name?: string | null
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean
          order_index?: number
          short_name?: string | null
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      image_upload_limits: {
        Row: {
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          request_count: number
          user_id: string
          window_start: string
        }
        Update: {
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      live_test_participants: {
        Row: {
          accuracy: number | null
          attempt_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          joined_at: string | null
          live_test_id: string
          rank: number | null
          registered_at: string
          score: number | null
          status: string
          time_taken: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          attempt_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          live_test_id: string
          rank?: number | null
          registered_at?: string
          score?: number | null
          status?: string
          time_taken?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          attempt_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          live_test_id?: string
          rank?: number | null
          registered_at?: string
          score?: number | null
          status?: string
          time_taken?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_test_participants_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_test_participants_live_test_id_fkey"
            columns: ["live_test_id"]
            isOneToOne: false
            referencedRelation: "live_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      live_tests: {
        Row: {
          created_at: string
          duration_minutes: number
          enrolled_count: number
          exam_id: string | null
          exam_logo: string | null
          id: string
          instructions: string | null
          is_published: boolean
          logo: string | null
          negative_marking: number
          ranking_enabled: boolean
          registration_deadline: string | null
          scheduled_end_time: string | null
          scheduled_start_time: string | null
          start_at: string
          status: string
          subscription_required: boolean
          test_id: string
          test_series_id: string | null
          title: string | null
          total_marks: number
          total_questions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          enrolled_count?: number
          exam_id?: string | null
          exam_logo?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          logo?: string | null
          negative_marking?: number
          ranking_enabled?: boolean
          registration_deadline?: string | null
          scheduled_end_time?: string | null
          scheduled_start_time?: string | null
          start_at: string
          status?: string
          subscription_required?: boolean
          test_id: string
          test_series_id?: string | null
          title?: string | null
          total_marks?: number
          total_questions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          enrolled_count?: number
          exam_id?: string | null
          exam_logo?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          logo?: string | null
          negative_marking?: number
          ranking_enabled?: boolean
          registration_deadline?: string | null
          scheduled_end_time?: string | null
          scheduled_start_time?: string | null
          start_at?: string
          status?: string
          subscription_required?: boolean
          test_id?: string
          test_series_id?: string | null
          title?: string | null
          total_marks?: number
          total_questions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_tests_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_tests_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_tests_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "user_test_access"
            referencedColumns: ["test_id"]
          },
          {
            foreignKeyName: "live_tests_test_series_id_fkey"
            columns: ["test_series_id"]
            isOneToOne: false
            referencedRelation: "test_series"
            referencedColumns: ["id"]
          },
        ]
      }
      mistakes: {
        Row: {
          created_at: string
          id: string
          is_resolved: boolean
          last_attempt_id: string | null
          last_reviewed_at: string | null
          question_id: string
          updated_at: string
          user_id: string
          wrong_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_resolved?: boolean
          last_attempt_id?: string | null
          last_reviewed_at?: string | null
          question_id: string
          updated_at?: string
          user_id: string
          wrong_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_resolved?: boolean
          last_attempt_id?: string | null
          last_reviewed_at?: string | null
          question_id?: string
          updated_at?: string
          user_id?: string
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "mistakes_last_attempt_id_fkey"
            columns: ["last_attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mistakes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_gateway_requests: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          outcome: string
          provider_reference: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id: string
          outcome?: string
          provider_reference?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          outcome?: string
          provider_reference?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_link: string | null
          channel: string
          created_at: string
          created_by: string | null
          id: string
          message: string
          recipient_ids: string[]
          scheduled_at: string | null
          sent_at: string | null
          status: string
          target_audience: string
          title: string
          type: string | null
        }
        Insert: {
          action_link?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          recipient_ids?: string[]
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          target_audience?: string
          title: string
          type?: string | null
        }
        Update: {
          action_link?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          recipient_ids?: string[]
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          target_audience?: string
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      payment_gateways: {
        Row: {
          created_at: string
          gateway: string
          is_active: boolean
          key_id: string | null
          key_secret: string | null
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          created_at?: string
          gateway: string
          is_active?: boolean
          key_id?: string | null
          key_secret?: string | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          created_at?: string
          gateway?: string
          is_active?: boolean
          key_id?: string | null
          key_secret?: string | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: []
      }
      payment_health_alerts: {
        Row: {
          detail: Json
          first_seen_at: string
          id: string
          kind: string
          last_seen_at: string
          message: string
          occurrences: number
          ref: string
          resolved_at: string | null
          resolved_by: string | null
          source: string
        }
        Insert: {
          detail?: Json
          first_seen_at?: string
          id?: string
          kind: string
          last_seen_at?: string
          message: string
          occurrences?: number
          ref: string
          resolved_at?: string | null
          resolved_by?: string | null
          source: string
        }
        Update: {
          detail?: Json
          first_seen_at?: string
          id?: string
          kind?: string
          last_seen_at?: string
          message?: string
          occurrences?: number
          ref?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          from_plan_id: string | null
          gateway: string
          id: string
          order_id: string | null
          plan_id: string | null
          purchase_type: string | null
          raw_response: Json | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          refund_amount: number | null
          refund_id: string | null
          refund_reason: string | null
          refunded_at: string | null
          refunded_by: string | null
          status: string
          target_subscription_id: string | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string
          verification_version: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          from_plan_id?: string | null
          gateway?: string
          id?: string
          order_id?: string | null
          plan_id?: string | null
          purchase_type?: string | null
          raw_response?: Json | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          refund_amount?: number | null
          refund_id?: string | null
          refund_reason?: string | null
          refunded_at?: string | null
          refunded_by?: string | null
          status?: string
          target_subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
          verification_version?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          from_plan_id?: string | null
          gateway?: string
          id?: string
          order_id?: string | null
          plan_id?: string | null
          purchase_type?: string | null
          raw_response?: Json | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          refund_amount?: number | null
          refund_id?: string | null
          refund_reason?: string | null
          refunded_at?: string | null
          refunded_by?: string | null
          status?: string
          target_subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
          verification_version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_from_plan_id_fkey"
            columns: ["from_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_target_subscription_id_fkey"
            columns: ["target_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          admin_role: string | null
          avatar_url: string | null
          category: string | null
          created_at: string
          district: string | null
          dob: string | null
          email: string | null
          full_name: string
          gender: string | null
          id: string
          phone: string | null
          preferred_subjects: Json | null
          preparation_status: string | null
          role: string
          state: string | null
          target_exam_id: string | null
          target_exam_title: string | null
          updated_at: string
        }
        Insert: {
          account_status?: string
          admin_role?: string | null
          avatar_url?: string | null
          category?: string | null
          created_at?: string
          district?: string | null
          dob?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id: string
          phone?: string | null
          preferred_subjects?: Json | null
          preparation_status?: string | null
          role?: string
          state?: string | null
          target_exam_id?: string | null
          target_exam_title?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: string
          admin_role?: string | null
          avatar_url?: string | null
          category?: string | null
          created_at?: string
          district?: string | null
          dob?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          phone?: string | null
          preferred_subjects?: Json | null
          preparation_status?: string | null
          role?: string
          state?: string | null
          target_exam_id?: string | null
          target_exam_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          chapter_id: string | null
          correct_option: string
          created_at: string
          default_marks: number
          default_negative_marks: number
          difficulty: string | null
          explanation: string | null
          explanation_bengali: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_live_only: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_bengali_text: string | null
          question_text: string
          question_type: string | null
          section: string | null
          source_exam: string | null
          source_paper: string | null
          source_shift: string | null
          source_type: string | null
          source_year: number | null
          status: string
          subject_id: string | null
          subtopic: string | null
          tags: Json
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          chapter_id?: string | null
          correct_option: string
          created_at?: string
          default_marks?: number
          default_negative_marks?: number
          difficulty?: string | null
          explanation?: string | null
          explanation_bengali?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_live_only?: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_bengali_text?: string | null
          question_text: string
          question_type?: string | null
          section?: string | null
          source_exam?: string | null
          source_paper?: string | null
          source_shift?: string | null
          source_type?: string | null
          source_year?: number | null
          status?: string
          subject_id?: string | null
          subtopic?: string | null
          tags?: Json
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          chapter_id?: string | null
          correct_option?: string
          created_at?: string
          default_marks?: number
          default_negative_marks?: number
          difficulty?: string | null
          explanation?: string | null
          explanation_bengali?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_live_only?: boolean
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_bengali_text?: string | null
          question_text?: string
          question_type?: string | null
          section?: string | null
          source_exam?: string | null
          source_paper?: string | null
          source_shift?: string | null
          source_type?: string | null
          source_year?: number | null
          status?: string
          subject_id?: string | null
          subtopic?: string | null
          tags?: Json
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      student_batch_members: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          batch_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          batch_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          batch_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_batch_members_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "student_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      student_batches: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_notes: {
        Row: {
          author_id: string | null
          author_name: string
          created_at: string
          id: string
          note: string
          student_id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string
          created_at?: string
          id?: string
          note: string
          student_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          created_at?: string
          id?: string
          note?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          exam_id: string | null
          icon_name: string
          id: string
          is_active: boolean
          name: string
          order_index: number
          slug: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          exam_id?: string | null
          icon_name?: string
          id: string
          is_active?: boolean
          name: string
          order_index?: number
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          exam_id?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_changes: {
        Row: {
          change_type: string
          created_at: string
          from_plan_id: string | null
          id: string
          new_expires_at: string
          payment_id: string
          previous_expires_at: string
          renewal_subscription_id: string | null
          reverted_at: string | null
          subscription_id: string
          to_plan_id: string
          user_id: string
        }
        Insert: {
          change_type: string
          created_at?: string
          from_plan_id?: string | null
          id?: string
          new_expires_at: string
          payment_id: string
          previous_expires_at: string
          renewal_subscription_id?: string | null
          reverted_at?: string | null
          subscription_id: string
          to_plan_id: string
          user_id: string
        }
        Update: {
          change_type?: string
          created_at?: string
          from_plan_id?: string | null
          id?: string
          new_expires_at?: string
          payment_id?: string
          previous_expires_at?: string
          renewal_subscription_id?: string | null
          reverted_at?: string | null
          subscription_id?: string
          to_plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_changes_from_plan_id_fkey"
            columns: ["from_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_changes_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_changes_renewal_subscription_id_fkey"
            columns: ["renewal_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_changes_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_changes_to_plan_id_fkey"
            columns: ["to_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_expiry_reminders: {
        Row: {
          expires_at: string
          notification_id: string | null
          reminder_kind: string
          sent_at: string
          subscription_id: string
        }
        Insert: {
          expires_at: string
          notification_id?: string | null
          reminder_kind: string
          sent_at?: string
          subscription_id: string
        }
        Update: {
          expires_at?: string
          notification_id?: string | null
          reminder_kind?: string
          sent_at?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_expiry_reminders_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_expiry_reminders_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          duration_days: number
          features: Json
          id: string
          is_active: boolean
          name: string | null
          order_index: number
          original_price: number | null
          price: number
          renewal_window_days: number | null
          title: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number
          features?: Json
          id: string
          is_active?: boolean
          name?: string | null
          order_index?: number
          original_price?: number | null
          price: number
          renewal_window_days?: number | null
          title: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number
          features?: Json
          id?: string
          is_active?: boolean
          name?: string | null
          order_index?: number
          original_price?: number | null
          price?: number
          renewal_window_days?: number | null
          title?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          payment_id: string | null
          plan_id: string
          renewed_from_subscription_id: string | null
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          payment_id?: string | null
          plan_id: string
          renewed_from_subscription_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          payment_id?: string | null
          plan_id?: string
          renewed_from_subscription_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_renewed_from_subscription_id_fkey"
            columns: ["renewed_from_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          author_id: string | null
          author_kind: string
          author_name: string
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          author_kind: string
          author_name: string
          body: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          author_kind?: string
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          id: string
          issue: string
          priority: string
          resolution_notes: string | null
          status: string
          student_email: string | null
          student_name: string | null
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          issue: string
          priority?: string
          resolution_notes?: string | null
          status?: string
          student_email?: string | null
          student_name?: string | null
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          issue?: string
          priority?: string
          resolution_notes?: string | null
          status?: string
          student_email?: string | null
          student_name?: string | null
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      test_attempts: {
        Row: {
          accuracy: number
          correct_count: number
          created_at: string
          end_time: string | null
          id: string
          percentile: number | null
          rank: number | null
          score: number
          skipped_count: number
          start_time: string
          status: string
          test_id: string
          time_spent_seconds: number
          total_marks: number
          user_id: string
          wrong_count: number
        }
        Insert: {
          accuracy?: number
          correct_count?: number
          created_at?: string
          end_time?: string | null
          id?: string
          percentile?: number | null
          rank?: number | null
          score?: number
          skipped_count?: number
          start_time?: string
          status?: string
          test_id: string
          time_spent_seconds?: number
          total_marks?: number
          user_id: string
          wrong_count?: number
        }
        Update: {
          accuracy?: number
          correct_count?: number
          created_at?: string
          end_time?: string | null
          id?: string
          percentile?: number | null
          rank?: number | null
          score?: number
          skipped_count?: number
          start_time?: string
          status?: string
          test_id?: string
          time_spent_seconds?: number
          total_marks?: number
          user_id?: string
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "user_test_access"
            referencedColumns: ["test_id"]
          },
        ]
      }
      test_exams: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          test_id: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          test_id: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_exams_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_exams_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_exams_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "user_test_access"
            referencedColumns: ["test_id"]
          },
        ]
      }
      test_questions: {
        Row: {
          created_at: string
          id: string
          marks: number
          negative_marks: number
          question_id: string
          question_order: number
          test_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          marks?: number
          negative_marks?: number
          question_id: string
          question_order: number
          test_id: string
        }
        Update: {
          created_at?: string
          id?: string
          marks?: number
          negative_marks?: number
          question_id?: string
          question_order?: number
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "user_test_access"
            referencedColumns: ["test_id"]
          },
        ]
      }
      test_results: {
        Row: {
          accuracy: number
          attempt_id: string
          created_at: string
          id: string
          passed: boolean
          percentage: number
          percentile: number | null
          rank: number | null
          score: number
          test_id: string
          total_candidates: number | null
          total_marks: number
          user_id: string
        }
        Insert: {
          accuracy?: number
          attempt_id: string
          created_at?: string
          id?: string
          passed?: boolean
          percentage?: number
          percentile?: number | null
          rank?: number | null
          score?: number
          test_id: string
          total_candidates?: number | null
          total_marks?: number
          user_id: string
        }
        Update: {
          accuracy?: number
          attempt_id?: string
          created_at?: string
          id?: string
          passed?: boolean
          percentage?: number
          percentile?: number | null
          rank?: number | null
          score?: number
          test_id?: string
          total_candidates?: number | null
          total_marks?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "user_test_access"
            referencedColumns: ["test_id"]
          },
        ]
      }
      test_series: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          exam_id: string
          icon_url: string | null
          id: string
          is_active: boolean
          is_popular: boolean
          is_premium: boolean
          order_index: number
          slug: string
          status: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          exam_id: string
          icon_url?: string | null
          id: string
          is_active?: boolean
          is_popular?: boolean
          is_premium?: boolean
          order_index?: number
          slug: string
          status?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          exam_id?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          is_premium?: boolean
          order_index?: number
          slug?: string
          status?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_series_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          chapter_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          exam_date: string | null
          exam_id: string
          icon_url: string | null
          id: string
          is_active: boolean
          is_live_only: boolean
          is_premium: boolean
          negative_marking: number
          order_index: number
          paper_name: string | null
          passing_marks: number
          set_name: string | null
          shift: string | null
          slug: string
          status: string
          subject_id: string | null
          test_series_id: string | null
          test_type: string
          title: string
          total_marks: number
          total_questions: number
          updated_at: string
          year: number | null
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          exam_date?: string | null
          exam_id: string
          icon_url?: string | null
          id: string
          is_active?: boolean
          is_live_only?: boolean
          is_premium?: boolean
          negative_marking?: number
          order_index?: number
          paper_name?: string | null
          passing_marks?: number
          set_name?: string | null
          shift?: string | null
          slug: string
          status?: string
          subject_id?: string | null
          test_series_id?: string | null
          test_type?: string
          title: string
          total_marks?: number
          total_questions?: number
          updated_at?: string
          year?: number | null
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          exam_date?: string | null
          exam_id?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          is_live_only?: boolean
          is_premium?: boolean
          negative_marking?: number
          order_index?: number
          paper_name?: string | null
          passing_marks?: number
          set_name?: string | null
          shift?: string | null
          slug?: string
          status?: string
          subject_id?: string | null
          test_series_id?: string | null
          test_type?: string
          title?: string
          total_marks?: number
          total_questions?: number
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tests_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_test_series_id_fkey"
            columns: ["test_series_id"]
            isOneToOne: false
            referencedRelation: "test_series"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_test_access: {
        Row: {
          has_access: boolean | null
          is_premium: boolean | null
          slug: string | null
          status: string | null
          test_id: string | null
          title: string | null
        }
        Insert: {
          has_access?: never
          is_premium?: boolean | null
          slug?: string | null
          status?: string | null
          test_id?: string | null
          title?: string | null
        }
        Update: {
          has_access?: never
          is_premium?: boolean | null
          slug?: string | null
          status?: string | null
          test_id?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      account_is_active: { Args: { p_user_id: string }; Returns: boolean }
      activate_verified_razorpay_payment: {
        Args: {
          p_order_id: string
          p_payment_id: string
          p_plan_id: string
          p_signature: string
          p_user_id: string
        }
        Returns: Json
      }
      admin_analytics_overview: {
        Args: {
          p_buckets?: Json
          p_end: string
          p_month_end: string
          p_month_start: string
          p_start: string
        }
        Returns: Json
      }
      admin_assign_series_tests: {
        Args: { p_ids: string[]; p_series_id?: string }
        Returns: Json
      }
      admin_dashboard_overview_stats: {
        Args: {
          p_month_start: string
          p_today_start: string
          p_year_start: string
        }
        Returns: Json
      }
      admin_dashboard_range_stats: { Args: { p_ranges: Json }; Returns: Json }
      admin_delete_record: {
        Args: { p_id: string; p_table: string }
        Returns: Json
      }
      admin_get_payment_gateway: { Args: { p_gateway?: string }; Returns: Json }
      admin_get_payment_health: { Args: never; Returns: Json }
      admin_modify_subscription: {
        Args: {
          p_action: string
          p_days?: number
          p_id: string
          p_plan_id?: string
        }
        Returns: Json
      }
      admin_mutate_collection: {
        Args: {
          p_action: string
          p_collection: string
          p_id?: string
          p_item?: Json
        }
        Returns: Json
      }
      admin_net_payment_paise: {
        Args: {
          p_amount: number
          p_raw_response: Json
          p_refund_amount: number
          p_status: string
        }
        Returns: number
      }
      admin_rankings_aggregate: {
        Args: {
          p_exam?: string
          p_excluded_emails?: string[]
          p_scope_types?: string[]
          p_since?: string
          p_subject?: string
          p_test_types?: string[]
        }
        Returns: Json
      }
      admin_reporting_earliest: {
        Args: {
          p_all_payment_statuses?: boolean
          p_end: string
          p_start: string
        }
        Returns: Json
      }
      admin_resolve_payment_alert: {
        Args: { p_alert_id: string }
        Returns: boolean
      }
      admin_revenue_range_stats: {
        Args: { p_end: string; p_start: string }
        Returns: Json
      }
      admin_save_exam_topics: {
        Args: { p_exam_id: string; p_topic_ids: string[] }
        Returns: Json
      }
      admin_save_test_exams: {
        Args: { p_exam_ids: string[]; p_test_id: string }
        Returns: Json
      }
      admin_scope_allowed: { Args: { p_scope: string }; Returns: boolean }
      admin_update_app_settings: { Args: { p_settings: Json }; Returns: Json }
      admin_update_payment_gateway: {
        Args: {
          p_gateway: string
          p_is_active?: boolean
          p_key_id: string
          p_key_secret?: string
          p_webhook_secret?: string
        }
        Returns: Json
      }
      app_setting_write_allowed: { Args: { p_id: string }; Returns: boolean }
      apply_captured_subscription_payment: {
        Args: {
          p_event_id?: string
          p_gateway_payment_id: string
          p_payment_row_id: string
          p_signature: string
          p_source: string
        }
        Returns: Json
      }
      archive_test: { Args: { p_test_id: string }; Returns: Json }
      assign_admin_staff_by_email: {
        Args: { p_admin_role: string; p_email: string }
        Returns: Json
      }
      bulk_assign_students_to_batch: {
        Args: { p_batch_id: string; p_user_ids: string[] }
        Returns: number
      }
      bulk_grant_student_subscription: {
        Args: {
          p_duration_days: number
          p_plan_id: string
          p_user_ids: string[]
        }
        Returns: number
      }
      can_manage_support: { Args: never; Returns: boolean }
      can_mutate_admin_record: {
        Args: { p_delete?: boolean; p_table: string }
        Returns: boolean
      }
      check_payment_health: { Args: never; Returns: number }
      create_razorpay_order: { Args: { p_plan_id: string }; Returns: Json }
      create_support_ticket: {
        Args: {
          p_category?: string
          p_issue: string
          p_priority?: string
          p_student_email: string
          p_student_name: string
          p_subject: string
          p_user_id?: string
        }
        Returns: Json
      }
      create_targeted_notification: {
        Args: {
          p_channel: string
          p_message: string
          p_title: string
          p_user_ids: string[]
        }
        Returns: string
      }
      dispatch_subscription_expiry_reminders: { Args: never; Returns: number }
      expire_lapsed_subscriptions: {
        Args: { p_user_id?: string }
        Returns: number
      }
      get_admin_audiobook_stats: { Args: never; Returns: Json }
      get_admin_dashboard_counts: { Args: never; Returns: Json }
      get_admin_dashboard_v2_stats: { Args: never; Returns: Json }
      get_admin_district_rankings: {
        Args: { p_exam_id?: string; p_from?: string; p_to?: string }
        Returns: {
          attempts_count: number
          avg_percentage: number
          district: string
          student_count: number
          top_student_name: string
          top_student_score: number
        }[]
      }
      get_admin_payments: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
        }
        Returns: Json
      }
      get_admin_students: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_plan?: string
          p_search?: string
          p_status?: string
        }
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          expires_at: string
          full_name: string
          id: string
          is_pro: boolean
          last_active: string
          phone: string
          plan_id: string
          plan_title: string
          subscription_status: string
          total_attempts: number
        }[]
      }
      get_admin_subscriptions: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
        }
        Returns: Json
      }
      get_app_leaderboard: {
        Args: {
          p_district?: string
          p_exam_name?: string
          p_from?: string
          p_scope?: string
        }
        Returns: {
          average_percentage: number
          display_name: string
          district: string
          rank: number
          tests_count: number
        }[]
      }
      get_attempt_rankings: { Args: { p_attempt_id: string }; Returns: Json }
      get_attempt_solutions: { Args: { p_attempt_id: string }; Returns: Json }
      get_my_subscription_purchase_options: { Args: never; Returns: Json }
      get_public_seo_question_by_id: {
        Args: { p_question_id: string }
        Returns: Json
      }
      get_public_seo_questions: {
        Args: { p_limit?: number; p_search?: string; p_subject_id?: string }
        Returns: Json
      }
      get_student_exam_questions: { Args: { p_test_id: string }; Returns: Json }
      get_student_subscription_details: { Args: never; Returns: Json }
      get_test_leaderboard: {
        Args: {
          p_block?: string
          p_district?: string
          p_limit?: number
          p_scope?: string
          p_test_id?: string
        }
        Returns: {
          avatar_url: string
          block: string
          district: string
          is_current_user: boolean
          percentage: number
          rank: number
          score: number
          student_name: string
          total_marks: number
          user_id: string
        }[]
      }
      get_test_series_analytics: {
        Args: { p_series_id: string }
        Returns: Json
      }
      get_test_series_leaderboard: {
        Args: { p_district?: string; p_series_id?: string }
        Returns: Json
      }
      has_active_subscription: {
        Args: { p_user_id?: string }
        Returns: boolean
      }
      has_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: boolean
      }
      has_test_access: {
        Args: { p_test_id: string; p_user_id: string }
        Returns: boolean
      }
      increment_banner_click: {
        Args: { p_banner_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_live_test_active: {
        Args: {
          lt: Database["public"]["Tables"]["live_tests"]["Row"]
          p_running_only: boolean
        }
        Returns: boolean
      }
      is_management_super_admin: { Args: never; Returns: boolean }
      is_pk_admin: { Args: never; Returns: boolean }
      is_question_live_hidden: {
        Args: { p_is_live_only: boolean; p_question_id: string }
        Returns: boolean
      }
      is_test_live_locked: {
        Args: { p_running_only?: boolean; p_test_id: string }
        Returns: boolean
      }
      live_lock_applies: { Args: never; Returns: boolean }
      live_paper_access_error: {
        Args: { p_test_id: string; p_user_id: string }
        Returns: string
      }
      live_paper_visible: { Args: { p_test_id: string }; Returns: boolean }
      mark_payment_refunded: {
        Args: {
          p_payment_id: string
          p_refund_amount: number
          p_refund_id?: string
          p_refund_reason?: string
        }
        Returns: boolean
      }
      process_scheduled_notifications: { Args: never; Returns: number }
      publish_test: { Args: { p_test_id: string }; Returns: Json }
      quote_subscription_purchase: {
        Args: { p_plan_id: string; p_user_id: string }
        Returns: Json
      }
      reconcile_razorpay_refund: {
        Args: {
          p_payment_id: string
          p_refund_amount: number
          p_refund_id: string
          p_refund_reason?: string
        }
        Returns: Json
      }
      reconcile_razorpay_webhook: {
        Args: {
          p_amount: number
          p_currency: string
          p_event_id?: string
          p_order_id: string
          p_payment_id: string
        }
        Returns: Json
      }
      record_audiobook_listen: {
        Args: { p_audiobook_id: string }
        Returns: boolean
      }
      record_payment_alert: {
        Args: {
          p_detail?: Json
          p_kind: string
          p_message: string
          p_ref: string
          p_source: string
        }
        Returns: string
      }
      remove_admin_staff_member: { Args: { p_user_id: string }; Returns: Json }
      revoke_access_for_refunded_payment: {
        Args: { p_payment_row_id: string }
        Returns: Json
      }
      save_test_answers: {
        Args: {
          p_answers: Json
          p_attempt_id: string
          p_time_spent_seconds: number
        }
        Returns: boolean
      }
      save_test_questions: {
        Args: { p_questions: Json; p_test_id: string }
        Returns: Json
      }
      send_support_ticket_message: {
        Args: { p_body: string; p_internal?: boolean; p_ticket_id: string }
        Returns: Json
      }
      start_notification_gateway_request: {
        Args: { p_action: string; p_actor: string; p_request_id: string }
        Returns: boolean
      }
      start_test_attempt: { Args: { p_test_id: string }; Returns: Json }
      submit_test_attempt: {
        Args: {
          p_answers: Json
          p_attempt_id: string
          p_time_spent_seconds: number
        }
        Returns: Json
      }
      sync_admin_profile: { Args: never; Returns: Json }
      sync_question_live_only: {
        Args: { p_question_id: string }
        Returns: undefined
      }
      take_image_upload_slot: { Args: { p_user_id: string }; Returns: boolean }
      update_admin_staff_role: {
        Args: { p_admin_role: string; p_user_id: string }
        Returns: Json
      }
      validate_coupon_code: {
        Args: {
          p_amount: number
          p_code: string
          p_plan_id: string
          p_user_id?: string
        }
        Returns: Json
      }
      verify_razorpay_payment: {
        Args: {
          p_order_id: string
          p_payment_id: string
          p_plan_id: string
          p_signature: string
        }
        Returns: Json
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
