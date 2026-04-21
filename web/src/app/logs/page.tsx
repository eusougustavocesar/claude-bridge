"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Page, PageHeader } from "@/components/layout/page";
import { EmptyState } from "@/components/empty-state";
import { api, type LogEntry } from "@/lib/api";

const LIMIT_OPTIONS = [50, 100, 200, 500] as const;
type Limit = (typeof LIMIT_OPTIONS)[number];

export default function LogsPage() {
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<Limit>(100);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [msgTypeFilter, setMsgTypeFilter] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      const { entries } = await api.logs(limit);
      setEntries(entries);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    if (!autoRefresh) return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, autoRefresh]);

  const msgTypes = useMemo(() => {
    const s = new Set<string>();
    (entries ?? []).forEach((e) => {
      if (typeof e.msgType === "string") s.add(e.msgType);
    });
    return Array.from(s).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    if (!msgTypeFilter) return entries ?? [];
    return (entries ?? []).filter((e) => e.msgType === msgTypeFilter);
  }, [entries, msgTypeFilter]);

  return (
    <Page>
      <PageHeader
        title="Audit log"
        description={
          <>
            Every message the bridge processed, tailed from{" "}
            <code className="font-mono text-xs">logs/audit.jsonl</code>. JIDs
            are SHA-256 hashed — phone numbers never appear.
          </>
        }
        actions={
          <>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="accent-[var(--brand)]"
              />
              Auto-refresh
            </label>
            <Button
              onClick={load}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <CardTitle className="text-sm text-muted-foreground">
              {entries === null
                ? "Loading…"
                : filtered.length === entries.length
                ? `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`
                : `${filtered.length} of ${entries.length} entries`}
            </CardTitle>

            <div className="flex flex-wrap items-center gap-3">
              {/* msgType filter */}
              {msgTypes.length > 0 ? (
                <label className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Type</span>
                  <select
                    value={msgTypeFilter}
                    onChange={(e) => setMsgTypeFilter(e.target.value)}
                    className="h-7 px-2 rounded-md border border-input bg-background font-mono"
                  >
                    <option value="">all</option>
                    {msgTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {/* limit */}
              <label className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Limit</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value) as Limit)}
                  className="h-7 px-2 rounded-md border border-input bg-background font-mono"
                >
                  {LIMIT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6">
              <EmptyState
                title="Can't read audit log"
                description={error}
              />
            </div>
          ) : entries === null ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title={
                  msgTypeFilter
                    ? `No ${msgTypeFilter} entries`
                    : "No messages processed yet"
                }
                description={
                  msgTypeFilter
                    ? "Clear the filter or wait for more traffic."
                    : "Send a message to your linked WhatsApp to see it show up here."
                }
                icon={<span className="text-xl">∅</span>}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[160px]">Chat (hash)</TableHead>
                    <TableHead className="w-[180px]">Type</TableHead>
                    <TableHead>Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry, idx) => (
                    <TableRow key={`${entry.ts ?? idx}-${idx}`}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {formatTs(entry.ts)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {typeof entry.jidHash === "string"
                          ? entry.jidHash
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {entry.msgType ? (
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs"
                          >
                            {entry.msgType}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm max-w-[520px] truncate">
                        {typeof entry.preview === "string"
                          ? entry.preview
                          : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </Page>
  );
}

function formatTs(ts: unknown): string {
  if (typeof ts !== "string") return "—";
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return ts;
    // Local short format: "14:32:05 · Apr 21"
    const time = d.toLocaleTimeString(undefined, { hour12: false });
    const date = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    return `${time} · ${date}`;
  } catch {
    return ts;
  }
}
