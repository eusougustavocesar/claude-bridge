export function SectionHeader({
  label,
  title,
  mb = "mb-12",
}: {
  label: string;
  title: string;
  mb?: string;
}) {
  return (
    <div className={`flex flex-col items-start gap-3 ${mb}`}>
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl">
        {title}
      </h2>
    </div>
  );
}
