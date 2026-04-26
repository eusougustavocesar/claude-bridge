import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand";
import { SiteHeader } from "@/components/site-header";
import { AnnouncementBar } from "@/components/announcement-bar";
import { CreatorQuote } from "@/components/creator-quote";
import { FAQ } from "@/components/faq";
import { StarsBadge } from "@/components/stars-badge";
import { StickyInstallBar } from "@/components/sticky-install-bar";
import { Why } from "@/components/sections/why";
import { Features } from "@/components/sections/features";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Comparison } from "@/components/sections/comparison";
import { Install } from "@/components/sections/install";
import { GH, GH_DOCS } from "@/lib/links";

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex flex-col">
        <Hero />
        <Why />
        <Features />
        <HowItWorks />
        <Comparison />
        <CreatorQuote />
        <Install />
        <FAQ />
        <Footer />
      </main>
      <StickyInstallBar />
    </>
  );
}

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 pt-20 pb-20">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">

          <div className="flex flex-col gap-7">
            <Badge
              variant="outline"
              className="font-mono text-[11px] tracking-wider uppercase self-start"
            >
              v0.1.0 · early access
            </Badge>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
              Your AI CLI,
              <br />
              <span className="text-muted-foreground">one message away.</span>
            </h1>

            <p className="text-lg text-muted-foreground">
              Send a WhatsApp message from anywhere.{" "}
              <b className="text-foreground">Claude replies.</b> Your Mac
              doesn&apos;t even need to be open.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <StarsBadge size="lg" />
              <Link
                href="#install"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Quickstart
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <Image
              src="/demo.gif"
              alt="Sending a prompt from WhatsApp, Claude replies. Mac is asleep the whole time."
              width={480}
              height={566}
              className="rounded-xl w-full max-w-md"
              unoptimized
              priority
            />
          </div>

        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12">
      <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
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
