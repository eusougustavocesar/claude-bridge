import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const GH_ISSUES =
  "https://github.com/eusougustavocesar/reverb/issues/new";

const items = [
  {
    q: "Does it use my Claude Code subscription or require an API key?",
    a: "Your existing Claude Code subscription — no API key, no extra billing. The daemon spawns `claude --print` as a subprocess, which uses your locally authenticated session just like you would in a terminal.",
  },
  {
    q: "Can WhatsApp ban my number?",
    a: "Possible but historically rare for personal use. reverb uses the WhatsApp multidevice protocol via Baileys (same transport as WhatsApp Web). WhatsApp's ToS doesn't officially bless programmatic clients. For high-volume or commercial use, pair a dedicated number — not your main line.",
  },
  {
    q: "Is it secure? Can someone on my network control it?",
    a: "The admin HTTP server binds to 127.0.0.1 only — never exposed to the network. Claude Code runs sandboxed to a scoped working directory (never $HOME by default). Per-chat rate limiting prevents runaway loops. Audit log stores SHA-256 hashes, never phone numbers.",
  },
  {
    q: "Does it work on Linux or just macOS?",
    a: "v0.1 ships with a macOS LaunchAgent installer. The daemon itself is pure Node — any Linux with Node 20+ can run it via `npm run start` or nohup. A proper systemd unit is on the v0.3 roadmap.",
  },
  {
    q: "What happens when my Mac sleeps?",
    a: "WhatsApp socket disconnects, daemon auto-reconnects when the Mac wakes. For true 24/7 availability, run the daemon on a mini-server or Linux VPS — it's one Node process.",
  },
  {
    q: "Can I use it with Claude Code Max or team plans?",
    a: "Yes — the daemon is agnostic to your plan. Whatever `claude --print` supports, reverb supports.",
  },
  {
    q: "Why not use the official Anthropic plugin marketplace?",
    a: "The official WhatsApp channel plugin only runs inside the Claude Code process. Close Claude Code and the bridge dies. reverb is a separate daemon — that's the whole point.",
  },
  {
    q: "Will there be more channels (Telegram, Signal)?",
    a: "Telegram is the next planned channel. Signal and Discord are on the roadmap. The daemon architecture is channel-agnostic — adapters plug in.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="border-b border-border">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="flex flex-col items-start gap-3 mb-10">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Questions I&apos;d ask too.
          </h2>
        </div>

        <Accordion className="w-full">
          {items.map((item, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`}>
              <AccordionTrigger className="text-left font-medium">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="mt-8 text-sm text-muted-foreground">
          Didn&apos;t find your answer?{" "}
          <Link
            href={GH_ISSUES}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4 hover:opacity-80"
          >
            Open an issue →
          </Link>
        </p>
      </div>
    </section>
  );
}
