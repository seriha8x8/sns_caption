import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { VIDEOS_BUCKET } from "@/lib/storage";

export async function POST() {
  try {
    const supabase = getSupabaseServerClient();
    const path = randomUUID();

    const { data, error } = await supabase.storage
      .from(VIDEOS_BUCKET)
      .createSignedUploadUrl(path);

    if (error) throw error;

    return NextResponse.json({
      path: data.path,
      signedUrl: data.signedUrl,
      token: data.token,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "アップロードURLの発行に失敗しました。" },
      { status: 500 }
    );
  }
}
