import { NextResponse } from "next/server";
import { listGenres } from "@/lib/db";

export async function GET() {
  try {
    const genres = await listGenres();
    return NextResponse.json({ genres });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ジャンル一覧の取得に失敗しました。" },
      { status: 500 }
    );
  }
}
