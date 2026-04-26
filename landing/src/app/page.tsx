import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AnnouncementBar } from "@/components/announcement-bar";
import { StickyInstallBar } from "@/components/sticky-install-bar";
import { CreatorQuote } from "@/components/creator-quote";
import { FAQ } from "@/components/faq";
import { Hero } from "@/components/sections/hero";
import { Why } from "@/components/sections/why";
import { Features } from "@/components/sections/features";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Comparison } from "@/components/sections/comparison";
import { Install } from "@/components/sections/install";
import { FadeIn } from "@/components/fade-in";

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex flex-col">
        <FadeIn>
          <Hero />
        </FadeIn>
        <FadeIn>
          <Why />
        </FadeIn>
        <FadeIn>
          <Features />
        </FadeIn>
        <FadeIn>
          <HowItWorks />
        </FadeIn>
        <FadeIn>
          <Comparison />
        </FadeIn>
        <FadeIn>
          <CreatorQuote />
        </FadeIn>
        <FadeIn>
          <Install />
        </FadeIn>
        <FadeIn>
          <FAQ />
        </FadeIn>
      </main>
      <SiteFooter />
      <StickyInstallBar />
    </>
  );
}
