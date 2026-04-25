import Link from "next/link";
import { BrandLogo } from "./brand";
import { StarsBadge } from "./stars-badge";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-5xl px-6 h-14 flex items-center">
        <Link href="/" aria-label="reverb home">
          <BrandLogo size={28} />
        </Link>
        <nav className="ml-auto flex items-center gap-5 text-sm">
          <Link
            href="#features"
            className="hidden sm:inline text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how"
            className="hidden sm:inline text-muted-foreground hover:text-foreground transition-colors"
          >
            How it works
          </Link>
          <Link
            href="#install"
            className="hidden sm:inline text-muted-foreground hover:text-foreground transition-colors"
          >
            Install
          </Link>
          <StarsBadge />
        </nav>
      </div>
    </header>
  );
}
