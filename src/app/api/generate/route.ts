import { NextResponse } from "next/server";
import { analyzeVideo } from "@/lib/analysis";
import { createGeneration, getGenreWithSettings } from "@/lib/db";
import { generateCaptions } from "@/lib/generation/generateCaptions";
import type { VideoType } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function parseAdditionalTags(raw: FormDataEntryValue | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // fall through to comma-split
  }
  return raw
    .split(/[,、]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const genreId = formData.get("genreId");
    const videoType = formData.get("videoType");
    const video = formData.get("video");

    if (typeof genreId !== "string" || !genreId) {
      return NextResponse.json({ error: "ジャンルを選択してください。" }, { status: 400 });
    }
    if (videoType !== "long" && videoType !== "short") {
      return NextResponse.json({ error: "動画種別を選択してください。" }, { status: 400 });
    }
    if (!(video instanceof File)) {
      return NextResponse.json({ error: "動画ファイルをアップロードしてください。" }, { status: 400 });
    }

    const genre = await getGenreWithSettings(genreId);
    if (!genre) {
      return NextResponse.json({ error: "指定されたジャンルが見つかりません。" }, { status: 404 });
    }

    const additionalTags = parseAdditionalTags(formData.get("additionalTags"));

    const videoBuffer = Buffer.from(await video.arrayBuffer());
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
  }
}
