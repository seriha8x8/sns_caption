import CopyButton from "@/components/CopyButton";
import type { GenerationResult } from "@/lib/types";

function Field({
  label,
  value,
  copyValue,
  multiline = false,
}: {
  label: string;
  value: React.ReactNode;
  copyValue: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-lg bg-white/70 border border-white/60 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-foreground/70">{label}</span>
        <CopyButton text={copyValue} />
      </div>
      <div
        className={`text-sm text-foreground ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

export default function ResultDisplay({ result }: { result: GenerationResult }) {
  const tagsText = result.youtube.tags.join(", ");
  const igHashtagsText = result.instagram.hashtags.join(" ");
  const ttHashtagsText = result.tiktok.hashtags.join(" ");

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <section className="rounded-xl bg-pale-pink p-4 space-y-3">
        <h3 className="font-semibold text-foreground">YouTube</h3>
        <div className="space-y-2">
          {result.youtube.titles.map((title, i) => (
            <Field
              key={i}
              label={`タイトル案 ${i + 1}`}
              value={title}
              copyValue={title}
            />
          ))}
          <Field
            label="概要欄"
            value={result.youtube.description}
            copyValue={result.youtube.description}
            multiline
          />
          <Field label="タグ" value={tagsText} copyValue={tagsText} multiline />
        </div>
      </section>

      <section className="rounded-xl bg-lavender p-4 space-y-3">
        <h3 className="font-semibold text-foreground">Instagram</h3>
        <div className="space-y-2">
          <Field
            label="キャプション"
            value={result.instagram.caption}
            copyValue={result.instagram.caption}
            multiline
          />
          <Field
            label="ハッシュタグ"
            value={igHashtagsText}
            copyValue={igHashtagsText}
            multiline
          />
        </div>
      </section>

      <section className="rounded-xl bg-pale-cyan p-4 space-y-3">
        <h3 className="font-semibold text-foreground">TikTok</h3>
        <div className="space-y-2">
          <Field
            label="キャプション"
            value={result.tiktok.caption}
            copyValue={result.tiktok.caption}
            multiline
          />
          <Field
            label="ハッシュタグ"
            value={ttHashtagsText}
            copyValue={ttHashtagsText}
            multiline
          />
        </div>
      </section>
    </div>
  );
}
