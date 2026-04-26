import { CopyButton } from "@/components/copy-button";

export function TerminalBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
        <span className="h-3 w-3 rounded-full bg-green-500/70" />
        <span className="ml-3 text-xs font-mono text-muted-foreground">{lang}</span>
        <div className="ml-auto">
          <CopyButton value={code} />
        </div>
      </div>
      <pre className="p-4 md:p-6 text-xs md:text-sm font-mono overflow-x-auto leading-relaxed text-foreground/90">
        {code}
      </pre>
    </div>
  );
}
