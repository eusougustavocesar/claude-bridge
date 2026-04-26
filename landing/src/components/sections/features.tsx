import { BentoCard } from "@/components/bento-card";
import { MiniCode } from "@/components/mini-code";
import { SectionHeader } from "@/components/section-header";

export function Features() {
  return (
    <section id="features">
      <div className="mx-auto max-w-5xl px-6 py-24">
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
