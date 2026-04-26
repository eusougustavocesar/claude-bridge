import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { StarsBadge } from "@/components/stars-badge";

export function Hero() {
  return (
    <section className="min-h-[calc(100vh-6.75rem)] flex items-center justify-center">
      <div className="mx-auto max-w-5xl px-6 w-full">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">

          <div className="flex flex-col gap-5 md:gap-7 items-center md:items-start text-center md:text-left">
            <Badge
              variant="outline"
              className="font-mono text-[11px] tracking-wider uppercase"
            >
              v0.6.0 · early access
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Your AI CLI,
              <br />
              <span className="text-muted-foreground">one message away.</span>
            </h1>

            <p className="text-lg text-muted-foreground">
              Message Claude from WhatsApp, Telegram, or any app.{" "}
              <b className="text-foreground">Claude replies.</b> Your machine
              doesn&apos;t even need to be on.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Link
                href="#install"
                className={buttonVariants({ variant: "default", size: "lg" })}
                style={{
                  background: "color-mix(in srgb, var(--primary) 85%, transparent)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                Quickstart
              </Link>
              <StarsBadge size="lg" />
            </div>
          </div>

          <div className="flex justify-center">
            <Image
              src="/demo.gif"
              alt="Sending a prompt from WhatsApp, Claude replies. Host machine is asleep the whole time."
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
