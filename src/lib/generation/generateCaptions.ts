import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult } from "@/lib/analysis";
import type { GenerationResult, GenreWithSettings } from "@/lib/types";
import { buildSystemPrompt, buildUserText } from "./prompt";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

const CAPTIONS_TOOL: Anthropic.Tool = {
  name: "submit_captions",
  description: "生成したSNS投稿文案を構造化データとして提出する",
  input_schema: {
    type: "object",
    properties: {
      youtube: {
        type: "object",
        properties: {
          titles: {
            type: "array",
            items: { type: "string" },
            description: "タイトル案のリスト",
          },
          description: {
            type: "string",
            description: "概要欄の本文。固定フッターは含めない。",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "タグ欄用のキーワードのリスト(#は付けない)",
          },
        },
        required: ["titles", "description", "tags"],
      },
      instagram: {
        type: "object",
        properties: {
          caption: { type: "string" },
          hashtags: {
            type: "array",
            items: { type: "string" },
            description: "#を含まないハッシュタグのリスト",
          },
        },
        required: ["caption", "hashtags"],
      },
      tiktok: {
        type: "object",
        properties: {
          caption: { type: "string" },
          hashtags: {
            type: "array",
            items: { type: "string" },
            description: "#を含まないハッシュタグのリスト",
          },
        },
        required: ["caption", "hashtags"],
      },
    },
    required: ["youtube", "instagram", "tiktok"],
  },
};

interface RawCaptions {
  youtube: { titles: string[]; description: string; tags: string[] };
  instagram: { caption: string; hashtags: string[] };
  tiktok: { caption: string; hashtags: string[] };
}

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY が設定されていません。");
  }
  return new Anthropic({ apiKey });
}

function buildContent(
  analysis: AnalysisResult,
  additionalTags: string[]
): Anthropic.MessageParam["content"] {
  const text = buildUserText(additionalTags);

  if (analysis.kind === "transcript") {
    return [
      {
        type: "text",
        text: `${text}\n\n# 文字起こしテキスト\n${analysis.text}`,
      },
    ];
  }

  const imageBlocks: Anthropic.ImageBlockParam[] = analysis.frames.map(
    (frame) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: frame.mediaType,
        data: frame.base64,
      },
    })
  );

  return [
    ...imageBlocks,
    {
      type: "text",
      text: `${text}\n\n上記は動画から一定間隔で抽出したフレーム画像です。これらをもとに動画の内容を推測してください。`,
    },
  ];
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(key);
  }
  return result;
}

function withHashPrefix(tags: string[]): string[] {
  return tags.map((t) => (t.startsWith("#") ? t : `#${t}`));
}

function postProcess(
  raw: RawCaptions,
  genre: GenreWithSettings
): GenerationResult {
  const yt = genre.youtube;
  const ig = genre.instagram;
  const tt = genre.tiktok;

  let tags = dedupe(raw.youtube.tags.map((t) => t.replace(/^#/, "")));
  if (yt?.required_keywords?.length) {
    tags = dedupe([...yt.required_keywords, ...tags]);
  }

  let description = raw.youtube.description.trim();
  if (yt?.description_footer) {
    description = `${description}\n\n${yt.description_footer}`;
  }

  let instagramHashtags = withHashPrefix(dedupe(raw.instagram.hashtags));
  if (ig?.hashtag_max != null && instagramHashtags.length > ig.hashtag_max) {
    instagramHashtags = instagramHashtags.slice(0, ig.hashtag_max);
  }

  let tiktokHashtags = withHashPrefix(dedupe(raw.tiktok.hashtags));
  if (tt?.hashtag_count != null && tiktokHashtags.length > tt.hashtag_count) {
    tiktokHashtags = tiktokHashtags.slice(0, tt.hashtag_count);
  }

  return {
    youtube: {
      titles: raw.youtube.titles,
      description,
      tags,
    },
    instagram: {
      caption: raw.instagram.caption.trim(),
      hashtags: instagramHashtags,
    },
    tiktok: {
      caption: raw.tiktok.caption.trim(),
      hashtags: tiktokHashtags,
    },
  };
}

export async function generateCaptions(params: {
  genre: GenreWithSettings;
  analysis: AnalysisResult;
  additionalTags: string[];
}): Promise<GenerationResult> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: buildSystemPrompt(params.genre),
    tools: [CAPTIONS_TOOL],
    tool_choice: { type: "tool", name: "submit_captions" },
    messages: [
      {
        role: "user",
        content: buildContent(params.analysis, params.additionalTags),
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    throw new Error("AIから構造化データを取得できませんでした。");
  }

  return postProcess(toolUse.input as RawCaptions, params.genre);
}
