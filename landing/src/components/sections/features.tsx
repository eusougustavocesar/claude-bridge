import { BentoCard } from "@/components/bento-card";
import { MiniCode } from "@/components/mini-code";
import { SectionHeader } from "@/components/section-header";

export function Features() {
  return (
    <section id="features">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <SectionHeader label="Features" title="Built to run unattended." />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto sm:auto-rows-[220px]">
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
            body="Native system service on macOS, Linux, and Windows. Starts on boot, restarts on crash, reconnects on drops."
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

          <BentoCard
            title="Webhook notifications"
            body="Any process on the same machine POSTs to /api/notify and you get a WhatsApp message. Monitor your VPS, get deploy alerts, track errors — without exposing anything to the internet."
            colSpan={2}
          >
            <MiniCode
              lang="bash"
              code={`curl localhost:3737/api/notify \\\n  -d '{"title":"Deploy failed","level":"error","service":"api"}'`}
            />
          </BentoCard>

          <BentoCard
            title="Voice messages"
            body="Send a voice message, get a text reply. Whisper transcribes locally — no API key, no cloud, no extra billing."
          />

          <BentoCard
            title="Images, PDFs & stickers"
            body="Send any Claude-native file format — image, PDF, sticker — with or without a caption. Claude reads it from the sandbox. Vision, OCR, document parsing — just send it."
          />
        </div>
      </div>
    </section>
  );
}
