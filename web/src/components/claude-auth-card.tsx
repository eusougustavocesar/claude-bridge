"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, type ClaudeAuthStatus } from "@/lib/api";
import { CopyButton } from "./copy-button";
import { toast } from "sonner";

/**
 * Dashboard card: Claude CLI auth status + "Connect with Claude" flow.
 *
 * Architecture: the daemon runs `claude login` as a subprocess, parses the
 * OAuth URL from stdout, and surfaces it here. User opens URL in browser
 * (or the CLI auto-opens), completes the flow. Daemon polls completion.
 */
export function ClaudeAuthCard() {
  const [status, setStatus] = useState<ClaudeAuthStatus | null>(null);
  const [starting, setStarting] = useState(false);
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);

  async function load() {
    try {
      const s = await api.claudeAuth();
      setStatus(s);
      if (s.authenticated && loadingUrl) {
        // Auto-close the active login once auth succeeds
        setLoadingUrl(null);
        toast.success("Claude authenticated — you're all set.");
      }
    } catch {
      /* silent — dashboard handles daemon-unreachable state */
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingUrl]);

  async function startLogin() {
    setStarting(true);
    try {
      const res = await api.claudeAuthStart();
      setLoadingUrl(res.url);
      // Open in new tab (some claude CLIs already do this themselves,
      // but doing it here handles the headless-spawn case)
      window.open(res.url, "_blank", "noopener,noreferrer");
      toast.info("Complete the login in the new browser tab.");
    } catch (e) {
      toast.error(`Failed to start login: ${(e as Error).message}`);
    } finally {
      setStarting(false);
    }
  }

  async function cancelLogin() {
    try {
      await api.claudeAuthCancel();
      setLoadingUrl(null);
      toast("Login cancelled.");
    } catch {
      /* ignore */
    }
  }

  if (!status) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
            Claude
          </CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-sm text-muted-foreground">Checking…</span>
        </CardContent>
      </Card>
    );
  }

  // ---- States ----

  if (status.authenticated && !status.loginRunning) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
            Claude
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-2 text-sm">
            <span
              className="h-2 w-2 rounded-full shadow-[0_0_6px_var(--brand)]"
              style={{ background: "var(--brand)" }}
            />
            <span className="font-medium">Authenticated</span>
          </span>
          <p className="text-xs text-muted-foreground">
            Your Claude Code subscription is in use. No API key required.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status.loginRunning && (status.loginUrl || loadingUrl)) {
    const url = status.loginUrl ?? loadingUrl!;
    return (
      <Card className="border-amber-400/30 bg-amber-400/[0.03]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wider text-amber-400">
            Claude · awaiting login
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Complete the flow in your browser. We&apos;ll auto-detect when
            you&apos;re done.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono underline underline-offset-2 text-foreground hover:opacity-80 truncate max-w-full"
            >
              {url}
            </a>
            <div className="ml-auto flex items-center gap-2">
              <CopyButton value={url} label="Copy URL" />
              <Button onClick={cancelLogin} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not authenticated — offer connect button
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
          Claude
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-zinc-500" />
          Not authenticated
        </span>
        {status.probeError ? (
          <p className="text-xs font-mono text-muted-foreground break-all">
            {status.probeError}
          </p>
        ) : null}
        <Button
          onClick={startLogin}
          disabled={starting}
          size="sm"
          className="self-start"
        >
          {starting ? "Starting…" : "Connect with Claude →"}
        </Button>
      </CardContent>
    </Card>
  );
}
