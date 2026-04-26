import { BrandLogo } from "@/components/brand";
import { GH, GH_DOCS } from "@/lib/links";

export function SiteFooter() {
  return (
    <footer className="py-10 md:py-12">
      <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-2 items-center sm:items-start">
          <BrandLogo size={28} />
          <p className="text-xs text-muted-foreground max-w-md">
            MIT licensed · Built by{" "}
            <a
              href="https://github.com/eusougustavocesar"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              @eusougustavocesar
            </a>
          </p>
        </div>
        <nav className="flex items-center gap-5 text-sm">
          <a href={GH} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            GitHub
          </a>
          <a href={GH_DOCS} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            Docs
          </a>
          <a href={`${GH}/releases`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            Releases
          </a>
        </nav>
      </div>
    </footer>
  );
}
