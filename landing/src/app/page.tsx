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
      </main>
      <SiteFooter />
      <StickyInstallBar />
    </>
  );
}
