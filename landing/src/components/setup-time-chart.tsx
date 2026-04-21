"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Row {
  name: string;
  minutes: number;
  note?: string;
  highlight?: boolean;
}

const ROWS: Row[] = [
  { name: "claude-bridge", minutes: 2, note: "1 script", highlight: true },
  { name: "Rich627 plugin", minutes: 3, note: "but dies w/ Claude Code" },
  { name: "osisdie + Docker", minutes: 12, note: "+ 2–4 GB RAM idle" },
  { name: "n8n + webhook", minutes: 25, note: "flow + auth + server" },
  { name: "Twilio + API", minutes: 45, note: "+ paid tokens" },
];

const MAX = 45;

/**
 * Horizontal bar chart of install/setup time (minutes). Brand-colored bar
 * for us; muted for competitors. Bars animate into view on scroll.
 */
export function SetupTimeChart() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-border bg-card/40 p-6 md:p-8"
    >
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <h3 className="text-sm font-medium">Setup time (minutes, lower is better)</h3>
        <span className="text-xs font-mono text-muted-foreground">
          measured on a fresh macOS
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {ROWS.map((row) => {
          const pct = (row.minutes / MAX) * 100;
          return (
            <div key={row.name} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between text-sm">
                <span
                  className={cn(
                    "font-medium",
                    row.highlight ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {row.name}
                </span>
                <span className="flex items-baseline gap-2">
                  {row.note ? (
                    <span className="text-xs text-muted-foreground">
                      {row.note}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "font-mono tabular-nums",
                      row.highlight ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {row.minutes}m
                  </span>
                </span>
              </div>
              <div
                className="h-2 rounded-full bg-muted overflow-hidden"
                role="progressbar"
                aria-valuenow={row.minutes}
                aria-valuemin={0}
                aria-valuemax={MAX}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-1000 ease-out",
                    row.highlight ? "" : "bg-muted-foreground/40"
                  )}
                  style={{
                    width: visible ? `${pct}%` : "0%",
                    background: row.highlight ? "var(--brand)" : undefined,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
