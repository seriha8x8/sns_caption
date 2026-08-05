"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-full bg-white/80 border border-pale-cyan px-3 py-1 text-xs font-medium text-foreground hover:bg-lavender/50 transition-colors"
    >
      {copied ? "コピーしました" : "コピー"}
    </button>
  );
}
