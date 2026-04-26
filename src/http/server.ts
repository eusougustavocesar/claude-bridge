import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import pino from "pino";
import { state, claudeAuth } from "./state.js";
import { readEnvFile, writeEnvFile } from "../lib/env.js";

const logger = pino({ level: "info", name: "http" });

const REPO_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);
const WEB_DIST = join(REPO_ROOT, "web", "out");
const ENV_PATH = join(REPO_ROOT, ".env");
const AUDIT_PATH = join(REPO_ROOT, "logs", "audit.jsonl");

export interface HttpServerOptions {
  host?: string;
  port?: number;
  onStop?: () => void;
  readEnv: () => Record<string, string>;
  writeEnv: (values: Record<string, string>) => void;
  /** Absolute path to the `claude` CLI binary. */
  claudeBin: string;
  /** Working directory to spawn `claude --print` in. */
  claudeCwd: string;
  /** Path to the empty MCP config file to pass to claude subprocesses. */
  claudeMcpConfig: string;
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

  // ----- Claude auth ---------------------------------------------------
  // Subprocess-based login flow: spawn `claude login`, capture the device
  // code URL from stdout, surface it to the UI. User opens URL in browser,
  // completes OAuth, the subprocess writes the token to macOS keychain.

  let loginProc: ChildProcess | null = null;

  function resetAuth() {
    claudeAuth.running = false;
    claudeAuth.url = null;
    claudeAuth.startedAt = null;
    claudeAuth.error = null;
  }

  app.post("/api/claude/auth/start", async (c) => {
    if (loginProc && claudeAuth.running) {
      return c.json(
        {
          error: "login already in progress",
          url: claudeAuth.url,
          startedAt: claudeAuth.startedAt,
        },
        409
      );
    }
    resetAuth();
    claudeAuth.running = true;
    claudeAuth.startedAt = Date.now();

    const child = spawn(opts.claudeBin, ["login"], {
      cwd: opts.claudeCwd,
      env: { ...process.env, BROWSER: "none" },
      stdio: ["pipe", "pipe", "pipe"],
    });
    loginProc = child;

    const urlRe = /(https?:\/\/[^\s"']+)/;
    const onData = (chunk: Buffer) => {
      const s = chunk.toString();
      if (!claudeAuth.url) {
        const m = s.match(urlRe);
        if (m) claudeAuth.url = m[1];
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);

    child.on("error", (err) => {
      logger.error({ err }, "claude login spawn error");
      claudeAuth.running = false;
      claudeAuth.error = err.message;
      loginProc = null;
    });

    child.on("close", (code) => {
      logger.info({ code }, "claude login exited");
      claudeAuth.running = false;
      if (code === 0) {
        claudeAuth.authenticated = true;
        claudeAuth.authenticatedAt = Date.now();
        claudeAuth.error = null;
      } else if (code !== null) {
        claudeAuth.error = `claude login exited with code ${code}`;
      }
      loginProc = null;
    });

    // Auto-kill after 10 minutes if user never completes
    const AUTO_KILL_MS = 10 * 60 * 1000;
    setTimeout(() => {
      if (loginProc === child && claudeAuth.running) {
        logger.warn("claude login timed out after 10min, killing");
        child.kill("SIGTERM");
      }
    }, AUTO_KILL_MS);

    // Give the subprocess up to 4s to emit the URL
    const started = Date.now();
    while (!claudeAuth.url && Date.now() - started < 4000) {
      await new Promise((r) => setTimeout(r, 100));
    }

    if (!claudeAuth.url) {
      return c.json(
        {
          error:
            "no URL captured from claude login output. Your claude CLI may not support headless login.",
          running: claudeAuth.running,
        },
        500
      );
    }

    return c.json({
      running: true,
      url: claudeAuth.url,
      startedAt: claudeAuth.startedAt,
    });
  });

  app.get("/api/claude/auth/status", async (c) => {
    // If a recent probe exists (<10s) and succeeded, return cached
    const now = Date.now();
    const cacheTtl = 10_000;
    const hasFresh =
      claudeAuth.authenticatedAt !== null &&
      now - claudeAuth.authenticatedAt < cacheTtl;

    if (hasFresh && claudeAuth.authenticated && !claudeAuth.running) {
      return c.json({
        authenticated: true,
        loginRunning: false,
        loginUrl: null,
        cachedAt: claudeAuth.authenticatedAt,
      });
    }

    // Probe: spawn claude --print "ok" with tight timeout
    const probe = await probeClaudeAuth(
      opts.claudeBin,
      opts.claudeCwd,
      opts.claudeMcpConfig
    );
    claudeAuth.authenticated = probe.ok;
    claudeAuth.authenticatedAt = now;
    claudeAuth.probeError = probe.ok ? null : probe.error ?? null;

    return c.json({
      authenticated: probe.ok,
      loginRunning: claudeAuth.running,
      loginUrl: claudeAuth.url,
      lastError: claudeAuth.error,
      probeError: claudeAuth.probeError,
    });
  });

  app.post("/api/claude/auth/cancel", (c) => {
    if (loginProc) {
      logger.info("claude login cancelled by user");
      loginProc.kill("SIGTERM");
      loginProc = null;
    }
    resetAuth();
    return c.json({ ok: true });
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
          "reverb HTTP API is running. UI not built — run `npm --workspace web run build` to enable the admin UI.",
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

// ----- Claude auth probe ---------------------------------------------

/**
 * Probes claude CLI auth by invoking `claude --print "ok"` with a tight
 * timeout. Returns `{ ok: true }` if claude answers cleanly, else reports
 * the stderr tail.
 */
function probeClaudeAuth(
  claudeBin: string,
  cwd: string,
  mcpConfig: string
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const child = spawn(
      claudeBin,
      [
        "--print",
        "--mcp-config",
        mcpConfig,
        "--no-session-persistence",
      ],
      {
        cwd,
        env: { ...process.env, CI: "1" },
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), 15_000);

    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ ok: false, error: err.message });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) return resolve({ ok: true });
      const combined = stderr.toLowerCase();
      const notAuthed =
        combined.includes("not logged in") ||
        combined.includes("please run /login") ||
        combined.includes("login");
      resolve({
        ok: false,
        error: notAuthed
          ? "Not logged in — run `claude login` or use the Connect button."
          : stderr.trim().slice(-200) || `exit ${code}`,
      });
    });

    child.stdin.write("ok");
    child.stdin.end();
  });
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

export { readEnvFile, writeEnvFile };
