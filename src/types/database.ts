// Database Types for Maimang Readbox
// Version: 0.2
//
// This is a handwritten placeholder type aligned to the current migration.
// It should be replaced later with real generated types from the Supabase CLI.
//
// Recommended command example, do not run automatically in this task:
// npx supabase gen types typescript --project-id <project-id> > src/types/database.ts

import type {
  ArticleStatus,
  ContentType,
  InboxStatus,
  ModerationStatus,
  ModerationTargetType,
  SavedItemType,
  SourceType,
  UserRole,
  Visibility,
} from "./domain";

type Timestamp = string;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          role: UserRole;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          role?: UserRole;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          role?: UserRole;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      author_profiles: {
        Row: {
          id: string;
          user_id: string;
          pen_name: string;
          bio: string | null;
          avatar_url: string | null;
          homepage_url: string | null;
          is_active: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          pen_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          homepage_url?: string | null;
          is_active?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: string;
          user_id?: string;
          pen_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          homepage_url?: string | null;
          is_active?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      articles: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          subtitle: string | null;
          slug: string;
          excerpt: string | null;
          content: string;
          cover_url: string | null;
          status: ArticleStatus;
          published_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          subtitle?: string | null;
          slug: string;
          excerpt?: string | null;
          content: string;
          cover_url?: string | null;
          status?: ArticleStatus;
          published_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: string;
          author_id?: string;
          title?: string;
          subtitle?: string | null;
          slug?: string;
          excerpt?: string | null;
          content?: string;
          cover_url?: string | null;
          status?: ArticleStatus;
          published_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          reader_id: string;
          author_id: string;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          reader_id: string;
          author_id: string;
          created_at?: Timestamp;
        };
        Update: {
          id?: string;
          reader_id?: string;
          author_id?: string;
          created_at?: Timestamp;
        };
        Relationships: [];
      };
      external_items: {
        Row: {
          id: string;
          user_id: string;
          url: string | null;
          title: string;
          source_platform: string | null;
          source_author: string | null;
          excerpt: string | null;
          content_type: ContentType;
          original_content: string | null;
          extracted_content: string | null;
          legal_note: string;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          url?: string | null;
          title: string;
          source_platform?: string | null;
          source_author?: string | null;
          excerpt?: string | null;
          content_type: ContentType;
          original_content?: string | null;
          extracted_content?: string | null;
          legal_note: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: string;
          user_id?: string;
          url?: string | null;
          title?: string;
          source_platform?: string | null;
          source_author?: string | null;
          excerpt?: string | null;
          content_type?: ContentType;
          original_content?: string | null;
          extracted_content?: string | null;
          legal_note?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      inbox_items: {
        Row: {
          id: string;
          user_id: string;
          source_type: SourceType;
          article_id: string | null;
          external_item_id: string | null;
          status: InboxStatus;
          is_starred: boolean;
          received_at: Timestamp;
          read_at: Timestamp | null;
          archived_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_type: SourceType;
          article_id?: string | null;
          external_item_id?: string | null;
          status?: InboxStatus;
          is_starred?: boolean;
          received_at?: Timestamp;
          read_at?: Timestamp | null;
          archived_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_type?: SourceType;
          article_id?: string | null;
          external_item_id?: string | null;
          status?: InboxStatus;
          is_starred?: boolean;
          received_at?: Timestamp;
          read_at?: Timestamp | null;
          archived_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      collection_items: {
        Row: {
          id: string;
          collection_id: string;
          item_type: SavedItemType;
          article_id: string | null;
          external_item_id: string | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          collection_id: string;
          item_type: SavedItemType;
          article_id?: string | null;
          external_item_id?: string | null;
          created_at?: Timestamp;
        };
        Update: {
          id?: string;
          collection_id?: string;
          item_type?: SavedItemType;
          article_id?: string | null;
          external_item_id?: string | null;
          created_at?: Timestamp;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          item_type: SavedItemType;
          article_id: string | null;
          external_item_id: string | null;
          selected_text: string | null;
          content: string;
          visibility: Visibility;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_type: SavedItemType;
          article_id?: string | null;
          external_item_id?: string | null;
          selected_text?: string | null;
          content: string;
          visibility?: Visibility;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_type?: SavedItemType;
          article_id?: string | null;
          external_item_id?: string | null;
          selected_text?: string | null;
          content?: string;
          visibility?: Visibility;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      reflections: {
        Row: {
          id: string;
          user_id: string;
          item_type: SavedItemType;
          article_id: string | null;
          external_item_id: string | null;
          content: string;
          visibility: Visibility;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_type: SavedItemType;
          article_id?: string | null;
          external_item_id?: string | null;
          content: string;
          visibility?: Visibility;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_type?: SavedItemType;
          article_id?: string | null;
          external_item_id?: string | null;
          content?: string;
          visibility?: Visibility;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      moderation_reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: ModerationTargetType;
          article_id: string | null;
          reflection_id: string | null;
          note_id: string | null;
          reason: string;
          status: ModerationStatus;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: ModerationTargetType;
          article_id?: string | null;
          reflection_id?: string | null;
          note_id?: string | null;
          reason: string;
          status?: ModerationStatus;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          target_type?: ModerationTargetType;
          article_id?: string | null;
          reflection_id?: string | null;
          note_id?: string | null;
          reason?: string;
          status?: ModerationStatus;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_public_article_notes: {
        Args: {
          p_article_id: string;
        };
        Returns: {
          id: string;
          item_type: SavedItemType;
          article_id: string | null;
          selected_text: string | null;
          content: string;
          visibility: Visibility;
          created_at: Timestamp;
          updated_at: Timestamp;
        }[];
      };
      get_public_article_reflections: {
        Args: {
          p_article_id: string;
        };
        Returns: {
          id: string;
          item_type: SavedItemType;
          article_id: string | null;
          content: string;
          visibility: Visibility;
          created_at: Timestamp;
          updated_at: Timestamp;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
