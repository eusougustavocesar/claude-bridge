/**
 * Shared runtime state between the Baileys client and the HTTP server.
 * Kept minimal and in-memory. Updated by bot.ts, read by http-server.ts.
 */

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "pairing"
  | "connected";

export interface BridgeState {
  startedAt: number;
  version: string;
  connection: ConnectionState;
  qr: string | null;
  me: { id: string; name: string | null } | null;
  lastError: string | null;
  processed: number;
}

export const state: BridgeState = {
  startedAt: Date.now(),
  version: process.env.npm_package_version ?? "0.1.0",
  connection: "disconnected",
  qr: null,
  me: null,
  lastError: null,
  processed: 0,
};
