"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "動画から生成" },
  { href: "/genres", label: "ジャンル設定" },
  { href: "/history", label: "生成履歴" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-pale-cyan bg-pale-pink/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center gap-4">
        <span className="text-lg font-semibold text-foreground">
          🧶 YouTube投稿アシスタント
        </span>
        <nav className="flex gap-2 ml-auto">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-lavender text-foreground shadow-sm"
                    : "bg-white/70 text-foreground hover:bg-lavender/60"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
