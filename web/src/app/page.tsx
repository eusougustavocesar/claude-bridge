"use client";

import Link from "next/link";
import { useStatus } from "@/hooks/use-status";
import { StatusIndicator } from "@/components/status-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUptime, api } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";

export default function Dashboard() {
  const { status, error } = useStatus(2000);
  const [stopping, setStopping] = useState(false);

  async function handleStop() {
    if (!confirm("Stop the claude-bridge daemon?")) return;
    setStopping(true);
    try {
      await api.stop();
      toast.success("Daemon stop requested. Restart via launchctl.");
    } catch (e) {
      toast.error(`Stop failed: ${(e as Error).message}`);
      setStopping(false);
    }
  }

  if (error && !status) {
    return (
      <div className="flex flex-col gap-2 p-8 rounded-lg border border-destructive/30 bg-destructive/5">
        <h2 className="text-xl font-semibold">Daemon unreachable</h2>
        <p className="text-sm text-muted-foreground font-mono">{error}</p>
        <p className="text-sm mt-2">
          Is the daemon running? Try:
          <code className="ml-2 px-2 py-1 rounded bg-muted font-mono text-xs">
            launchctl kickstart -k gui/$(id -u)/com.$(whoami).claude-bridge
          </code>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Status and controls for the claude-bridge daemon.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status?.hasQr ? (
            <Link href="/pair" className={buttonVariants({ size: "sm" })}>
              Scan pairing QR →
            </Link>
          ) : null}
          <Button
            onClick={handleStop}
            disabled={stopping || !status}
            variant="outline"
            size="sm"
          >
            {stopping ? "Stopping…" : "Stop daemon"}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status ? (
              <StatusIndicator state={status.connection} />
            ) : (
              <span className="text-muted-foreground text-sm">Loading…</span>
            )}
            {status?.me?.name ? (
              <p className="text-sm font-mono text-muted-foreground mt-2 truncate">
                {status.me.name}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono tabular-nums">
              {status ? formatUptime(status.uptimeMs) : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Messages processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono tabular-nums">
              {status?.processed ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Version
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="font-mono text-xs">
              v{status?.version ?? "—"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Last error
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status?.lastError ? (
              <p className="text-sm font-mono text-destructive break-all">
                {status.lastError}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">None</p>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pairing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {status?.connection === "connected"
                ? "Already paired. If you need to re-pair a different phone, stop the daemon, wipe auth_info/, then restart."
                : "Scan the QR with your phone's WhatsApp: Settings → Linked Devices → Link a Device."}
            </p>
            <Link
              href="/pair"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Open pairing view →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Edit <code className="font-mono text-xs">.env</code> via UI. Changes require
              a daemon restart to take effect.
            </p>
            <Link
              href="/config"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Edit config →
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
