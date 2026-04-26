export function MiniCode({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="rounded-md border border-border bg-background/60 overflow-hidden">
      <div className="px-3 py-1.5 border-b border-border">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {lang}
        </span>
      </div>
      <pre className="px-3 py-2 text-[11px] font-mono leading-relaxed text-foreground/80 overflow-x-auto">
        {code}
      </pre>
    </div>
  );
}
