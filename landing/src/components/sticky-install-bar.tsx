"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

const INSTALL_CMD =
  "git clone https://github.com/eusougustavocesar/reverb.git";

/**
 * Slim install bar that slides in from the bottom after the user scrolls
 * past the hero. Dismissible per session via localStorage.
 */
export function StickyInstallBar() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Respect previous dismiss within the same tab session
    if (sessionStorage.getItem("cb-sticky-dismissed") === "1") {
      setDismissed(true);
      return;
    }
    const onScroll = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.8;
      const distanceFromBottom =
        document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      const nearFooter = distanceFromBottom < 300;
      setVisible(pastHero && !nearFooter);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed) return null;

  function dismiss() {
    sessionStorage.setItem("cb-sticky-dismissed", "1");
    setDismissed(true);
  }

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[min(95vw,620px)] w-full px-4",
        "transition-all duration-300",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <div className="rounded-full border border-border bg-background/95 shadow-2xl shadow-black/50 backdrop-blur flex items-center gap-2 px-3 py-2">
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ background: "var(--brand)" }}
          aria-hidden
        />
        <code className="flex-1 min-w-0 truncate font-mono text-xs text-foreground/90">
          {INSTALL_CMD}
        </code>
        <CopyButton value={INSTALL_CMD} label="Copy" />
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install bar"
          className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
