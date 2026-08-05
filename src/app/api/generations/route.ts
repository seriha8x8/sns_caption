import { NextResponse } from "next/server";
import { listGenerations } from "@/lib/db";

export async function GET() {
  try {
    const generations = await listGenerations();
    return NextResponse.json({ generations });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "履歴の取得に失敗しました。" },
      { status: 500 }
    );
  }
}
