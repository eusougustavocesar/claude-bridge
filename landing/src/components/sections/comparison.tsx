import { BrandLogo } from "@/components/brand";
import { SectionHeader } from "@/components/section-header";
import { SetupTimeChart } from "@/components/setup-time-chart";

const rows = [
  { feature: "Persists when Claude Code closes", cb: "yes", rich: "no",     osisdie: "yes",       twilio: "yes"     },
  { feature: "Uses your Claude Code subscription", cb: "yes", rich: "yes",  osisdie: "yes",       twilio: "no"      },
  { feature: "Runtime footprint",                 cb: "~50 MB", rich: "0 (in CC)", osisdie: "2–4 GB", twilio: "cloud" },
  { feature: "Install",                           cb: "1 script", rich: "plugin",  osisdie: "docker",  twilio: "complex" },
  { feature: "Multi-channel",                     cb: "WA + more", rich: "WA only", osisdie: "5 channels", twilio: "any" },
  { feature: "Open source",                       cb: "MIT",  rich: "yes",   osisdie: "yes",       twilio: "varies"  },
];

function Cell({ value, strong = false }: { value: string; strong?: boolean }) {
  const isYes = value === "yes";
  const isNo = value === "no";
  return (
    <td className={`p-4 text-sm font-mono ${strong ? "text-foreground" : "text-muted-foreground"}`}>
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

export function Comparison() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <SectionHeader label="Prior art" title="Why not the alternatives?" />

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
                    Reverb
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
                <tr key={r.feature} className="border-b border-border last:border-b-0">
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
