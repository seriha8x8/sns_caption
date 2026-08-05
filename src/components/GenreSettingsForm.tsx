"use client";

import { useEffect, useState } from "react";
import Accordion from "@/components/Accordion";
import type { Genre, GenreWithSettings } from "@/lib/types";

interface FormState {
  id: string;
  display_name: string;
  target_audience: string;
  tone: string;
  yt_title_count: string;
  yt_title_style: string;
  yt_description_footer: string;
  yt_hashtag_count: string;
  yt_hashtag_ratio: string;
  yt_weighted_hashtags: string;
  yt_tag_char_target: string;
  yt_required_keywords: string;
  ig_caption_style: string;
  ig_hashtag_min: string;
  ig_hashtag_max: string;
  tt_caption_style: string;
  tt_hashtag_count: string;
}

const EMPTY_FORM: FormState = {
  id: "",
  display_name: "",
  target_audience: "",
  tone: "",
  yt_title_count: "5",
  yt_title_style: "",
  yt_description_footer: "",
  yt_hashtag_count: "30",
  yt_hashtag_ratio: "",
  yt_weighted_hashtags: "",
  yt_tag_char_target: "900",
  yt_required_keywords: "",
  ig_caption_style: "",
  ig_hashtag_min: "10",
  ig_hashtag_max: "20",
  tt_caption_style: "",
  tt_hashtag_count: "5",
};

function toFormState(genre: GenreWithSettings): FormState {
  return {
    id: genre.id,
    display_name: genre.display_name,
    target_audience: genre.target_audience ?? "",
    tone: genre.tone ?? "",
    yt_title_count: String(genre.youtube?.title_count ?? 5),
    yt_title_style: genre.youtube?.title_style ?? "",
    yt_description_footer: genre.youtube?.description_footer ?? "",
    yt_hashtag_count: String(genre.youtube?.hashtag_count ?? 30),
    yt_hashtag_ratio: genre.youtube?.hashtag_ratio ?? "",
    yt_weighted_hashtags: (genre.youtube?.weighted_hashtags ?? []).join(", "),
    yt_tag_char_target: String(genre.youtube?.tag_char_target ?? 900),
    yt_required_keywords: (genre.youtube?.required_keywords ?? []).join(", "),
    ig_caption_style: genre.instagram?.caption_style ?? "",
    ig_hashtag_min: genre.instagram?.hashtag_min != null ? String(genre.instagram.hashtag_min) : "",
    ig_hashtag_max: genre.instagram?.hashtag_max != null ? String(genre.instagram.hashtag_max) : "",
    tt_caption_style: genre.tiktok?.caption_style ?? "",
    tt_hashtag_count: genre.tiktok?.hashtag_count != null ? String(genre.tiktok.hashtag_count) : "",
  };
}

function splitList(value: string): string[] {
  return value
    .split(/[,、]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function GenreSettingsForm() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchGenres(): Promise<Genre[]> {
    const res = await fetch("/api/genres");
    const data = await res.json();
    return data.genres ?? [];
  }

  async function fetchGenreDetail(id: string): Promise<GenreWithSettings> {
    const res = await fetch(`/api/genres/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.genre as GenreWithSettings;
  }

  useEffect(() => {
    let cancelled = false;
    fetchGenres().then((list) => {
      if (cancelled) return;
      setGenres(list);
      if (list.length) setSelectedId(list[0].id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId || isNew) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for the fetch kicked off below
    setLoading(true);
    setError(null);
    fetchGenreDetail(selectedId)
      .then((genre) => {
        if (!cancelled) setForm(toFormState(genre));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "ジャンル設定の取得に失敗しました。");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, isNew]);

  function handleNewGenre() {
    setIsNew(true);
    setSelectedId("");
    setForm(EMPTY_FORM);
    setMessage(null);
    setError(null);
  }

  function handleSelectExisting(id: string) {
    setIsNew(false);
    setSelectedId(id);
    setMessage(null);
    setError(null);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const id = isNew ? form.id.trim() : selectedId;
    if (!id) {
      setError("ジャンルIDを入力してください。");
      return;
    }
    if (!form.display_name.trim()) {
      setError("表示名を入力してください。");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/genres/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: form.display_name,
          target_audience: form.target_audience,
          tone: form.tone,
          youtube: {
            title_count: Number(form.yt_title_count) || 5,
            title_style: form.yt_title_style,
            description_footer: form.yt_description_footer,
            hashtag_count: Number(form.yt_hashtag_count) || 0,
            hashtag_ratio: form.yt_hashtag_ratio,
            weighted_hashtags: splitList(form.yt_weighted_hashtags),
            tag_char_target: Number(form.yt_tag_char_target) || 0,
            required_keywords: splitList(form.yt_required_keywords),
          },
          instagram: {
            caption_style: form.ig_caption_style,
            hashtag_min: form.ig_hashtag_min ? Number(form.ig_hashtag_min) : null,
            hashtag_max: form.ig_hashtag_max ? Number(form.ig_hashtag_max) : null,
          },
          tiktok: {
            caption_style: form.tt_caption_style,
            hashtag_count: form.tt_hashtag_count ? Number(form.tt_hashtag_count) : null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage("保存しました。");
      setIsNew(false);
      setSelectedId(id);
      setGenres(await fetchGenres());
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={isNew ? "" : selectedId}
          onChange={(e) => handleSelectExisting(e.target.value)}
          className="rounded-lg border border-pale-cyan bg-white px-3 py-2 text-sm"
        >
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.display_name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleNewGenre}
          className="rounded-full bg-pale-cyan px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + 新規ジャンル追加
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-foreground/60">読み込み中...</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <section className="rounded-xl bg-pale-yellow/50 p-4 space-y-3">
            <h3 className="font-semibold">基本設定</h3>
            {isNew && (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">ジャンルID(英数字・半角、例: knitting)</span>
                <input
                  type="text"
                  value={form.id}
                  onChange={(e) => update("id", e.target.value)}
                  className="rounded-lg border border-pale-cyan bg-white px-3 py-2"
                  required
                />
              </label>
            )}
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">表示名</span>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => update("display_name", e.target.value)}
                className="rounded-lg border border-pale-cyan bg-white px-3 py-2"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">ターゲット層</span>
              <input
                type="text"
                value={form.target_audience}
                onChange={(e) => update("target_audience", e.target.value)}
                className="rounded-lg border border-pale-cyan bg-white px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">トーン</span>
              <input
                type="text"
                value={form.tone}
                onChange={(e) => update("tone", e.target.value)}
                className="rounded-lg border border-pale-cyan bg-white px-3 py-2"
              />
            </label>
          </section>

          <Accordion title="YouTube設定" colorClass="bg-pale-pink/50">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">タイトル案の数</span>
              <input
                type="number"
                min={1}
                value={form.yt_title_count}
                onChange={(e) => update("yt_title_count", e.target.value)}
                className="rounded-lg border border-pale-cyan bg-white px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">タイトルスタイル</span>
              <input
                type="text"
                value={form.yt_title_style}
                onChange={(e) => update("yt_title_style", e.target.value)}
                className="rounded-lg border border-pale-cyan bg-white px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">概要欄末尾の固定文面</span>
              <textarea
                value={form.yt_description_footer}
                onChange={(e) => update("yt_description_footer", e.target.value)}
                rows={6}
                className="rounded-lg border border-pale-cyan bg-white px-3 py-2 font-mono text-xs"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">ハッシュタグ個数</span>
                <input
                  type="number"
                  min={0}
                  value={form.yt_hashtag_count}
                  onChange={(e) => update("yt_hashtag_count", e.target.value)}
                  className="rounded-lg border border-pale-cyan bg-white px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">比率(例: 日本8:海外2)</span>
                <input
                  type="text"
                  value={form.yt_hashtag_ratio}
                  onChange={(e) => update("yt_hashtag_ratio", e.target.value)}
                  className="rounded-lg border border-pale-cyan bg-white px-3 py-2"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">厚めに入れたいワード(カンマ区切り)</span>
              <input
                type="text"
                value={form.yt_weighted_hashtags}
                onChange={(e) => update("yt_weighted_hashtags", e.target.value)}
                className="rounded-lg border border-pale-cyan bg-white px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">タグ文字数目安</span>
              <input
                type="number"
                min={0}
                value={form.yt_tag_char_target}
                onChange={(e) => update("yt_tag_char_target", e.target.value)}
                className="rounded-lg border border-pale-cyan bg-white px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">必須キーワード(カンマ区切り)</span>
              <textarea
                value={form.yt_required_keywords}
                onChange={(e) => update("yt_required_keywords", e.target.value)}
                rows={3}
                className="rounded-lg border border-pale-cyan bg-white px-3 py-2"
              />
            </label>
          </Accordion>

          <Accordion title="Instagram設定" colorClass="bg-lavender/50">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">キャプションスタイル</span>
              <input
                type="text"
                value={form.ig_caption_style}
                onChange={(e) => update("ig_caption_style", e.target.value)}
                className="rounded-lg border border-pale-cyan bg-white px-3 py-2"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">ハッシュタグ最小</span>
                <input
                  type="number"
                  min={0}
                  value={form.ig_hashtag_min}
                  onChange={(e) => update("ig_hashtag_min", e.target.value)}
                  className="rounded-lg border border-pale-cyan bg-white px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">ハッシュタグ最大</span>
                <input
                  type="number"
                  min={0}
                  value={form.ig_hashtag_max}
                  onChange={(e) => update("ig_hashtag_max", e.target.value)}
                  className="rounded-lg border border-pale-cyan bg-white px-3 py-2"
                />
              </label>
            </div>
          </Accordion>

          <Accordion title="TikTok設定" colorClass="bg-pale-cyan/50">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">キャプションスタイル</span>
              <input
                type="text"
                value={form.tt_caption_style}
                onChange={(e) => update("tt_caption_style", e.target.value)}
                className="rounded-lg border border-pale-cyan bg-white px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">ハッシュタグ個数</span>
              <input
                type="number"
                min={0}
                value={form.tt_hashtag_count}
                onChange={(e) => update("tt_hashtag_count", e.target.value)}
                className="rounded-lg border border-pale-cyan bg-white px-3 py-2"
              />
            </label>
          </Accordion>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-lavender px-6 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存する"}
          </button>
        </form>
      )}
    </div>
  );
}
