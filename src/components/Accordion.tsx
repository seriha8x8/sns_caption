"use client";

import { useState } from "react";

export default function Accordion({
  title,
  colorClass,
  defaultOpen = false,
  children,
}: {
  title: string;
  colorClass: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-xl overflow-hidden border border-white/60 ${colorClass}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold"
      >
        <span>{title}</span>
        <span className="text-sm">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}
