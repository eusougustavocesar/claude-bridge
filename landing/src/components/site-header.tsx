import Link from "next/link";
import { BrandLogo } from "./brand";
import { StarsBadge } from "./stars-badge";

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40 py-4"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="mx-auto max-w-5xl px-6 flex items-center justify-between relative"
        style={{ pointerEvents: "all" }}
      >
        <Link href="/" aria-label="reverb home">
          <BrandLogo size={28} />
        </Link>

        <nav
          className="absolute left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-0.5 px-2 py-1.5 rounded-full border border-border backdrop-blur-md"
          style={{
            background: "color-mix(in srgb, var(--background) 75%, transparent)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
          }}
        >
          {[
            { href: "#features", label: "Features" },
            { href: "#how",      label: "How it works" },
            { href: "#install",  label: "Install" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors px-3 py-1.5 rounded-full"
            >
              {label}
            </Link>
          ))}
        </nav>

        <StarsBadge />
      </div>
    </header>
  );
}
