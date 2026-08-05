import { GoogleGenAI, Type, type Schema } from "@google/genai";
import type { AnalysisResult } from "@/lib/analysis";
import type { GenerationResult, GenreWithSettings } from "@/lib/types";
import { buildSystemPrompt, buildUserText } from "./prompt";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    youtube: {
      type: Type.OBJECT,
      properties: {
        titles: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "タイトル案のリスト",
        },
        description: {
          type: Type.STRING,
          description: "概要欄の本文。固定フッターは含めない。",
        },
        tags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "タグ欄用のキーワードのリスト(#は付けない)",
        },
      },
      required: ["titles", "description", "tags"],
    },
    instagram: {
      type: Type.OBJECT,
      properties: {
        caption: { type: Type.STRING },
        hashtags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "#を含まないハッシュタグのリスト",
        },
      },
      required: ["caption", "hashtags"],
    },
    tiktok: {
      type: Type.OBJECT,
      properties: {
        caption: { type: Type.STRING },
        hashtags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "#を含まないハッシュタグのリスト",
        },
      },
      required: ["caption", "hashtags"],
    },
  },
  required: ["youtube", "instagram", "tiktok"],
};

interface RawCaptions {
  youtube: { titles: string[]; description: string; tags: string[] };
  instagram: { caption: string; hashtags: string[] };
  tiktok: { caption: string; hashtags: string[] };
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY が設定されていません。");
  }
  return new GoogleGenAI({ apiKey });
}

function buildContentParts(
  analysis: AnalysisResult,
  additionalTags: string[]
) {
  const text = buildUserText(additionalTags);

  if (analysis.kind === "transcript") {
    return [{ text: `${text}\n\n# 文字起こしテキスト\n${analysis.text}` }];
  }

  const imageParts = analysis.frames.map((frame) => ({
    inlineData: { mimeType: frame.mediaType, data: frame.base64 },
  }));

  return [
    ...imageParts,
    {
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
  const client = getGeminiClient();

  const response = await client.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: buildContentParts(params.analysis, params.additionalTags),
      },
    ],
    config: {
      systemInstruction: buildSystemPrompt(params.genre),
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("AIから応答を取得できませんでした。");
  }

  let raw: RawCaptions;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("AIの応答をJSONとして解析できませんでした。");
  }

  return postProcess(raw, params.genre);
}
