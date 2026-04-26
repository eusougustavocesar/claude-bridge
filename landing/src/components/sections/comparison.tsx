import { SectionHeader } from "@/components/section-header";
import { SetupTimeChart } from "@/components/setup-time-chart";

export function Comparison() {
  return (
    <section>
      <div className="mx-auto max-w-5xl px-6 py-32">
        <SectionHeader label="Prior art" title="Why not the alternatives?" />
        <SetupTimeChart />
      </div>
    </section>
  );
}
