import styles from "./hero-terminal.module.css";
import { cn } from "@/lib/utils";

/**
 * Decorative "what a conversation looks like" terminal.
 * Pure CSS typewriter animation (no JS) — infinite loop.
 * Placed next to the phone GIF in the hero.
 */
export function HeroTerminal() {
  return (
    <div className="rounded-2xl border border-border bg-card/80 overflow-hidden shadow-2xl shadow-black/40 w-full max-w-md">
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
        <span className="h-3 w-3 rounded-full bg-green-500/70" />
        <span className="ml-3 text-[11px] font-mono text-muted-foreground">
          whatsapp · you → you
        </span>
      </div>

      <div className="p-5 font-mono text-[13px] leading-relaxed min-h-[196px]">
        {/* Prompt — typed in, then waits */}
        <div className={cn(styles.line, styles.prompt)}>
          <span className="text-muted-foreground mr-2">you</span>
          <span className={styles.typed}>teste claude</span>
          <span className={styles.cursor} aria-hidden />
        </div>

        {/* Typing indicator — shows after prompt */}
        <div className={cn(styles.line, styles.typing)}>
          <span className="text-muted-foreground text-xs">
            reverb{" "}
            <span className={styles.dots}>
              <span>·</span>
              <span>·</span>
              <span>·</span>
            </span>
          </span>
        </div>

        {/* Response — fades in last */}
        <div className={cn(styles.line, styles.response)}>
          <span
            className="mr-2 font-semibold"
            style={{ color: "var(--brand)" }}
          >
            claude
          </span>
          <span className="text-foreground">
            pong. bridge online, machine off.
          </span>
        </div>
      </div>
    </div>
  );
}
