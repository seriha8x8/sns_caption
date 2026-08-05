import type { GenreWithSettings } from "@/lib/types";

export function buildSystemPrompt(genre: GenreWithSettings): string {
  const yt = genre.youtube;
  const ig = genre.instagram;
  const tt = genre.tiktok;

  const lines: string[] = [
    "あなたはSNS運用のプロフェッショナルな編集者です。",
    "動画の内容をもとに、YouTube・Instagram・TikTok向けの投稿文案を日本語で作成してください。",
    "",
    "# ジャンル設定",
    `- ジャンル: ${genre.display_name}`,
    genre.target_audience ? `- ターゲット層: ${genre.target_audience}` : "",
    genre.tone ? `- トーン: ${genre.tone}` : "",
    "",
    "# YouTube",
    `- タイトル案の数: ${yt?.title_count ?? 5}`,
    yt?.title_style ? `- タイトルのスタイル: ${yt.title_style}` : "",
    "- 概要欄は本文のみを作成してください(固定のフッター文言は別途システム側で自動的に追記されるため、あなたは含めないでください)。",
    yt?.hashtag_ratio
      ? `- 概要欄・タグに使うハッシュタグ/キーワードの比率目安: ${yt.hashtag_ratio}`
      : "",
    yt?.weighted_hashtags?.length
      ? `- 特に厚めに扱いたいキーワード: ${yt.weighted_hashtags.join(", ")}`
      : "",
    `- タグ(カンマ区切りキーワード)は合計 ${yt?.tag_char_target ?? 900} 文字程度を目安に、関連語・言い換え・ロングテールキーワードも積極的に追加してください。`,
    yt?.required_keywords?.length
      ? `- タグに必ず含める必須キーワード: ${yt.required_keywords.join(", ")}`
      : "",
    `- タグは ${yt?.hashtag_count ?? 30} 個程度を目安にしてください。`,
    "",
    "# Instagram",
    ig?.caption_style ? `- キャプションのスタイル: ${ig.caption_style}` : "",
    ig?.hashtag_min != null && ig?.hashtag_max != null
      ? `- ハッシュタグ数: ${ig.hashtag_min}〜${ig.hashtag_max}個`
      : "",
    "",
    "# TikTok",
    tt?.caption_style ? `- キャプションのスタイル: ${tt.caption_style}` : "",
    tt?.hashtag_count != null ? `- ハッシュタグ数: ${tt.hashtag_count}個` : "",
  ];

  return lines.filter((l) => l !== "").join("\n");
}

export function buildUserText(additionalTags: string[]): string {
  const lines = [
    "以下の動画の内容を解析し、上記のジャンル設定に沿ったSNS投稿文案を作成してください。",
  ];
  if (additionalTags.length > 0) {
    lines.push(`追加で反映してほしいタグ・要素: ${additionalTags.join(", ")}`);
  }
  return lines.join("\n");
}
