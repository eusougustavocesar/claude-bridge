import { BentoCard } from "@/components/bento-card";
import { MiniCode } from "@/components/mini-code";
import { SectionHeader } from "@/components/section-header";

export function Features() {
  return (
    <section id="features">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <SectionHeader label="Features" title="Built to run unattended." />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto sm:auto-rows-[220px]">

          {/* Row 1 */}
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
            title="Always-on"
            body="Native system service on macOS, Linux, and Windows. Starts on boot, restarts on crash, reconnects on drops."
          />

          <BentoCard
            title="Secure by default"
            body="Claude is sandboxed to a scoped directory — $HOME is off-limits. Per-chat rate limiting. Every message audit-logged with hashed JIDs."
          />

          {/* Row 2 */}
          <BentoCard
            title="Webhook notifications"
            body="Any process on the same machine POSTs to /api/notify and you get a WhatsApp message. Deploy alerts, error tracking, cron results — local only, never exposed."
            colSpan={2}
          >
            <MiniCode
              lang="bash"
              code={`curl localhost:3737/api/notify \\\n  -d '{"title":"Deploy failed","level":"error","service":"api"}'`}
            />
          </BentoCard>

          <BentoCard
            title="Monitors"
            body="Active health checks and scheduled shell jobs via monitors.json. Alerts on down, recovery, or non-zero exit."
            colSpan={2}
          >
            <MiniCode
              lang="json"
              code={`{ "name": "api", "type": "http",\n  "url": "http://localhost:3000/health",\n  "interval": "5m" }`}
            />
          </BentoCard>

          {/* Row 3 */}
          <BentoCard
            title="Voice messages"
            body="Send a voice message, get a text reply. Whisper transcribes locally — no API key, no cloud, no extra billing."
            colSpan={2}
          />

          <BentoCard
            title="Images, PDFs & stickers"
            body="Send any Claude-native format with or without a caption. Claude reads it from the sandbox — vision, OCR, document parsing."
            colSpan={2}
          />

        </div>
      </div>
    </section>
  );
}
