import { NextResponse } from "next/server";
import { getGenreWithSettings, saveGenre } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  try {
    const genre = await getGenreWithSettings(id);
    if (!genre) {
      return NextResponse.json({ error: "ジャンルが見つかりません。" }, { status: 404 });
    }
    return NextResponse.json({ genre });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ジャンルの取得に失敗しました。" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();

    if (!body.display_name || typeof body.display_name !== "string") {
      return NextResponse.json({ error: "表示名は必須です。" }, { status: 400 });
    }

    await saveGenre({
      id,
      display_name: body.display_name,
      target_audience: body.target_audience ?? "",
      tone: body.tone ?? "",
      youtube: {
        title_count: body.youtube?.title_count ?? 5,
        title_style: body.youtube?.title_style ?? "",
        description_footer: body.youtube?.description_footer ?? "",
        hashtag_count: body.youtube?.hashtag_count ?? 30,
        hashtag_ratio: body.youtube?.hashtag_ratio ?? "",
        weighted_hashtags: body.youtube?.weighted_hashtags ?? [],
        tag_char_target: body.youtube?.tag_char_target ?? 900,
        required_keywords: body.youtube?.required_keywords ?? [],
      },
      instagram: {
        caption_style: body.instagram?.caption_style ?? "",
        hashtag_min: body.instagram?.hashtag_min ?? null,
        hashtag_max: body.instagram?.hashtag_max ?? null,
      },
      tiktok: {
        caption_style: body.tiktok?.caption_style ?? "",
        hashtag_count: body.tiktok?.hashtag_count ?? null,
      },
    });

    const genre = await getGenreWithSettings(id);
    return NextResponse.json({ genre });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ジャンルの保存に失敗しました。" },
      { status: 500 }
    );
  }
}
