"use client";

import Link from "next/link";
import { useStatus } from "@/hooks/use-status";
import { StatusIndicator } from "@/components/status-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Page, PageHeader, Grid } from "@/components/layout/page";
import { EmptyState } from "@/components/empty-state";
import { ClaudeAuthCard } from "@/components/claude-auth-card";
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
      <Page>
        <PageHeader
          title="Dashboard"
          description="Status and controls for the claude-bridge daemon."
        />
        <EmptyState
          title="Daemon unreachable"
          description="The admin API isn't responding. The daemon may not be running."
          icon={<span className="text-xl">⚠</span>}
          action={
            <code className="px-3 py-1.5 rounded-md bg-muted font-mono text-xs">
              launchctl kickstart -k gui/$(id -u)/com.$(whoami).claude-bridge
            </code>
          }
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Dashboard"
        description="Status and controls for the claude-bridge daemon."
        actions={
          <>
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
          </>
        }
      />

      <ClaudeAuthCard />

      <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={4}>
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

        <Card className="sm:col-span-2 lg:col-span-3">
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
      </Grid>

      <Grid cols={{ base: 1, md: 2 }} gap={4}>
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
      </Grid>
    </Page>
  );
}
