"use client";

import { useEffect, useRef, useState } from "react";
import ResultDisplay from "@/components/ResultDisplay";
import type { Genre, Generation, VideoType } from "@/lib/types";

export default function VideoUploadForm() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreId, setGenreId] = useState("");
  const [videoType, setVideoType] = useState<VideoType>("short");
  const [file, setFile] = useState<File | null>(null);
  const [additionalTags, setAdditionalTags] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<Generation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/genres")
      .then((res) => res.json())
      .then((data: { genres: Genre[] }) => {
        setGenres(data.genres ?? []);
        if (data.genres?.length) setGenreId(data.genres[0].id);
      })
      .catch(() => setError("ジャンル一覧の取得に失敗しました。"));
  }, []);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!genreId) {
      setError("ジャンルを選択してください。");
      return;
    }
    if (!file) {
      setError("動画ファイルをアップロードしてください。");
      return;
    }

    setLoading(true);
    setGeneration(null);

    try {
      const formData = new FormData();
      formData.append("genreId", genreId);
      formData.append("videoType", videoType);
      formData.append("video", file);
      formData.append(
        "additionalTags",
        JSON.stringify(
          additionalTags
            .split(/[,、]/)
            .map((t) => t.trim())
            .filter(Boolean)
        )
      );

      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "生成に失敗しました。");
      }

      setGeneration(data.generation as Generation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-pale-yellow/50 p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">ジャンル</span>
            <select
              value={genreId}
              onChange={(e) => setGenreId(e.target.value)}
              className="rounded-lg border border-pale-cyan bg-white px-3 py-2 text-sm"
            >
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.display_name}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">動画種別</legend>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="videoType"
                  checked={videoType === "long"}
                  onChange={() => setVideoType("long")}
                />
                ロング(文字起こしで解析)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="videoType"
                  checked={videoType === "short"}
                  onChange={() => setVideoType("short")}
                />
                ショート(フレーム画像で解析)
              </label>
            </div>
          </fieldset>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center text-sm transition-colors ${
            isDragging ? "border-lavender bg-lavender/30" : "border-pale-cyan bg-white/60"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <p className="font-medium">{file.name}</p>
          ) : (
            <p>動画ファイルをドラッグ&ドロップ、またはクリックして選択</p>
          )}
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">追加タグ(任意・カンマ区切り)</span>
          <input
            type="text"
            value={additionalTags}
            onChange={(e) => setAdditionalTags(e.target.value)}
            placeholder="例: かぎ針編み, コースター, 初心者向け"
            className="rounded-lg border border-pale-cyan bg-white px-3 py-2 text-sm"
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-lavender px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "生成中..." : "生成する"}
        </button>
      </form>

      {generation && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">生成結果</h2>
          <ResultDisplay
            result={{
              youtube: generation.output_youtube,
              instagram: generation.output_instagram,
              tiktok: generation.output_tiktok,
            }}
          />
        </div>
      )}
    </div>
  );
}
