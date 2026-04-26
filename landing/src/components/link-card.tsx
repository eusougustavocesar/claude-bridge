export function LinkCard({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-xl border border-border bg-card/40 p-5 hover:bg-card transition-colors flex flex-col gap-1"
    >
      <span className="font-medium text-sm flex items-center gap-2">
        {label}
        <span className="text-muted-foreground group-hover:text-foreground transition-colors">↗</span>
      </span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </a>
  );
}
