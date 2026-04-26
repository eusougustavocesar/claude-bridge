import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/section-header";
import { GH_WHY } from "@/lib/links";

const problems = [
  {
    title: "Plugins die with Claude Code",
    body: "Anthropic's WhatsApp plugin only lives inside Claude Code. Close the CLI and the bridge goes with it. Useless the moment you step away.",
  },
  {
    title: "Docker is 4 GB of overkill",
    body: "A full Linux VM running 24/7 just to relay a chat message. Wrong tool for a personal assistant.",
  },
  {
    title: "Twilio bills you",
    body: "A verified business number, API tokens, ongoing costs. Built for SaaS products, not a dev's daily driver.",
  },
];

export function Why() {
  return (
    <section>
      <div className="mx-auto max-w-5xl px-6 py-24">
        <SectionHeader label="The problem" title="Everything else had a catch." />

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
          Reverb is a separate process. It holds the WhatsApp socket alive and
          spawns{" "}
          <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
            claude --print
          </code>{" "}
          per message. LaunchAgent-hosted, ~50 MB RAM, no cloud.{" "}
          <a
            href={GH_WHY}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:opacity-80 underline underline-offset-4"
          >
            Read the full writeup →
          </a>
        </p>
      </div>
    </section>
  );
}
