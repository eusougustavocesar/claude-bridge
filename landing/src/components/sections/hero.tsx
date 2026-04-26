import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { StarsBadge } from "@/components/stars-badge";

export function Hero() {
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
