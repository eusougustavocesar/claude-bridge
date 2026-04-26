import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/section-header";

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
    <Card className={`bg-card/40 overflow-hidden ${colSpan === 2 ? "sm:col-span-2" : ""}`}>
      <CardContent className="flex flex-col gap-3 p-6 h-full">
        <h3 className="font-semibold text-base">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{body}</p>
        {children ? <div className="mt-auto">{children}</div> : null}
      </CardContent>
    </Card>
  );
}

function MiniCode({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="rounded-md border border-border bg-background/60 overflow-hidden">
      <div className="px-3 py-1.5 border-b border-border">
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

export function Features() {
  return (
    <section id="features" className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <SectionHeader label="Features" title="Built to run unattended." />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[220px]">
          <BentoCard
            title="WhatsApp channel"
            body="Linked-device protocol via Baileys. No Business API, no phone number hosting, no cloud relay."
            colSpan={2}
          >
            <MiniCode
              lang="bash"
              code={`$ npm run pair\n→ QR in terminal\n→ scan in WhatsApp`}
            />
          </BentoCard>

          <BentoCard
            title="Persistent"
            body="LaunchAgent on macOS. Starts on boot, restarts on crash, reconnects on network drops."
          />

          <BentoCard
            title="Sandboxed"
            body="Claude runs inside a scoped working directory. Your $HOME is off-limits."
          />

          <BentoCard
            title="Rate-limited"
            body="Per-chat token bucket. Runaway loops won't burn your subscription."
          />

          <BentoCard
            title="Admin UI"
            body="Local dashboard at 127.0.0.1:3737. Pair your phone, edit config, read logs, kill the daemon."
            colSpan={2}
          >
            <MiniCode lang="url" code="http://127.0.0.1:3737/" />
          </BentoCard>

          <BentoCard
            title="Audit log"
            body="Every message logged. JIDs stored as SHA-256 hashes, not phone numbers."
          />
        </div>
      </div>
    </section>
  );
}
