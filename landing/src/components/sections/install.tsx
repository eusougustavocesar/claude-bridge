import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader } from "@/components/section-header";
import { TerminalBlock } from "@/components/terminal-block";
import { LinkCard } from "@/components/link-card";
import { GH_DOCS, GH_WHY, GH_RELEASE } from "@/lib/links";

const macOS = `git clone https://github.com/eusougustavocesar/reverb.git
cd reverb && npm install && npm run setup

# Then pair your phone (interactive QR scan)
npm run pair
# iOS:     WhatsApp › Settings › Linked Devices › Link a Device
# Android: WhatsApp › ⋮ Menu  › Linked Devices › Link a Device`;

const linux = `git clone https://github.com/eusougustavocesar/reverb.git
cd reverb && npm install && npm run setup

# Then pair your phone (interactive QR scan)
npm run pair
# iOS:     WhatsApp › Settings › Linked Devices › Link a Device
# Android: WhatsApp › ⋮ Menu  › Linked Devices › Link a Device

# Optional: persist across reboots without re-login
sudo loginctl enable-linger $USER`;

const windows = `git clone https://github.com/eusougustavocesar/reverb.git
cd reverb; npm install; npm run setup

# Then pair your phone (interactive QR scan)
npm run pair
# iOS:     WhatsApp › Settings › Linked Devices › Link a Device
# Android: WhatsApp › ⋮ Menu  › Linked Devices › Link a Device`;

export function Install() {
  return (
    <section id="install">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <SectionHeader label="Install" title="Up and running in minutes." />

        <Tabs defaultValue="macos" className="gap-4">
          <TabsList>
            <TabsTrigger value="macos">macOS</TabsTrigger>
            <TabsTrigger value="linux">Linux</TabsTrigger>
            <TabsTrigger value="windows">Windows</TabsTrigger>
          </TabsList>
          <TabsContent value="macos">
            <TerminalBlock lang="macOS · bash" code={macOS} />
          </TabsContent>
          <TabsContent value="linux">
            <TerminalBlock lang="Linux · bash" code={linux} />
          </TabsContent>
          <TabsContent value="windows">
            <TerminalBlock lang="Windows · powershell" code={windows} />
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-sm text-muted-foreground max-w-2xl">
          Boot it once. It handles the rest — starts on login, reconnects on
          network drops, restarts on crash. Message yourself on WhatsApp to
          verify.
        </p>

        <div className="mt-6 rounded-xl border border-border bg-card/40 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ background: "var(--brand)" }}
              aria-hidden
            />
            <span className="text-sm font-medium">Want 24/7 uptime?</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Run Reverb on a Linux VPS — a $5/mo server stays online while your
            laptop sleeps. The Linux systemd path handles everything.
          </p>
          <div className="flex items-center gap-3 shrink-0 text-xs font-mono text-muted-foreground">
            <span>macOS</span>
            <span aria-hidden>·</span>
            <span className="font-semibold" style={{ color: "var(--brand)" }}>Linux / VPS</span>
            <span aria-hidden>·</span>
            <span>Windows</span>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-3 gap-3">
          <LinkCard href={GH_DOCS}    label="Docs"           description="Architecture, security model, troubleshooting." />
          <LinkCard href={GH_WHY}     label="Why it exists"  description="The persistence problem, explained." />
          <LinkCard href={GH_RELEASE} label="v0.4.0 release" description="Changelog and release notes." />
        </div>
      </div>
    </section>
  );
}
