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
    q: "Does it work on Linux and Windows?",
    a: "Yes. On Linux, `bash scripts/install.sh` deploys a systemd user service automatically. On Windows, `install.ps1` registers a Task Scheduler job — no admin required. The core daemon is pure Node.js with no OS-specific native bindings.",
  },
  {
    q: "What happens when my machine sleeps?",
    a: "The WhatsApp socket drops. When it wakes, Reverb auto-reconnects. For true 24/7 uptime, run it on a Linux VPS or always-on server — it's one Node process.",
  },
  {
    q: "Can I use it to monitor my VPS and get alerts on WhatsApp?",
    a: "Yes — two ways. The monitors engine (monitors.json) runs active health checks on URLs and shell scripts on a schedule, alerting you when a service goes down or a job fails. For passive alerts, any process can POST to http://localhost:3737/api/notify with a title, body, level, and service name. Both bind to localhost only — nothing is exposed to the internet.",
  },
  {
    q: "Can I send voice messages and images?",
    a: "Yes. Voice messages are transcribed locally with Whisper (pip install openai-whisper) — no API key required. Images are saved to Claude's sandbox and read directly. Both features are opt-in via AUDIO_ENABLED and IMAGE_ENABLED in .env.",
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
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <div className="flex flex-col items-start gap-3 mb-10">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            FAQ
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
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
