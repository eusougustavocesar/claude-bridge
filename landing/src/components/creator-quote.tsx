import Link from "next/link";

/**
 * Blockquote attributed to the creator. Adapted from docs/why-persistence.md.
 * Humanizes a solo OSS project. See: tRPC (KATT quote), Bun, Resend.
 */
export function CreatorQuote() {
  return (
    <section>
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <figure className="flex flex-col gap-8">
          <span
            aria-hidden
            className="text-7xl font-bold leading-none select-none"
            style={{ color: "var(--brand)", opacity: 0.5 }}
          >
            &ldquo;
          </span>

          <blockquote className="text-lg md:text-xl lg:text-2xl font-medium tracking-tight leading-snug text-foreground">
            I wanted to use Claude Code from my phone. The official plugin died
            the moment I closed the CLI. Docker ate 4 GB of RAM for a chat
            bridge. Twilio wanted a business account.
            <br />
            <br />
            <span className="text-muted-foreground">
              So I wrote a ~300-line daemon. It spawns{" "}
              <code className="font-mono text-base bg-muted px-1.5 py-0.5 rounded">
                claude --print
              </code>{" "}
              per message, runs as a LaunchAgent, and uses my existing
              subscription. Mac closed. Phone in pocket. Claude still replies.
            </span>
          </blockquote>

          <figcaption className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://github.com/eusougustavocesar.png?size=88"
              alt="Gustavo Cesar Fortkamp"
              width={44}
              height={44}
              className="rounded-full border border-border"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                Gustavo Cesar Fortkamp
              </span>
              <Link
                href="https://github.com/eusougustavocesar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                @eusougustavocesar · creator
              </Link>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
