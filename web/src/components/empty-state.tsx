import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Consistent empty-state block for any list/table that has no data.
 * Centered, minimal, with optional icon and call to action.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-3 py-16 px-6 border border-dashed border-border rounded-lg bg-card/30",
        className
      )}
    >
      {icon ? (
        <div
          className="h-12 w-12 flex items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden
        >
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-medium">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
