export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type GenericTable = {
  Row: Record<string, any>;
  Insert: Record<string, any>;
  Update: Record<string, any>;
  Relationships: any[];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          email: string | null;
          phone: string | null;
          company_name: string | null;
          bio?: string | null;
          iban: string | null;
          bank_name: string | null;
          bank_account_holder_name: string | null;
          crypto_wallet: string | null;
          social_links: Json | null;
          role: 'guest' | 'user' | 'host' | 'admin' | string | null;
          created_at: string | null;
          updated_at: string | null;
          [key: string]: any;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          phone?: string | null;
          company_name?: string | null;
          bio?: string | null;
          iban?: string | null;
          bank_name?: string | null;
          bank_account_holder_name?: string | null;
          crypto_wallet?: string | null;
          social_links?: Json | null;
          role?: 'guest' | 'user' | 'host' | 'admin' | string | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          phone?: string | null;
          company_name?: string | null;
          bio?: string | null;
          iban?: string | null;
          bank_name?: string | null;
          bank_account_holder_name?: string | null;
          crypto_wallet?: string | null;
          social_links?: Json | null;
          role?: 'guest' | 'user' | 'host' | 'admin' | string | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Relationships: any[];
      };
      properties: {
        Row: {
          id: string;
          ref_id: number | null;
          title: string;
          description: string | null;
          price_per_night: number | null;
          location: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          type: string | null;
          amenities: string[] | null;
          images: string[] | null;
          host_id: string | null;
          rental_license: string | null;
          status: 'pending' | 'approved' | 'rejected' | string | null;
          rejection_reason: string | null;
          cleaning_fee: number | null;
          arrival_guide: string | null;
          check_in_time: string | null;
          check_out_time: string | null;
          max_guests: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          beds: number | null;
          created_at: string | null;
          updated_at: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          ref_id?: number | null;
          title: string;
          description?: string | null;
          price_per_night?: number | null;
          location?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          type?: string | null;
          amenities?: string[] | null;
          images?: string[] | null;
          host_id?: string | null;
          rental_license?: string | null;
          status?: 'pending' | 'approved' | 'rejected' | string | null;
          rejection_reason?: string | null;
          cleaning_fee?: number | null;
          arrival_guide?: string | null;
          check_in_time?: string | null;
          check_out_time?: string | null;
          max_guests?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          beds?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          ref_id?: number | null;
          title?: string;
          description?: string | null;
          price_per_night?: number | null;
          location?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          type?: string | null;
          amenities?: string[] | null;
          images?: string[] | null;
          host_id?: string | null;
          rental_license?: string | null;
          status?: 'pending' | 'approved' | 'rejected' | string | null;
          rejection_reason?: string | null;
          cleaning_fee?: number | null;
          arrival_guide?: string | null;
          check_in_time?: string | null;
          check_out_time?: string | null;
          max_guests?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          beds?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Relationships: any[];
      };
      bookings: {
        Row: {
          id: string;
          property_id: string | null;
          guest_id: string | null;
          host_id: string | null;
          check_in: string | null;
          check_out: string | null;
          total_price: number | null;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | string | null;
          stripe_session_id: string | null;
          payment_intent_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          property_id?: string | null;
          guest_id?: string | null;
          host_id?: string | null;
          check_in?: string | null;
          check_out?: string | null;
          total_price?: number | null;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | string | null;
          stripe_session_id?: string | null;
          payment_intent_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          property_id?: string | null;
          guest_id?: string | null;
          host_id?: string | null;
          check_in?: string | null;
          check_out?: string | null;
          total_price?: number | null;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | string | null;
          stripe_session_id?: string | null;
          payment_intent_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Relationships: any[];
      };
      consultant_profiles: {
        Row: {
          id: string;
          user_id: string | null;
          bio: string | null;
          title: string | null;
          specialties: string[] | null;
          years_experience: number | null;
          languages: string[] | null;
          is_verified: boolean | null;
          rating: number | null;
          created_at: string | null;
          updated_at: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          bio?: string | null;
          title?: string | null;
          specialties?: string[] | null;
          years_experience?: number | null;
          languages?: string[] | null;
          is_verified?: boolean | null;
          rating?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          bio?: string | null;
          title?: string | null;
          specialties?: string[] | null;
          years_experience?: number | null;
          languages?: string[] | null;
          is_verified?: boolean | null;
          rating?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Relationships: [
          {
            foreignKeyName: "consultant_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      locations: {
        Row: {
          id: string;
          name: string;
          category?: string | null;
          district?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          district?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string | null;
          district?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Relationships: [];
      };
      chat_conversations: {
        Row: {
          id: string;
          property_id: string | null;
          guest_id: string | null;
          host_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          property_id?: string | null;
          guest_id?: string | null;
          host_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          property_id?: string | null;
          guest_id?: string | null;
          host_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Relationships: [
          {
            foreignKeyName: "chat_conversations_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_guest_id_fkey";
            columns: ["guest_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_reports: {
        Row: {
          id: string;
          reporter_id: string | null;
          reported_id: string | null;
          conversation_id: string | null;
          reason: string | null;
          details: string | null;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          reporter_id?: string | null;
          reported_id?: string | null;
          conversation_id?: string | null;
          reason?: string | null;
          details?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          reporter_id?: string | null;
          reported_id?: string | null;
          conversation_id?: string | null;
          reason?: string | null;
          details?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Relationships: [
          {
            foreignKeyName: "chat_reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_reports_reported_id_fkey";
            columns: ["reported_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      blog_posts: {
        Row: {
          id: string;
          title: string | null;
          slug: string | null;
          content: string | null;
          excerpt: string | null;
          cover_image_url: string | null;
          video_url: string | null;
          status: string | null;
          author_id: string | null;
          category: string | null;
          views: number | null;
          is_featured: boolean | null;
          published_at: string | null;
          created_at: string | null;
          updated_at: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          title?: string | null;
          slug?: string | null;
          content?: string | null;
          excerpt?: string | null;
          cover_image_url?: string | null;
          video_url?: string | null;
          status?: string | null;
          author_id?: string | null;
          category?: string | null;
          views?: number | null;
          is_featured?: boolean | null;
          published_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          title?: string | null;
          slug?: string | null;
          content?: string | null;
          excerpt?: string | null;
          cover_image_url?: string | null;
          video_url?: string | null;
          status?: string | null;
          author_id?: string | null;
          category?: string | null;
          views?: number | null;
          is_featured?: boolean | null;
          published_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      blog_submissions: {
        Row: {
          id: string;
          user_id: string | null;
          title: string | null;
          content: string | null;
          author_name?: string | null;
          author_email?: string | null;
          category?: string | null;
          video_url?: string | null;
          media_urls?: string[] | null;
          tag_ids: string[];
          status: 'pending_review' | 'approved' | 'rejected' | string | null;
          payment_details?: Json | null;
          rejection_reason?: string | null;
          created_at: string | null;
          updated_at: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title?: string | null;
          content?: string | null;
          author_name?: string | null;
          author_email?: string | null;
          category?: string | null;
          video_url?: string | null;
          media_urls?: string[] | null;
          tag_ids?: string[];
          status?: 'pending_review' | 'approved' | 'rejected' | string | null;
          payment_details?: Json | null;
          rejection_reason?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string | null;
          content?: string | null;
          author_name?: string | null;
          author_email?: string | null;
          category?: string | null;
          video_url?: string | null;
          media_urls?: string[] | null;
          tag_ids?: string[];
          status?: 'pending_review' | 'approved' | 'rejected' | string | null;
          payment_details?: Json | null;
          rejection_reason?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Relationships: [
          {
            foreignKeyName: "blog_submissions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      blog_post_tags: {
        Row: {
          post_id: string | null;
          tag_id: string | null;
          tag: any;
          [key: string]: any;
        };
        Insert: {
          post_id?: string | null;
          tag_id?: string | null;
          tag?: any;
          [key: string]: any;
        };
        Update: {
          post_id?: string | null;
          tag_id?: string | null;
          tag?: any;
          [key: string]: any;
        };
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "blog_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "blog_tags";
            referencedColumns: ["id"];
          }
        ];
      };
      blog_tags: {
        Row: {
          id: string;
          name: string | null;
          slug: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          name?: string | null;
          slug?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          name?: string | null;
          slug?: string | null;
          [key: string]: any;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          property_id: string | null;
          user_id: string | null;
          rating: number | null;
          comment: string | null;
          status: 'pending' | 'approved' | 'rejected' | string | null;
          created_at: string | null;
          updated_at: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          property_id?: string | null;
          user_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          status?: 'pending' | 'approved' | 'rejected' | string | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          property_id?: string | null;
          user_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          status?: 'pending' | 'approved' | 'rejected' | string | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Relationships: any[];
      };
      directory_listings: {
        Row: {
          id: string;
          title: string | null;
          description: string | null;
          google_rating: number | null;
          google_review_count: number | null;
          category: string | null;
          tier: 'explorer' | 'voyager' | 'signature' | 'partner' | string | null;
          status: 'draft' | 'pending' | 'approved' | 'rejected' | string | null;
          owner_id: string | null;
          slug: string | null;
          created_at: string | null;
          updated_at: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          title?: string | null;
          description?: string | null;
          google_rating?: number | null;
          google_review_count?: number | null;
          category?: string | null;
          tier?: 'explorer' | 'voyager' | 'signature' | 'partner' | string | null;
          status?: 'draft' | 'pending' | 'approved' | 'rejected' | string | null;
          owner_id?: string | null;
          slug?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          title?: string | null;
          description?: string | null;
          google_rating?: number | null;
          google_review_count?: number | null;
          category?: string | null;
          tier?: 'explorer' | 'voyager' | 'signature' | 'partner' | string | null;
          status?: 'draft' | 'pending' | 'approved' | 'rejected' | string | null;
          owner_id?: string | null;
          slug?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Relationships: any[];
      };
      forum_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          body: string | null;
          content?: string | null;
          author_id: string | null;
          category_id: string | null;
          image_url: string | null;
          view_count: number;
          like_count: number;
          comment_count: number;
          is_pinned: boolean;
          is_removed: boolean;
          post_type: 'announcement' | 'discussion' | 'question' | string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug?: string;
          body?: string | null;
          content?: string | null;
          author_id?: string | null;
          category_id?: string | null;
          image_url?: string | null;
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          is_pinned?: boolean;
          is_removed?: boolean;
          post_type?: 'announcement' | 'discussion' | 'question' | string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          body?: string | null;
          content?: string | null;
          author_id?: string | null;
          category_id?: string | null;
          image_url?: string | null;
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          is_pinned?: boolean;
          is_removed?: boolean;
          post_type?: 'announcement' | 'discussion' | 'question' | string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "forum_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forum_posts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "forum_categories";
            referencedColumns: ["id"];
          }
        ];
      };
      [key: string]: GenericTable;
    };
    Views: {
      [key: string]: GenericTable;
    };
    Functions: {
      [key: string]: {
        Args: Record<string, any>;
        Returns: any;
      };
    };
    Enums: {
      approval_status: 'draft' | 'pending' | 'approved' | 'rejected';
      listing_tier: 'explorer' | 'voyager' | 'signature' | 'partner';
      user_role: 'guest' | 'user' | 'host' | 'admin';
      [key: string]: string;
    };
    CompositeTypes: {
      [key: string]: Record<string, any>;
    };
  };
};
