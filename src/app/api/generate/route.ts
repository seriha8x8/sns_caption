import { NextResponse } from "next/server";
import { analyzeVideo } from "@/lib/analysis";
import { createGeneration, getGenreWithSettings } from "@/lib/db";
import { generateCaptions } from "@/lib/generation/generateCaptions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { VIDEOS_BUCKET } from "@/lib/storage";
import type { VideoType } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function parseAdditionalTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw !== "string") return [];
  return raw
    .split(/[,、]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function POST(req: Request) {
  let videoPath: string | undefined;

  try {
    const body = await req.json();

    const { genreId, videoType, videoPath: path } = body as {
      genreId?: unknown;
      videoType?: unknown;
      videoPath?: unknown;
    };
    videoPath = typeof path === "string" ? path : undefined;

    if (typeof genreId !== "string" || !genreId) {
      return NextResponse.json({ error: "ジャンルを選択してください。" }, { status: 400 });
    }
    if (videoType !== "long" && videoType !== "short") {
      return NextResponse.json({ error: "動画種別を選択してください。" }, { status: 400 });
    }
    if (!videoPath) {
      return NextResponse.json({ error: "動画ファイルをアップロードしてください。" }, { status: 400 });
    }

    const genre = await getGenreWithSettings(genreId);
    if (!genre) {
      return NextResponse.json({ error: "指定されたジャンルが見つかりません。" }, { status: 404 });
    }

    const additionalTags = parseAdditionalTags(body.additionalTags);

    const supabase = getSupabaseServerClient();
    const { data: videoBlob, error: downloadError } = await supabase.storage
      .from(VIDEOS_BUCKET)
      .download(videoPath);

    if (downloadError || !videoBlob) {
      throw downloadError ?? new Error("アップロードされた動画を取得できませんでした。");
    }

    const videoBuffer = Buffer.from(await videoBlob.arrayBuffer());
    const analysis = await analyzeVideo(videoBuffer, videoType as VideoType);

    const result = await generateCaptions({ genre, analysis, additionalTags });

    const generation = await createGeneration({
      genreId,
      videoType: videoType as VideoType,
      additionalTags,
      result,
    });

    return NextResponse.json({ generation });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "生成に失敗しました。" },
      { status: 500 }
    );
  } finally {
    if (videoPath) {
      try {
        const supabase = getSupabaseServerClient();
        await supabase.storage.from(VIDEOS_BUCKET).remove([videoPath]);
      } catch (cleanupErr) {
        console.error("Failed to clean up uploaded video:", cleanupErr);
      }
    }
  }
}
