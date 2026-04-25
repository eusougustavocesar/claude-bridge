"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Page, PageHeader } from "@/components/layout/page";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[reverb] unhandled:", error);
  }, [error]);

  return (
    <Page>
      <PageHeader
        title="Something broke"
        description="The UI hit an unexpected error. The daemon might still be running — this only affects the admin view."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
            Error details
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <pre className="text-xs font-mono bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
{error.message}
{error.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>
          <div className="flex gap-2">
            <Button onClick={reset} size="sm">
              Try again
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              size="sm"
            >
              Back to dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </Page>
  );
}
