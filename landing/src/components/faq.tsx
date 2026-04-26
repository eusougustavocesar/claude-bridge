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
    a: "Your existing Claude Code subscription. No API key, no extra billing. Reverb spawns `claude --print` as a subprocess using your locally authenticated session.",
  },
  {
    q: "Can WhatsApp ban my number?",
    a: "Rare for personal use, but possible. Reverb uses the same multidevice protocol as WhatsApp Web. Their ToS doesn't officially allow programmatic clients. For automation at volume, use a dedicated number.",
  },
  {
    q: "Is it secure? Can someone on my network control it?",
    a: "The admin server binds to 127.0.0.1 only — never exposed to the network. Claude runs sandboxed to a scoped directory, never $HOME. Rate limiting prevents runaway loops. The audit log stores SHA-256 hashes, not phone numbers.",
  },
  {
    q: "Does it work on Linux?",
    a: "The daemon runs on any Node 20+ host. v0.1 ships with a macOS LaunchAgent. A systemd unit is on the v0.3 roadmap — until then, nohup works fine.",
  },
  {
    q: "What happens when my Mac sleeps?",
    a: "The WhatsApp socket drops. When the Mac wakes, Reverb auto-reconnects. For true 24/7 uptime, run it on a Linux VPS or mini-server — it's one Node process.",
  },
  {
    q: "Does it work with Claude Code Max or team plans?",
    a: "Yes. If `claude --print` works for your plan, Reverb works.",
  },
  {
    q: "Why not the official Anthropic plugin?",
    a: "The official plugin lives inside Claude Code. Close Claude Code and the bridge dies. Reverb is a separate process — that's the whole point.",
  },
  {
    q: "Will there be Telegram, Signal, Discord?",
    a: "Telegram is next. Signal and Discord are on the roadmap. The adapter architecture is channel-agnostic — adding a new channel is a single file.",
  },
];

export function FAQ() {
  return (
    <section id="faq">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <div className="flex flex-col items-start gap-3 mb-10">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Questions you&apos;d ask too.
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
          Still have questions?{" "}
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
