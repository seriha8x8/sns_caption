import { NextResponse } from "next/server";
import { deleteGeneration, getGeneration } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  try {
    const generation = await getGeneration(id);
    if (!generation) {
      return NextResponse.json({ error: "履歴が見つかりません。" }, { status: 404 });
    }
    return NextResponse.json({ generation });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "履歴の取得に失敗しました。" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  try {
    await deleteGeneration(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "削除に失敗しました。" },
      { status: 500 }
    );
  }
}
