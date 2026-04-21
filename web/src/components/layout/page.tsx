import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

type Width = "narrow" | "default" | "wide";

const WIDTH: Record<Width, string> = {
  narrow: "max-w-3xl", // ~768px — forms, reading
  default: "max-w-5xl", // ~1024px — dashboards (default)
  wide: "max-w-7xl", // ~1280px — broad content, grids with many cols
};

interface PageProps extends HTMLAttributes<HTMLDivElement> {
  width?: Width;
  children: ReactNode;
}

/**
 * Page root wrapper. Enforces:
 *  - Consistent max-width (narrow / default / wide)
 *  - Vertical rhythm: gap-8 between top-level sections
 */
export function Page({
  width = "default",
  children,
  className,
  ...rest
}: PageProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-8 w-full mx-auto",
        WIDTH[width],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

/**
 * Canonical page header. Title + optional description + optional
 * right-aligned actions slot (buttons, status indicators, etc.).
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex flex-col gap-1 min-w-0">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-muted-foreground text-sm max-w-prose">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-3 shrink-0">{actions}</div>
      ) : null}
    </header>
  );
}

/**
 * Typed 12-col responsive grid. Defaults to gap-4 for intra-row spacing.
 *
 *   <Grid cols={{ base: 1, sm: 2, lg: 3 }}>
 *     <Card />
 *     <Card />
 *   </Grid>
 */
interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: {
    base?: 1 | 2 | 3 | 4 | 6 | 12;
    sm?: 1 | 2 | 3 | 4 | 6 | 12;
    md?: 1 | 2 | 3 | 4 | 6 | 12;
    lg?: 1 | 2 | 3 | 4 | 6 | 12;
  };
  gap?: 2 | 3 | 4 | 6 | 8;
  children: ReactNode;
}

const COLS_BASE: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6",
  12: "grid-cols-12",
};
const COLS_SM: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  6: "sm:grid-cols-6",
  12: "sm:grid-cols-12",
};
const COLS_MD: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  6: "md:grid-cols-6",
  12: "md:grid-cols-12",
};
const COLS_LG: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  6: "lg:grid-cols-6",
  12: "lg:grid-cols-12",
};
const GAP: Record<number, string> = {
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
};

export function Grid({
  cols = { base: 1 },
  gap = 4,
  children,
  className,
  ...rest
}: GridProps) {
  return (
    <div
      className={cn(
        "grid",
        GAP[gap],
        cols.base ? COLS_BASE[cols.base] : "grid-cols-1",
        cols.sm ? COLS_SM[cols.sm] : undefined,
        cols.md ? COLS_MD[cols.md] : undefined,
        cols.lg ? COLS_LG[cols.lg] : undefined,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
