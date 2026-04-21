"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIndicator } from "@/components/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Page, PageHeader } from "@/components/layout/page";
import { useStatus } from "@/hooks/use-status";
import { api } from "@/lib/api";

export default function PairPage() {
  const { status, error } = useStatus(2000);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  // Poll /api/qr independently — status.hasQr only tells us "there is one",
  // not the actual string to render.
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const { qr } = await api.qr();
        if (!cancelled) {
          setQrValue(qr);
          setQrError(null);
        }
      } catch (e) {
        if (!cancelled) setQrError((e as Error).message);
      }
    }
    tick();
    const id = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Render QR whenever the value changes
  useEffect(() => {
    if (!qrValue || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrValue, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 360,
      color: {
        dark: "#fafafa",
        light: "#00000000", // transparent background
      },
    }).catch((e) => setQrError(String(e)));
  }, [qrValue]);

  const connection = status?.connection ?? "disconnected";

  return (
    <Page>
      <PageHeader
        title="Pair a phone"
        description="Link a WhatsApp account to the bridge. The daemon stays paired across reboots."
        actions={status ? <StatusIndicator state={connection} /> : null}
      />

      {connection === "connected" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Already paired
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {status?.me?.name ? (
              <p>
                Connected as{" "}
                <Badge variant="secondary" className="font-mono">
                  {status.me.name}
                </Badge>
              </p>
            ) : null}
            <p className="text-muted-foreground">
              To pair a different phone, stop the daemon, wipe{" "}
              <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                auth_info/
              </code>
              , then restart.
            </p>
            <pre className="bg-muted text-xs font-mono p-3 rounded-md overflow-x-auto whitespace-pre">
{`launchctl bootout gui/$(id -u)/com.$(whoami).claude-bridge
rm -rf auth_info
launchctl bootstrap gui/$(id -u) \\
  ~/Library/LaunchAgents/com.$(whoami).claude-bridge.plist`}
            </pre>
          </CardContent>
        </Card>
      ) : (
        // Asymmetric layout: QR card sizes to content, instructions take rest
        <div className="grid md:grid-cols-[auto_1fr] gap-4 items-start">
          <Card className="p-0 overflow-hidden shrink-0">
            <CardContent className="p-4 flex items-center justify-center h-[380px] w-[380px]">
              {qrValue ? (
                <canvas
                  ref={canvasRef}
                  className="rounded-md"
                  aria-label="WhatsApp pairing QR code"
                />
              ) : (
                <div className="h-[340px] w-[340px] rounded-md border border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
                  {qrError ? (
                    <span className="text-destructive text-xs font-mono px-4 text-center">
                      {qrError}
                    </span>
                  ) : (
                    <span>Waiting for QR…</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                How to scan
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <ol className="list-decimal list-outside ml-5 space-y-2 text-foreground/90">
                <li>Open <b>WhatsApp</b> on your phone</li>
                <li>
                  Go to <b>Settings → Linked Devices → Link a Device</b>
                </li>
                <li>Scan the QR on the left</li>
                <li>
                  Wait a few seconds — when pairing completes, this page flips
                  to the <b>Already paired</b> state and you’re done.
                </li>
              </ol>

              <div className="text-xs text-muted-foreground border-t border-border pt-3 space-y-1">
                <p>
                  QR refreshes roughly every 20 seconds. If nothing happens
                  after ~1 minute, the daemon might not be running — check the
                  Dashboard.
                </p>
                <p>
                  Need another pairing? The daemon supports a single linked
                  device at a time.
                </p>
              </div>

              {error ? (
                <p className="text-destructive text-xs font-mono">{error}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </Page>
  );
}
