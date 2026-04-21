import { Hono } from "hono";
import { serveStatic } from "hono/serve-static";
import { serve } from "@hono/node-server";
import { existsSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import pino from "pino";
import { state } from "./state.js";

const logger = pino({ level: "info", name: "http" });

const REPO_ROOT = resolve(import.meta.dirname ?? ".", "..", "..");
const WEB_DIST = join(REPO_ROOT, "web", "out");
const ENV_PATH = join(REPO_ROOT, ".env");
const AUDIT_PATH = join(REPO_ROOT, "logs", "audit.jsonl");

export interface HttpServerOptions {
  host?: string;
  port?: number;
  onStop?: () => void;
  readEnv: () => Record<string, string>;
  writeEnv: (values: Record<string, string>) => void;
}

export function createHttpServer(opts: HttpServerOptions) {
  const host = opts.host ?? "127.0.0.1";
  const port = opts.port ?? 3737;
  const app = new Hono();

  // ----- API routes ------------------------------------------------------

  app.get("/api/healthz", (c) => c.json({ ok: true }));

  app.get("/api/status", (c) => {
    return c.json({
      connection: state.connection,
      me: state.me,
      version: state.version,
      uptimeMs: Date.now() - state.startedAt,
      processed: state.processed,
      lastError: state.lastError,
      hasQr: state.qr !== null,
    });
  });

  app.get("/api/qr", (c) => {
    return c.json({ qr: state.qr });
  });

  app.get("/api/config", (c) => {
    try {
      const values = opts.readEnv();
      // Never expose .env values that look like secrets
      const redactedKeys = new Set(["AUTH_TOKEN", "API_KEY", "SECRET"]);
      const safe: Record<string, string> = {};
      for (const [k, v] of Object.entries(values)) {
        safe[k] = redactedKeys.has(k) ? "***" : v;
      }
      return c.json({ values: safe });
    } catch (err) {
      logger.error({ err }, "failed to read env");
      return c.json({ error: "failed to read .env" }, 500);
    }
  });

  app.post("/api/config", async (c) => {
    const body = (await c.req.json()) as { values: Record<string, string> };
    if (!body?.values || typeof body.values !== "object") {
      return c.json({ error: "invalid body" }, 400);
    }
    try {
      opts.writeEnv(body.values);
      return c.json({ ok: true, note: "restart the daemon to apply changes" });
    } catch (err) {
      logger.error({ err }, "failed to write env");
      return c.json({ error: "failed to write .env" }, 500);
    }
  });

  app.get("/api/logs", (c) => {
    const limit = Math.min(Number(c.req.query("limit") ?? 100), 500);
    if (!existsSync(AUDIT_PATH)) {
      return c.json({ entries: [] });
    }
    try {
      const text = readFileSync(AUDIT_PATH, "utf8");
      const lines = text
        .split("\n")
        .filter(Boolean)
        .slice(-limit)
        .reverse()
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return { raw: line };
          }
        });
      return c.json({ entries: lines });
    } catch (err) {
      logger.error({ err }, "failed to read audit log");
      return c.json({ entries: [], error: "read failed" }, 500);
    }
  });

  app.post("/api/stop", (c) => {
    logger.warn("stop requested via HTTP API");
    setTimeout(() => {
      opts.onStop?.();
      process.exit(0);
    }, 100);
    return c.json({ ok: true, stopping: true });
  });

  // ----- Static web UI --------------------------------------------------
  // Serve web/out/ (Next.js static export) if present. Fallback to a
  // friendly JSON when the UI hasn't been built yet.

  if (existsSync(WEB_DIST)) {
    app.use(
      "/*",
      serveStatic({
        root: WEB_DIST,
        getContent: async (path) => {
          const full = join(WEB_DIST, path);
          if (!existsSync(full)) return null;
          try {
            if (statSync(full).isDirectory()) {
              const indexPath = join(full, "index.html");
              if (existsSync(indexPath)) return await readFile(indexPath);
              return null;
            }
            return await readFile(full);
          } catch {
            return null;
          }
        },
      })
    );

    // Fallback for client-side routes (SPA-style)
    app.get("*", async (c) => {
      const indexPath = join(WEB_DIST, "index.html");
      if (existsSync(indexPath)) {
        return c.body(await readFile(indexPath), 200, {
          "content-type": "text/html; charset=utf-8",
        });
      }
      return c.json({ message: "UI not built" }, 404);
    });
  } else {
    app.get("/", (c) =>
      c.json({
        message:
          "claude-bridge HTTP API is running. UI not built — run `npm --workspace web run build` to enable the admin UI.",
        endpoints: [
          "/api/healthz",
          "/api/status",
          "/api/qr",
          "/api/config",
          "/api/logs",
          "/api/stop",
        ],
      })
    );
  }

  // ----- Lifecycle -------------------------------------------------------

  const server = serve({ fetch: app.fetch, hostname: host, port });
  logger.info(
    { host, port, ui: existsSync(WEB_DIST) ? "enabled" : "not-built" },
    "HTTP server listening"
  );

  return {
    close: () => {
      server.close();
      logger.info("HTTP server closed");
    },
  };
}

// ----- Minimal .env read/write helpers (shared with bot.ts) -----------

export function readEnvFile(): Record<string, string> {
  if (!existsSync(ENV_PATH)) return {};
  const text = readFileSync(ENV_PATH, "utf8");
  const result: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

export function writeEnvFile(values: Record<string, string>): void {
  // Preserve structure: read existing .env, replace known keys, keep comments
  let text = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
  const seen = new Set<string>();

  const lines = text.split(/\r?\n/).map((raw) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) return raw;
    const eq = trimmed.indexOf("=");
    if (eq < 0) return raw;
    const key = trimmed.slice(0, eq).trim();
    if (key in values) {
      seen.add(key);
      return `${key}=${values[key]}`;
    }
    return raw;
  });

  // Append any keys not seen in the original file
  for (const [k, v] of Object.entries(values)) {
    if (!seen.has(k)) lines.push(`${k}=${v}`);
  }

  writeFileSync(ENV_PATH, lines.join("\n"));
}
