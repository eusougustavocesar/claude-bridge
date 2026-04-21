"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/pair", label: "Pair" },
  { href: "/config", label: "Config" },
  { href: "/logs", label: "Logs" },
];

export function Nav() {
  const pathname = usePathname();
  const normalize = (p: string) => p.replace(/\/$/, "") || "/";
  const current = normalize(pathname);

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-14 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-5xl px-6 h-14 flex items-center gap-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold tracking-tight text-base"
        >
          <Brand />
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active = current === normalize(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto">
          <span className="text-xs font-mono text-muted-foreground">
            localhost:3737
          </span>
        </div>
      </div>
    </header>
  );
}

function Brand() {
  return (
    <span className="flex items-center gap-2">
      <svg
        viewBox="0 0 32 32"
        width="20"
        height="20"
        fill="none"
        aria-hidden
      >
        <circle cx="6" cy="16" r="3" fill="currentColor" />
        <circle cx="26" cy="16" r="3" fill="currentColor" />
        <path
          d="M9 16 H23"
          stroke="var(--brand)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span>
        claude<span style={{ color: "var(--brand)" }}>-</span>bridge
      </span>
    </span>
  );
}
