import { SectionHeader } from "@/components/section-header";
import { SetupTimeChart } from "@/components/setup-time-chart";

export function Comparison() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <SectionHeader label="Prior art" title="Why not the alternatives?" />
        <SetupTimeChart />
      </div>
    </section>
  );
}
