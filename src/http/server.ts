import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { existsSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve, extname } from "node:path";
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
  // Serve web/out/ (Next.js static export) if present. We roll our own
  // handler instead of Hono's serveStatic because `path.join(root, "/...")`
  // treats the leading slash as absolute and escapes the root.

  if (existsSync(WEB_DIST)) {
    app.get("*", async (c) => {
      const result = resolveStaticFile(c.req.path);
      if (!result) {
        // Try 404.html from Next.js export, else JSON fallback
        const notFoundPath = join(WEB_DIST, "404.html");
        if (existsSync(notFoundPath)) {
          return c.body(await readFile(notFoundPath), 404, {
            "content-type": "text/html; charset=utf-8",
          });
        }
        return c.json({ error: "not found" }, 404);
      }
      const body = await readFile(result.path);
      return c.body(body, 200, {
        "content-type": result.contentType,
        "cache-control": result.immutable
          ? "public, max-age=31536000, immutable"
          : "no-cache",
      });
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

// ----- Static file resolver (for Next.js static export) --------------

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function resolveStaticFile(
  urlPath: string
): { path: string; contentType: string; immutable: boolean } | null {
  // Strip leading slash, query, hash
  const clean = urlPath.replace(/^\/+/, "").split(/[?#]/)[0];

  // Candidates in order:
  // 1. exact file (with extension like js/css/png)
  // 2. <path>/index.html (for route dirs like /pair/)
  // 3. <path>.html (for extensionless routes like /pair)
  const candidates: string[] = [];
  candidates.push(clean === "" ? "index.html" : clean);
  if (!extname(clean)) {
    const base = clean.replace(/\/+$/, "");
    candidates.push(base ? `${base}/index.html` : "index.html");
    candidates.push(base ? `${base}.html` : "index.html");
  }

  for (const c of candidates) {
    const full = join(WEB_DIST, c);
    // Prevent path traversal: final path must stay inside WEB_DIST
    if (!full.startsWith(WEB_DIST)) continue;
    if (!existsSync(full)) continue;
    try {
      const stat = statSync(full);
      if (stat.isDirectory()) continue;
      const ext = extname(full).toLowerCase();
      const ct = MIME[ext] ?? "application/octet-stream";
      // Fingerprinted Next.js assets (in /_next/static/) are safe to cache immutably
      const immutable = full.includes(`${"_next"}/static/`);
      return { path: full, contentType: ct, immutable };
    } catch {
      continue;
    }
  }
  return null;
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
