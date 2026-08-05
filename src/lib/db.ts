import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Genre,
  GenreWithSettings,
  Generation,
  GenerationListItem,
  GenerationResult,
  InstagramSettings,
  TiktokSettings,
  VideoType,
  YoutubeSettings,
} from "@/lib/types";

export async function listGenres(): Promise<Genre[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("genres")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Genre[];
}

export async function getGenreWithSettings(
  genreId: string
): Promise<GenreWithSettings | null> {
  const supabase = getSupabaseServerClient();

  const [genreRes, youtubeRes, instagramRes, tiktokRes] = await Promise.all([
    supabase.from("genres").select("*").eq("id", genreId).maybeSingle(),
    supabase
      .from("youtube_settings")
      .select("*")
      .eq("genre_id", genreId)
      .maybeSingle(),
    supabase
      .from("instagram_settings")
      .select("*")
      .eq("genre_id", genreId)
      .maybeSingle(),
    supabase
      .from("tiktok_settings")
      .select("*")
      .eq("genre_id", genreId)
      .maybeSingle(),
  ]);

  if (genreRes.error) throw genreRes.error;
  if (!genreRes.data) return null;
  if (youtubeRes.error) throw youtubeRes.error;
  if (instagramRes.error) throw instagramRes.error;
  if (tiktokRes.error) throw tiktokRes.error;

  return {
    ...(genreRes.data as Genre),
    youtube: (youtubeRes.data as YoutubeSettings | null) ?? null,
    instagram: (instagramRes.data as InstagramSettings | null) ?? null,
    tiktok: (tiktokRes.data as TiktokSettings | null) ?? null,
  };
}

export interface SaveGenrePayload {
  id: string;
  display_name: string;
  target_audience: string;
  tone: string;
  youtube: Omit<YoutubeSettings, "genre_id">;
  instagram: Omit<InstagramSettings, "genre_id">;
  tiktok: Omit<TiktokSettings, "genre_id">;
}

export async function saveGenre(payload: SaveGenrePayload): Promise<void> {
  const supabase = getSupabaseServerClient();

  const { error: genreError } = await supabase.from("genres").upsert({
    id: payload.id,
    display_name: payload.display_name,
    target_audience: payload.target_audience,
    tone: payload.tone,
    updated_at: new Date().toISOString(),
  });
  if (genreError) throw genreError;

  const { error: youtubeError } = await supabase
    .from("youtube_settings")
    .upsert({ genre_id: payload.id, ...payload.youtube });
  if (youtubeError) throw youtubeError;

  const { error: instagramError } = await supabase
    .from("instagram_settings")
    .upsert({ genre_id: payload.id, ...payload.instagram });
  if (instagramError) throw instagramError;

  const { error: tiktokError } = await supabase
    .from("tiktok_settings")
    .upsert({ genre_id: payload.id, ...payload.tiktok });
  if (tiktokError) throw tiktokError;
}

export async function listGenerations(): Promise<GenerationListItem[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("generations")
    .select("id, genre_id, video_type, additional_tags, created_at, genres(display_name)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      genre_id: string;
      video_type: VideoType;
      additional_tags: string[];
      created_at: string;
      genres: { display_name: string } | { display_name: string }[] | null;
    };
    const genre = Array.isArray(r.genres) ? r.genres[0] : r.genres;
    return {
      id: r.id,
      genre_id: r.genre_id,
      genre_display_name: genre?.display_name ?? null,
      video_type: r.video_type,
      additional_tags: r.additional_tags ?? [],
      created_at: r.created_at,
    };
  });
}

export async function getGeneration(id: string): Promise<Generation | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as Generation | null) ?? null;
}

export async function createGeneration(params: {
  genreId: string;
  videoType: VideoType;
  additionalTags: string[];
  result: GenerationResult;
}): Promise<Generation> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("generations")
    .insert({
      genre_id: params.genreId,
      video_type: params.videoType,
      additional_tags: params.additionalTags,
      output_youtube: params.result.youtube,
      output_instagram: params.result.instagram,
      output_tiktok: params.result.tiktok,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Generation;
}

export async function deleteGeneration(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("generations").delete().eq("id", id);
  if (error) throw error;
}
