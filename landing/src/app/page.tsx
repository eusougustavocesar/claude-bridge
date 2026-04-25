import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand";
import { SiteHeader } from "@/components/site-header";
import { AnnouncementBar } from "@/components/announcement-bar";
import { CopyButton } from "@/components/copy-button";
import { CreatorQuote } from "@/components/creator-quote";
import { FAQ } from "@/components/faq";
import { SetupTimeChart } from "@/components/setup-time-chart";
import { HeroTerminal } from "@/components/hero-terminal";
import { StickyInstallBar } from "@/components/sticky-install-bar";

const GH = "https://github.com/eusougustavocesar/reverb";
const GH_DOCS = `${GH}/tree/main/docs`;
const GH_WHY = `${GH}/blob/main/docs/why-persistence.md`;
const GH_RELEASE = `${GH}/releases/tag/v0.1.0`;

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex flex-col">
        <Hero />
        <Why />
        <Features />
        <HowItWorks />
        <Comparison />
        <CreatorQuote />
        <Install />
        <FAQ />
        <Footer />
      </main>
      <StickyInstallBar />
    </>
  );
}

// ============================================================================
// Hero
// ============================================================================

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 pt-20 pb-20">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* Left: text */}
          <div className="flex flex-col gap-7">
            <Badge
              variant="outline"
              className="font-mono text-[11px] tracking-wider uppercase self-start"
            >
              v0.1.0 · early access
            </Badge>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
              Your AI CLI,
              <br />
              <span className="text-muted-foreground">one message away.</span>
            </h1>

            <p className="text-lg text-muted-foreground">
              <b className="text-foreground">Reverb</b> is a lightweight daemon
              that connects any messaging channel to your AI CLI. Close your
              laptop — your AI keeps working.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={GH}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "lg" })}
              >
                ⭐ Star on GitHub
              </a>
              <Link
                href="#install"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Quickstart
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-mono text-muted-foreground">
              <span>MIT licensed</span>
              <span>·</span>
              <span>~50 MB RAM</span>
              <span>·</span>
              <span>macOS (Linux soon)</span>
              <span>·</span>
              <span>no cloud, no telemetry</span>
            </div>
          </div>

          {/* Right: demo GIF */}
          <div className="flex justify-center">
            <Image
              src="/demo.gif"
              alt="Sending a prompt from WhatsApp, Claude replies — Mac is asleep the whole time."
              width={480}
              height={566}
              className="rounded-xl w-full max-w-md"
              unoptimized
              priority
            />
          </div>

        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Why
// ============================================================================

function Why() {
  const problems = [
    {
      title: "Official plugins die with Claude Code",
      body: "Anthropic's WhatsApp channel plugin only runs while Claude Code is open. Close the CLI and the bridge is gone. Useless away from your desk.",
    },
    {
      title: "Docker alternatives are heavy",
      body: "Running a WhatsApp bridge in a 2–4 GB Linux VM 24/7 on your laptop is overkill for a personal tool.",
    },
    {
      title: "Twilio requires a budget",
      body: "Business API, paid tokens, a verified phone number. Good for SaaS, wrong tool for a dev assistant.",
    },
  ];

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="flex flex-col items-start gap-3 mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            The problem
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl">
            Every existing option had a wall.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {problems.map((p) => (
            <Card key={p.title} className="bg-card/40">
              <CardContent className="flex flex-col gap-2 pt-6">
                <h3 className="font-semibold text-base">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {p.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted-foreground max-w-2xl">
          reverb is a separate process that holds the WhatsApp socket alive
          and spawns{" "}
          <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
            claude --print
          </code>{" "}
          per message. LaunchAgent-hosted, 50 MB RAM, no cloud.{" "}
          <a
            href={GH_WHY}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:opacity-80 underline underline-offset-4"
          >
            Read the full story →
          </a>
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// Features
// ============================================================================

function Features() {
  return (
    <section id="features" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="flex flex-col items-start gap-3 mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl">
            Everything you&apos;d expect. Nothing you wouldn&apos;t.
          </h2>
        </div>

        {/* Bento: 4-col grid, cards span 1 or 2 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[220px]">
          {/* Big card — WhatsApp channel + snippet */}
          <BentoCard
            title="WhatsApp channel"
            body="Multidevice linked-device protocol via Baileys. No Business API, no cloud."
            colSpan={2}
          >
            <MiniCode
              lang="bash"
              code={`$ npm run pair
→ QR in terminal
→ scan in WhatsApp`}
            />
          </BentoCard>

          {/* Small — Persistence */}
          <BentoCard
            title="Persistent"
            body="macOS LaunchAgent. Auto-restart, auto-reconnect, ~50 MB RAM."
          />

          {/* Small — Sandboxed */}
          <BentoCard
            title="Sandboxed"
            body="Claude runs inside a scoped cwd. Your $HOME stays yours."
          />

          {/* Small — Rate-limited */}
          <BentoCard
            title="Rate-limited"
            body="Per-chat token bucket keeps runaway loops from burning your subscription."
          />

          {/* Big card — Admin UI + snippet */}
          <BentoCard
            title="Admin UI included"
            body="Localhost dashboard for pairing, config, logs, and kill switch."
            colSpan={2}
          >
            <MiniCode lang="url" code="http://127.0.0.1:3737/" />
          </BentoCard>

          {/* Small — Audit log */}
          <BentoCard
            title="Hashed audit log"
            body="Every processed message recorded. JIDs are SHA-256 hashes — never phone numbers."
          />
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  title,
  body,
  colSpan = 1,
  children,
}: {
  title: string;
  body: string;
  colSpan?: 1 | 2;
  children?: React.ReactNode;
}) {
  return (
    <Card
      className={`bg-card/40 overflow-hidden ${
        colSpan === 2 ? "sm:col-span-2" : ""
      }`}
    >
      <CardContent className="flex flex-col gap-3 p-6 h-full">
        <h3 className="font-semibold text-base">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
          {body}
        </p>
        {children ? <div className="mt-auto">{children}</div> : null}
      </CardContent>
    </Card>
  );
}

function MiniCode({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="rounded-md border border-border bg-background/60 overflow-hidden">
      <div className="px-3 py-1.5 border-b border-border flex items-center justify-between">
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

// ============================================================================
// How it works
// ============================================================================

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Install the daemon",
      body: "Clone, build, and generate a LaunchAgent plist. One script. No Docker, no Twilio, no API keys.",
      code: `git clone https://github.com/eusougustavocesar/reverb.git
cd reverb
npm install && npm run build
bash scripts/install.sh`,
      lang: "bash",
    },
    {
      n: "02",
      title: "Pair your phone",
      body: "Scan a QR once. Baileys connects as a WhatsApp linked device — same protocol as WhatsApp Web. Auth persists across reboots.",
      code: `npm run pair
# → QR renders in terminal
# → WhatsApp > Settings > Linked Devices > Link a Device`,
      lang: "bash",
    },
    {
      n: "03",
      title: "Start the daemon — close your Mac",
      body: "LaunchAgent takes over. Auto-start on boot, auto-reconnect, ~50 MB RAM. Message yourself on WhatsApp, Claude replies.",
      code: `launchctl bootstrap gui/$(id -u) \\
  ~/Library/LaunchAgents/com.$(whoami).reverb.plist

# You're done. Message from anywhere.`,
      lang: "bash",
    },
  ];

  return (
    <section id="how" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="flex flex-col items-start gap-3 mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            How it works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl">
            Three steps from clone to working daemon.
          </h2>
        </div>

        <ol className="flex flex-col gap-6">
          {steps.map((step) => (
            <li key={step.n}>
              <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
                {/* Step number column */}
                <div className="flex md:flex-col items-baseline md:items-start gap-3 md:gap-2 md:w-48 md:sticky md:top-20">
                  <span
                    className="text-5xl md:text-6xl font-bold font-mono leading-none tabular-nums"
                    style={{ color: "var(--brand)" }}
                  >
                    {step.n}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-semibold tracking-tight">
                      {step.title}
                    </h3>
                  </div>
                </div>

                {/* Body + code */}
                <div className="flex flex-col gap-4 min-w-0">
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                    {step.body}
                  </p>
                  <div className="rounded-xl border border-border bg-card/40 overflow-hidden relative">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                        {step.lang}
                      </span>
                      <CopyButton value={step.code} />
                    </div>
                    <pre className="p-4 text-xs md:text-sm font-mono overflow-x-auto leading-relaxed text-foreground/90">
                      {step.code}
                    </pre>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-12 text-sm text-muted-foreground max-w-2xl">
          Under the hood: the daemon and Claude Code are separate processes
          with independent lifecycles. The WhatsApp socket stays alive for
          hours; each Claude invocation exits in seconds. That&apos;s why it
          works when plugin-based bridges don&apos;t.
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// Comparison
// ============================================================================

function Comparison() {
  const rows = [
    {
      feature: "Persists when Claude Code closes",
      cb: "yes",
      rich: "no",
      osisdie: "yes",
      twilio: "yes",
    },
    {
      feature: "Uses your Claude Code subscription",
      cb: "yes",
      rich: "yes",
      osisdie: "yes",
      twilio: "no",
    },
    {
      feature: "Runtime footprint",
      cb: "~50 MB",
      rich: "0 (in CC)",
      osisdie: "2–4 GB",
      twilio: "cloud",
    },
    {
      feature: "Install",
      cb: "1 script",
      rich: "plugin",
      osisdie: "docker",
      twilio: "complex",
    },
    {
      feature: "Multi-channel",
      cb: "WA + more",
      rich: "WA only",
      osisdie: "5 channels",
      twilio: "any",
    },
    {
      feature: "Open source",
      cb: "MIT",
      rich: "yes",
      osisdie: "yes",
      twilio: "varies",
    },
  ];

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="flex flex-col items-start gap-3 mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Prior art
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl">
            Honest comparison.
          </h2>
        </div>

        <div className="mb-8">
          <SetupTimeChart />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card/40">
                <th className="text-left font-medium p-4">&nbsp;</th>
                <th className="text-left font-medium p-4">
                  <span className="inline-flex items-center gap-1.5">
                    <BrandLogo size={16} showWord={false} />
                    reverb
                  </span>
                </th>
                <th className="text-left font-medium p-4 text-muted-foreground whitespace-nowrap">
                  Rich627/whatsapp-claude-plugin
                </th>
                <th className="text-left font-medium p-4 text-muted-foreground whitespace-nowrap">
                  osisdie/claude-code-channels
                </th>
                <th className="text-left font-medium p-4 text-muted-foreground">
                  Twilio + API
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.feature}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="p-4 font-medium">{r.feature}</td>
                  <Cell value={r.cb} strong />
                  <Cell value={r.rich} />
                  <Cell value={r.osisdie} />
                  <Cell value={r.twilio} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Cell({ value, strong = false }: { value: string; strong?: boolean }) {
  const isYes = value === "yes";
  const isNo = value === "no";
  return (
    <td
      className={`p-4 text-sm font-mono ${
        strong ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {isYes ? (
        <span style={{ color: "var(--brand)" }}>✓</span>
      ) : isNo ? (
        <span className="opacity-50">—</span>
      ) : (
        value
      )}
    </td>
  );
}

// ============================================================================
// Install
// ============================================================================

function Install() {
  const macOS = `git clone https://github.com/eusougustavocesar/reverb.git
cd reverb
npm install && npm run build

# 1. Scaffold LaunchAgent plist
bash scripts/install.sh

# 2. Pair your phone (scan QR)
npm run pair

# 3. Start the daemon
launchctl bootstrap gui/$(id -u) \\
  ~/Library/LaunchAgents/com.$(whoami).reverb.plist`;

  const linux = `# systemd unit ships in v0.3 — for now, bare-metal:
git clone https://github.com/eusougustavocesar/reverb.git
cd reverb
npm install && npm run build
npm run pair          # scan QR, Ctrl+C when paired
nohup npm run start > reverb.log 2>&1 &`;

  const docker = `# Docker image is a v0.3 roadmap item. Follow:
# https://github.com/eusougustavocesar/reverb/issues
#
# Meanwhile: bare-metal install on any Node-capable host
# works the same way as Linux.`;

  return (
    <section id="install" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="flex flex-col items-start gap-3 mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Install
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl">
            Up and running in 5 minutes.
          </h2>
        </div>

        <Tabs defaultValue="macos" className="gap-4">
          <TabsList>
            <TabsTrigger value="macos">macOS</TabsTrigger>
            <TabsTrigger value="linux">Linux</TabsTrigger>
            <TabsTrigger value="docker">Docker</TabsTrigger>
          </TabsList>

          <TabsContent value="macos">
            <TerminalBlock lang="macOS · bash" code={macOS} />
          </TabsContent>
          <TabsContent value="linux">
            <TerminalBlock lang="Linux · bash" code={linux} />
          </TabsContent>
          <TabsContent value="docker">
            <TerminalBlock lang="Docker · planned" code={docker} />
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-sm text-muted-foreground max-w-2xl">
          That&apos;s it. The daemon runs on boot, reconnects through
          network drops, and restarts if it crashes. Message yourself on
          WhatsApp to test.
        </p>

        <div className="mt-8 grid sm:grid-cols-3 gap-3">
          <LinkCard
            href={GH_DOCS}
            label="Docs"
            description="Architecture, security, troubleshooting."
          />
          <LinkCard
            href={GH_WHY}
            label="Why this exists"
            description="Bug hunt writeup."
          />
          <LinkCard
            href={GH_RELEASE}
            label="v0.1.0 release"
            description="Changelog and binaries."
          />
        </div>
      </div>
    </section>
  );
}

function TerminalBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
        <span className="h-3 w-3 rounded-full bg-green-500/70" />
        <span className="ml-3 text-xs font-mono text-muted-foreground">
          {lang}
        </span>
        <div className="ml-auto">
          <CopyButton value={code} />
        </div>
      </div>
      <pre className="p-6 text-xs md:text-sm font-mono overflow-x-auto leading-relaxed text-foreground/90">
        {code}
      </pre>
    </div>
  );
}

function LinkCard({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-xl border border-border bg-card/40 p-5 hover:bg-card transition-colors flex flex-col gap-1"
    >
      <span className="font-medium text-sm flex items-center gap-2">
        {label}
        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
          ↗
        </span>
      </span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </a>
  );
}

// ============================================================================
// Footer
// ============================================================================

function Footer() {
  return (
    <footer className="py-12">
      <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <BrandLogo size={28} />
          <p className="text-xs text-muted-foreground max-w-md">
            MIT licensed · Built by{" "}
            <a
              href="https://github.com/eusougustavocesar"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              @eusougustavocesar
            </a>
          </p>
        </div>
        <nav className="flex items-center gap-5 text-sm">
          <a
            href={GH}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <a
            href={GH_DOCS}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
          </a>
          <a
            href={`${GH}/releases`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Releases
          </a>
        </nav>
      </div>
    </footer>
  );
}
