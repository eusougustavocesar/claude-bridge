"use client";

import { useEffect, useState } from "react";

/**
 * Debug grid overlay. Renders a 12-col grid + 8px baseline when the URL has
 * `?grid=1`. Toggleable with `Alt+G` during a session. Off by default — zero
 * runtime cost in production for users who don't opt in.
 */
export function GridOverlay() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("grid") === "1") setEnabled(true);

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "g" || e.key === "G")) {
        e.preventDefault();
        setEnabled((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        // 12-col grid (centered, matches max-w-5xl / 1024px)
        backgroundImage:
          "linear-gradient(to right, rgba(0,255,169,0.08) 1px, transparent 1px)",
        backgroundSize: "calc((min(1024px, 100vw) - 48px) / 12) 100%",
        backgroundPosition: "center top",
        backgroundRepeat: "repeat-x",
      }}
    >
      {/* 8px baseline (subtle) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(250,250,250,0.04) 1px, transparent 1px)",
          backgroundSize: "100% 8px",
        }}
      />
      <div className="absolute bottom-4 left-4 rounded-md bg-background/90 border border-border px-3 py-1.5 text-xs font-mono text-muted-foreground">
        grid · 12 col · 8 px baseline · <span className="opacity-60">Alt+G</span>
      </div>
    </div>
  );
}
