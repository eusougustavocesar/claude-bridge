/**
 * Typed client for the reverb HTTP admin API.
 * All requests go to /api/* which is either the same origin (prod,
 * static export served by the daemon) or proxied via next.config.ts (dev).
 */

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "pairing"
  | "connected";

export interface StatusResponse {
  connection: ConnectionState;
  me: { id: string; name: string | null } | null;
  version: string;
  uptimeMs: number;
  processed: number;
  lastError: string | null;
  hasQr: boolean;
}

export interface QrResponse {
  qr: string | null;
}

export interface ConfigResponse {
  values: Record<string, string>;
}

export interface LogEntry {
  ts?: string;
  jidHash?: string;
  msgType?: string;
  preview?: string;
  [key: string]: unknown;
}

export interface LogsResponse {
  entries: LogEntry[];
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export interface ClaudeAuthStatus {
  authenticated: boolean;
  loginRunning: boolean;
  loginUrl: string | null;
  lastError?: string | null;
  probeError?: string | null;
}

export const api = {
  status: () => json<StatusResponse>("/api/status"),
  qr: () => json<QrResponse>("/api/qr"),
  config: () => json<ConfigResponse>("/api/config"),
  saveConfig: (values: Record<string, string>) =>
    json<{ ok: boolean; note?: string }>("/api/config", {
      method: "POST",
      body: JSON.stringify({ values }),
    }),
  logs: (limit = 100) => json<LogsResponse>(`/api/logs?limit=${limit}`),
  stop: () =>
    json<{ ok: boolean; stopping: boolean }>("/api/stop", { method: "POST" }),

  // Claude auth
  claudeAuth: () => json<ClaudeAuthStatus>("/api/claude/auth/status"),
  claudeAuthStart: () =>
    json<{ running: boolean; url: string; startedAt: number }>(
      "/api/claude/auth/start",
      { method: "POST" }
    ),
  claudeAuthCancel: () =>
    json<{ ok: boolean }>("/api/claude/auth/cancel", { method: "POST" }),
};

export function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
