// Hand-written to match supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types typescript` once the project is linked
// if the schema changes.

export interface Database {
  public: {
    Tables: {
      genres: {
        Row: {
          id: string;
          display_name: string;
          target_audience: string | null;
          tone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          target_audience?: string | null;
          tone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["genres"]["Insert"]>;
        Relationships: [];
      };
      youtube_settings: {
        Row: {
          genre_id: string;
          title_count: number;
          title_style: string | null;
          description_footer: string | null;
          hashtag_count: number;
          hashtag_ratio: string | null;
          weighted_hashtags: string[];
          tag_char_target: number;
          required_keywords: string[];
        };
        Insert: {
          genre_id: string;
          title_count?: number;
          title_style?: string | null;
          description_footer?: string | null;
          hashtag_count?: number;
          hashtag_ratio?: string | null;
          weighted_hashtags?: string[];
          tag_char_target?: number;
          required_keywords?: string[];
        };
        Update: Partial<
          Database["public"]["Tables"]["youtube_settings"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "youtube_settings_genre_id_fkey";
            columns: ["genre_id"];
            referencedRelation: "genres";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_settings: {
        Row: {
          genre_id: string;
          caption_style: string | null;
          hashtag_min: number | null;
          hashtag_max: number | null;
        };
        Insert: {
          genre_id: string;
          caption_style?: string | null;
          hashtag_min?: number | null;
          hashtag_max?: number | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["instagram_settings"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "instagram_settings_genre_id_fkey";
            columns: ["genre_id"];
            referencedRelation: "genres";
            referencedColumns: ["id"];
          },
        ];
      };
      tiktok_settings: {
        Row: {
          genre_id: string;
          caption_style: string | null;
          hashtag_count: number | null;
        };
        Insert: {
          genre_id: string;
          caption_style?: string | null;
          hashtag_count?: number | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["tiktok_settings"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "tiktok_settings_genre_id_fkey";
            columns: ["genre_id"];
            referencedRelation: "genres";
            referencedColumns: ["id"];
          },
        ];
      };
      generations: {
        Row: {
          id: string;
          genre_id: string | null;
          video_type: string;
          additional_tags: string[];
          output_youtube: unknown;
          output_instagram: unknown;
          output_tiktok: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          genre_id?: string | null;
          video_type: string;
          additional_tags?: string[];
          output_youtube: unknown;
          output_instagram: unknown;
          output_tiktok: unknown;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["generations"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "generations_genre_id_fkey";
            columns: ["genre_id"];
            referencedRelation: "genres";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
