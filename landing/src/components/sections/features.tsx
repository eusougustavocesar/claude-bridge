import { Card, CardContent } from "@/components/ui/card";
import { MiniCode } from "@/components/mini-code";
import { SectionHeader } from "@/components/section-header";

export function Features() {
  return (
    <section id="features">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <SectionHeader label="Features" title="Built to run unattended." />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[190px] gap-4">

          {/* ── Omnichannel — featured 2×2 ─────────────────────────────── */}
          <Card
            className="bg-card/40 overflow-hidden sm:col-span-2 lg:row-span-2"
            style={{
              borderColor: "color-mix(in srgb, var(--brand) 35%, var(--border))",
            }}
          >
            <CardContent className="flex flex-col p-6 h-full gap-4">
              <div className="flex flex-wrap gap-1.5">
                {["WhatsApp", "Telegram", "HTTP"].map((ch) => (
                  <span
                    key={ch}
                    className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-border bg-muted/60 text-muted-foreground"
                  >
                    {ch}
                  </span>
                ))}
              </div>

              <div>
                <h3 className="font-semibold text-base mb-1.5">Omnichannel</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  WhatsApp, Telegram, and any external app via{" "}
                  <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                    POST /api/chat
                  </code>
                  . One handler, any channel — swap the transport, keep the behavior.
                </p>
              </div>

              <div className="mt-auto">
                <MiniCode
                  lang="env · bash"
                  code={`# Telegram\nTELEGRAM_ENABLED=true\nTELEGRAM_TOKEN=your-bot-token\n\n# Any app\ncurl localhost:3737/api/chat \\\n  -d '{"message": "deploy status?"}'`}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Always-on ──────────────────────────────────────────────── */}
          <Card className="bg-card/40">
            <CardContent className="flex flex-col justify-between p-6 h-full">
              <h3 className="font-semibold text-base">Always-on</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                LaunchAgent, systemd, Task Scheduler. Starts on boot, restarts
                on crash, reconnects on drops.
              </p>
            </CardContent>
          </Card>

          {/* ── Secure by default ──────────────────────────────────────── */}
          <Card className="bg-card/40">
            <CardContent className="flex flex-col justify-between p-6 h-full">
              <h3 className="font-semibold text-base">Secure by default</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Claude sandboxed to a scoped dir — $HOME off-limits. Per-chat
                rate limiting. Hashed IDs in audit log.
              </p>
            </CardContent>
          </Card>

          {/* ── Voice messages ─────────────────────────────────────────── */}
          <Card className="bg-card/40">
            <CardContent className="flex flex-col justify-between p-6 h-full">
              <h3 className="font-semibold text-base">Voice messages</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Whisper transcribes locally — no API key. Enable with{" "}
                <code className="font-mono text-xs bg-muted px-1 rounded">
                  AUDIO_ENABLED=true
                </code>
                .
              </p>
            </CardContent>
          </Card>

          {/* ── Images & documents ─────────────────────────────────────── */}
          <Card className="bg-card/40">
            <CardContent className="flex flex-col justify-between p-6 h-full">
              <h3 className="font-semibold text-base">Images & docs</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Images, PDFs, stickers saved to Claude&apos;s sandbox — vision,
                OCR, document parsing.
              </p>
            </CardContent>
          </Card>

          {/* ── Webhook notifications ──────────────────────────────────── */}
          <Card className="bg-card/40 overflow-hidden sm:col-span-2">
            <CardContent className="flex flex-col p-6 h-full gap-3">
              <div>
                <h3 className="font-semibold text-base mb-1">
                  Webhook notifications
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Any local process POSTs to{" "}
                  <code className="font-mono text-xs bg-muted px-1 rounded">
                    /api/notify
                  </code>{" "}
                  — deploy alerts, errors, cron results. Bound to localhost.
                </p>
              </div>
              <div className="mt-auto">
                <MiniCode
                  lang="bash"
                  code={`curl localhost:3737/api/notify \\\n  -d '{"title":"Deploy failed","level":"error","service":"api"}'`}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Monitors ───────────────────────────────────────────────── */}
          <Card className="bg-card/40 overflow-hidden sm:col-span-2">
            <CardContent className="flex flex-col p-6 h-full gap-3">
              <div>
                <h3 className="font-semibold text-base mb-1">Monitors</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Health checks and shell jobs via{" "}
                  <code className="font-mono text-xs bg-muted px-1 rounded">
                    monitors.json
                  </code>
                  . Alerts on down, recovery, or non-zero exit.
                </p>
              </div>
              <div className="mt-auto">
                <MiniCode
                  lang="json"
                  code={`{ "name": "api", "type": "http",\n  "url": "http://localhost:3000/health",\n  "interval": "5m" }`}
                />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </section>
  );
}
