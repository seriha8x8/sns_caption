export type VideoType = "long" | "short";

export interface Genre {
  id: string;
  display_name: string;
  target_audience: string | null;
  tone: string | null;
  created_at: string;
  updated_at: string;
}

export interface YoutubeSettings {
  genre_id: string;
  title_count: number;
  title_style: string | null;
  description_footer: string | null;
  hashtag_count: number;
  hashtag_ratio: string | null;
  weighted_hashtags: string[];
  tag_char_target: number;
  required_keywords: string[];
}

export interface InstagramSettings {
  genre_id: string;
  caption_style: string | null;
  hashtag_min: number | null;
  hashtag_max: number | null;
}

export interface TiktokSettings {
  genre_id: string;
  caption_style: string | null;
  hashtag_count: number | null;
}

export interface GenreWithSettings extends Genre {
  youtube: YoutubeSettings | null;
  instagram: InstagramSettings | null;
  tiktok: TiktokSettings | null;
}

export interface YoutubeOutput {
  titles: string[];
  description: string;
  tags: string[];
}

export interface InstagramOutput {
  caption: string;
  hashtags: string[];
}

export interface TiktokOutput {
  caption: string;
  hashtags: string[];
}

export interface Generation {
  id: string;
  genre_id: string;
  video_type: VideoType;
  additional_tags: string[];
  output_youtube: YoutubeOutput;
  output_instagram: InstagramOutput;
  output_tiktok: TiktokOutput;
  created_at: string;
}

export interface GenerationListItem {
  id: string;
  genre_id: string;
  genre_display_name: string | null;
  video_type: VideoType;
  additional_tags: string[];
  created_at: string;
}

export interface GenerationResult {
  youtube: YoutubeOutput;
  instagram: InstagramOutput;
  tiktok: TiktokOutput;
}
