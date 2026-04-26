import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader } from "@/components/section-header";
import { TerminalBlock } from "@/components/terminal-block";
import { LinkCard } from "@/components/link-card";
import { GH_DOCS, GH_WHY, GH_RELEASE } from "@/lib/links";

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

export function Install() {
  return (
    <section id="install">
      <div className="mx-auto max-w-5xl px-6 py-32">
        <SectionHeader label="Install" title="Clone to daemon in 5 minutes." />

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
          Boot it once. It handles the rest — starts on login, reconnects on
          network drops, restarts on crash. Message yourself on WhatsApp to
          verify.
        </p>

        <div className="mt-8 grid sm:grid-cols-3 gap-3">
          <LinkCard href={GH_DOCS}    label="Docs"           description="Architecture, security model, troubleshooting." />
          <LinkCard href={GH_WHY}     label="Why it exists"  description="The persistence problem, explained." />
          <LinkCard href={GH_RELEASE} label="v0.1.0 release" description="Changelog and release notes." />
        </div>
      </div>
    </section>
  );
}
