export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      churches: {
        Row: {
          id: string;
          name: string;
          denomination: string | null;
          address: string | null;
          phone: string | null;
          senior_pastor: string | null;
          founded_year: number | null;
          member_count: number;
          subscription_tier: 'free' | 'basic' | 'standard' | 'premium';
          subdomain: string | null;
          custom_domain: string | null;
          logo_url: string | null;
          settings: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          denomination?: string | null;
          address?: string | null;
          phone?: string | null;
          senior_pastor?: string | null;
          founded_year?: number | null;
          member_count?: number;
          subscription_tier?: 'free' | 'basic' | 'standard' | 'premium';
          subdomain?: string | null;
          custom_domain?: string | null;
          logo_url?: string | null;
          settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          denomination?: string | null;
          address?: string | null;
          phone?: string | null;
          senior_pastor?: string | null;
          founded_year?: number | null;
          member_count?: number;
          subscription_tier?: 'free' | 'basic' | 'standard' | 'premium';
          subdomain?: string | null;
          custom_domain?: string | null;
          logo_url?: string | null;
          settings?: Json | null;
          updated_at?: string;
        };
      };
      members: {
        Row: {
          id: string;
          church_id: string;
          user_id: string | null;
          name: string;
          name_chosung: string | null;
          phone: string;
          email: string | null;
          address: string | null;
          birth_date: string | null;
          gender: 'male' | 'female' | null;
          baptism_date: string | null;
          position: 'elder' | 'ordained_deacon' | 'deacon' | 'saint' | null;
          cell_group_id: string | null;
          role: 'superadmin' | 'admin' | 'pastor' | 'staff' | 'leader' | 'member';
          status: 'pending' | 'active' | 'inactive' | 'transferred';
          photo_url: string | null;
          joined_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          user_id?: string | null;
          name: string;
          name_chosung?: string | null;
          phone: string;
          email?: string | null;
          address?: string | null;
          birth_date?: string | null;
          gender?: 'male' | 'female' | null;
          baptism_date?: string | null;
          position?: 'elder' | 'ordained_deacon' | 'deacon' | 'saint' | null;
          cell_group_id?: string | null;
          role?: 'admin' | 'pastor' | 'staff' | 'leader' | 'member';
          status?: 'pending' | 'active' | 'inactive' | 'transferred';
          photo_url?: string | null;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          user_id?: string | null;
          name?: string;
          name_chosung?: string | null;
          phone?: string;
          email?: string | null;
          address?: string | null;
          birth_date?: string | null;
          gender?: 'male' | 'female' | null;
          baptism_date?: string | null;
          position?: 'elder' | 'ordained_deacon' | 'deacon' | 'saint' | null;
          cell_group_id?: string | null;
          role?: 'admin' | 'pastor' | 'staff' | 'leader' | 'member';
          status?: 'pending' | 'active' | 'inactive' | 'transferred';
          photo_url?: string | null;
          joined_at?: string | null;
          updated_at?: string;
        };
      };
      families: {
        Row: {
          id: string;
          church_id: string;
          family_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          family_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          family_name?: string;
        };
      };
      family_members: {
        Row: {
          id: string;
          family_id: string;
          member_id: string;
          relationship: 'head' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          member_id: string;
          relationship: 'head' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          member_id?: string;
          relationship?: 'head' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
        };
      };
      sermons: {
        Row: {
          id: string;
          church_id: string;
          preacher_id: string | null;
          title: string;
          bible_verses: string[] | null;
          sermon_date: string;
          service_type: 'sunday_morning' | 'sunday_evening' | 'wednesday' | 'friday' | 'dawn' | 'special' | 'other';
          audio_url: string | null;
          transcript: string | null;
          stt_status: 'pending' | 'processing' | 'completed' | 'failed' | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          preacher_id?: string | null;
          title: string;
          bible_verses?: string[] | null;
          sermon_date: string;
          service_type?: 'sunday_morning' | 'sunday_evening' | 'wednesday' | 'friday' | 'dawn' | 'special' | 'other';
          audio_url?: string | null;
          transcript?: string | null;
          stt_status?: 'pending' | 'processing' | 'completed' | 'failed' | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          preacher_id?: string | null;
          title?: string;
          bible_verses?: string[] | null;
          sermon_date?: string;
          service_type?: 'sunday_morning' | 'sunday_evening' | 'wednesday' | 'friday' | 'dawn' | 'special' | 'other';
          audio_url?: string | null;
          transcript?: string | null;
          stt_status?: 'pending' | 'processing' | 'completed' | 'failed' | null;
          tags?: string[] | null;
          updated_at?: string;
        };
      };
      sermon_notes: {
        Row: {
          id: string;
          church_id: string;
          member_id: string;
          sermon_id: string | null;
          title: string;
          content: Json;
          audio_url: string | null;
          highlights: Json | null;
          is_shared: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          member_id: string;
          sermon_id?: string | null;
          title: string;
          content?: Json;
          audio_url?: string | null;
          highlights?: Json | null;
          is_shared?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          member_id?: string;
          sermon_id?: string | null;
          title?: string;
          content?: Json;
          audio_url?: string | null;
          highlights?: Json | null;
          is_shared?: boolean;
          updated_at?: string;
        };
      };
      note_feedbacks: {
        Row: {
          id: string;
          sermon_note_id: string;
          pastor_id: string;
          content: string;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sermon_note_id: string;
          pastor_id: string;
          content: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sermon_note_id?: string;
          pastor_id?: string;
          content?: string;
          parent_id?: string | null;
        };
      };
      organizations: {
        Row: {
          id: string;
          church_id: string;
          parent_id: string | null;
          name: string;
          type: 'committee' | 'department' | 'group' | 'team';
          description: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          parent_id?: string | null;
          name: string;
          type: 'committee' | 'department' | 'group' | 'team';
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          parent_id?: string | null;
          name?: string;
          type?: 'committee' | 'department' | 'group' | 'team';
          description?: string | null;
          sort_order?: number;
          updated_at?: string;
        };
      };
      org_roles: {
        Row: {
          id: string;
          organization_id: string;
          member_id: string;
          role: 'head' | 'member' | 'secretary';
          permissions: string[];
          delegated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          member_id: string;
          role?: 'head' | 'member' | 'secretary';
          permissions?: string[];
          delegated_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          member_id?: string;
          role?: 'head' | 'member' | 'secretary';
          permissions?: string[];
          delegated_by?: string | null;
        };
      };
      announcements: {
        Row: {
          id: string;
          church_id: string;
          author_id: string;
          title: string;
          content: string;
          target_groups: string[] | null;
          is_pinned: boolean;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          author_id: string;
          title: string;
          content: string;
          target_groups?: string[] | null;
          is_pinned?: boolean;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          author_id?: string;
          title?: string;
          content?: string;
          target_groups?: string[] | null;
          is_pinned?: boolean;
          is_published?: boolean;
          published_at?: string | null;
          updated_at?: string;
        };
      };
      attendances: {
        Row: {
          id: string;
          church_id: string;
          member_id: string;
          event_type: 'worship' | 'meeting' | 'training' | 'cell_group' | 'other';
          event_id: string | null;
          event_date: string;
          checked_in_at: string;
          check_method: 'manual' | 'qr';
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          member_id: string;
          event_type?: 'worship' | 'meeting' | 'training' | 'cell_group' | 'other';
          event_id?: string | null;
          event_date: string;
          checked_in_at?: string;
          check_method?: 'manual' | 'qr';
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          member_id?: string;
          event_type?: 'worship' | 'meeting' | 'training' | 'cell_group' | 'other';
          event_id?: string | null;
          event_date?: string;
          checked_in_at?: string;
          check_method?: 'manual' | 'qr';
        };
      };
      cell_groups: {
        Row: {
          id: string;
          church_id: string;
          name: string;
          leader_id: string | null;
          description: string | null;
          meeting_day: string | null;
          meeting_time: string | null;
          meeting_place: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          name: string;
          leader_id?: string | null;
          description?: string | null;
          meeting_day?: string | null;
          meeting_time?: string | null;
          meeting_place?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          name?: string;
          leader_id?: string | null;
          description?: string | null;
          meeting_day?: string | null;
          meeting_time?: string | null;
          meeting_place?: string | null;
          updated_at?: string;
        };
      };
      pastor_assignments: {
        Row: {
          id: string;
          church_id: string;
          pastor_id: string;
          member_id: string;
          status: 'pending' | 'active' | 'expired';
          accepted_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          pastor_id: string;
          member_id: string;
          status?: 'pending' | 'active' | 'expired';
          accepted_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          pastor_id?: string;
          member_id?: string;
          status?: 'pending' | 'active' | 'expired';
          accepted_at?: string | null;
          expires_at?: string | null;
        };
      };
      access_requests: {
        Row: {
          id: string;
          church_id: string;
          user_id: string;
          status: 'pending' | 'approved' | 'rejected';
          requested_at: string;
          responded_at: string | null;
          responded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          user_id: string;
          status?: 'pending' | 'approved' | 'rejected';
          requested_at?: string;
          responded_at?: string | null;
          responded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          user_id?: string;
          status?: 'pending' | 'approved' | 'rejected';
          responded_at?: string | null;
          responded_by?: string | null;
        };
      };
    };
    Functions: {
      get_my_church_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      compute_chosung: {
        Args: { input_text: string };
        Returns: string;
      };
    };
  };
};
