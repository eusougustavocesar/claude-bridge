import { CopyButton } from "@/components/copy-button";
import { SectionHeader } from "@/components/section-header";

const steps = [
  {
    n: "01",
    title: "Install",
    body: "Clone the repo, build, and run the install script. One command registers the daemon for your OS. No Docker, no Twilio, no API keys.",
    code: `git clone https://github.com/eusougustavocesar/reverb.git
cd reverb
npm install && npm run build

# macOS / Linux
bash scripts/install.sh

# Windows (PowerShell)
.\\scripts\\install.ps1`,
    lang: "bash",
  },
  {
    n: "02",
    title: "Pair your phone",
    body: "Scan a QR from your terminal. Reverb registers as a WhatsApp linked device, same protocol as WhatsApp Web. Auth survives reboots.",
    code: `npm run pair
# → QR renders in terminal
# → WhatsApp > Settings > Linked Devices > Link a Device`,
    lang: "bash",
  },
  {
    n: "03",
    title: "Start the daemon, walk away.",
    body: "The system service takes over. Starts on boot, reconnects on drops, restarts on crash. Message yourself on WhatsApp. Claude replies.",
    code: `# macOS
launchctl bootstrap gui/$(id -u) \\
  ~/Library/LaunchAgents/com.$(whoami).reverb.plist

# Linux
systemctl --user start reverb

# Windows
Start-ScheduledTask -TaskName "Reverb"

# Done. Message from anywhere.`,
    lang: "shell",
  },
];

export function HowItWorks() {
  return (
    <section id="how">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <SectionHeader label="How it works" title="Clone. Pair. Done." />

        <ol className="flex flex-col gap-6">
          {steps.map((step) => (
            <li key={step.n}>
              <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
                <div className="flex md:flex-col items-baseline md:items-start gap-3 md:gap-2 md:w-48 md:sticky md:top-20">
                  <span
                    className="text-4xl md:text-6xl font-bold font-mono leading-none tabular-nums"
                    style={{ color: "var(--brand)" }}
                  >
                    {step.n}
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight">
                    {step.title}
                  </h3>
                </div>

                <div className="flex flex-col gap-4 min-w-0">
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                    {step.body}
                  </p>
                  <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
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
          The daemon and Claude Code run as independent processes. The WhatsApp
          socket stays alive for hours; each Claude invocation exits in seconds.
          That&apos;s why Reverb works when plugin-based bridges don&apos;t.
        </p>
      </div>
    </section>
  );
}
