import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="relative z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-5xl px-6 h-9 flex items-center justify-center gap-2 text-xs">
        <span
          className="h-1.5 w-1.5 rounded-full animate-pulse"
          style={{ background: "var(--brand)" }}
          aria-hidden
        />
        <span className="text-muted-foreground">
          New version of Reverb available.
        </span>
        <Link
          href="https://github.com/eusougustavocesar/reverb/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:opacity-80 transition-opacity inline-flex items-center gap-1"
        >
          see what&apos;s new
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
