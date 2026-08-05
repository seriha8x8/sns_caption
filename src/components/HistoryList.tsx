"use client";

import { useEffect, useState } from "react";
import ResultDisplay from "@/components/ResultDisplay";
import type { Generation, GenerationListItem } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryList() {
  const [items, setItems] = useState<GenerationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Generation | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function fetchList(): Promise<GenerationListItem[]> {
    const res = await fetch("/api/generations");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.generations ?? [];
  }

  useEffect(() => {
    let cancelled = false;
    fetchList()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "履歴の取得に失敗しました。");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/generations/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDetail(data.generation as Generation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "詳細の取得に失敗しました。");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/generations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (expandedId === id) {
        setExpandedId(null);
        setDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました。");
    }
  }

  if (loading) return <p className="text-sm text-foreground/60">読み込み中...</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (items.length === 0) {
    return <p className="text-sm text-foreground/60">まだ生成履歴がありません。</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl bg-white/70 border border-pale-cyan overflow-hidden">
          <div
            className="flex flex-wrap items-center gap-3 px-4 py-3 cursor-pointer hover:bg-lavender/20"
            onClick={() => handleExpand(item.id)}
          >
            <span className="text-sm text-foreground/60">{formatDate(item.created_at)}</span>
            <span className="text-sm font-semibold">
              {item.genre_display_name ?? item.genre_id}
            </span>
            <span className="text-xs rounded-full bg-pale-yellow px-2 py-0.5">
              {item.video_type === "long" ? "ロング" : "ショート"}
            </span>
            {item.additional_tags.length > 0 && (
              <span className="text-xs text-foreground/60">
                {item.additional_tags.join(", ")}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item.id);
              }}
              className="ml-auto rounded-full bg-white border border-pale-cyan px-3 py-1 text-xs hover:bg-pale-pink"
            >
              削除
            </button>
          </div>
          {expandedId === item.id && (
            <div className="px-4 pb-4">
              {detailLoading && <p className="text-sm text-foreground/60">読み込み中...</p>}
              {detail && (
                <ResultDisplay
                  result={{
                    youtube: detail.output_youtube,
                    instagram: detail.output_instagram,
                    tiktok: detail.output_tiktok,
                  }}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
