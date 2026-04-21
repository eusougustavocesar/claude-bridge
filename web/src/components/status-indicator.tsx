import { cn } from "@/lib/utils";
import type { ConnectionState } from "@/lib/api";

const TONE: Record<
  ConnectionState,
  { dot: string; label: string; text: string }
> = {
  connected: {
    dot: "bg-[var(--brand)] shadow-[0_0_8px_var(--brand)]",
    label: "Connected",
    text: "text-foreground",
  },
  pairing: {
    dot: "bg-amber-400",
    label: "Pairing",
    text: "text-amber-400",
  },
  connecting: {
    dot: "bg-sky-400 animate-pulse",
    label: "Connecting",
    text: "text-sky-400",
  },
  disconnected: {
    dot: "bg-zinc-500",
    label: "Disconnected",
    text: "text-muted-foreground",
  },
};

export function StatusIndicator({ state }: { state: ConnectionState }) {
  const t = TONE[state];
  return (
    <span className={cn("inline-flex items-center gap-2", t.text)}>
      <span className={cn("h-2 w-2 rounded-full", t.dot)} />
      <span className="text-sm font-medium">{t.label}</span>
    </span>
  );
}
