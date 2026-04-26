import {
  existsSync,
  writeFileSync,
  appendFileSync,
  mkdirSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { jidNormalizedUser, type WAMessage, type WASocket } from "@whiskeysockets/baileys";
import pino from "pino";

import { createHttpServer } from "./http/server.js";
import { readEnvFile, writeEnvFile } from "./lib/env.js";
import { hashJid } from "./lib/utils.js";
import { startWhatsApp } from "./channels/whatsapp/connect.js";
import { routeMessage } from "./handlers/index.js";

// ============================================================================
// Config (env)
// ============================================================================

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = join(REPO_ROOT, ".env");

const env = readEnvFile(ENV_PATH);

const CLAUDE_BIN = env.CLAUDE_BIN ?? process.env.CLAUDE_BIN ?? "claude";
const CLAUDE_CWD = resolve(REPO_ROOT, env.CLAUDE_CWD ?? "./workspace");
const CLAUDE_MCP_CONFIG = resolve(
  REPO_ROOT,
  env.CLAUDE_MCP_CONFIG ?? "./empty-mcp.json"
);
const CLAUDE_TIMEOUT_MS = (Number(env.CLAUDE_TIMEOUT_SECONDS) || 180) * 1000;
const SESSION_MODE = (env.SESSION_MODE ?? "continue").toLowerCase();

const ALLOWED_JIDS = (env.ALLOWED_JIDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((j) => jidNormalizedUser(j));

const RATE_LIMIT_MAX = Number(env.RATE_LIMIT_MAX) || 10;
const RATE_LIMIT_WINDOW_MS =
  (Number(env.RATE_LIMIT_WINDOW_SECONDS) || 60) * 1000;

const HTTP_ENABLED =
  (env.HTTP_ENABLED ?? "true").toLowerCase() !== "false";
const HTTP_HOST = env.HTTP_HOST ?? "127.0.0.1";
const HTTP_PORT = Number(env.HTTP_PORT) || 3737;

const AUDIO_ENABLED = (env.AUDIO_ENABLED ?? "false").toLowerCase() === "true";
const WHISPER_BIN = env.WHISPER_BIN ?? "whisper";
const WHISPER_MODEL = env.WHISPER_MODEL ?? "base";
const WHISPER_LANGUAGE = env.WHISPER_LANGUAGE ?? undefined;

const IMAGE_ENABLED = (env.IMAGE_ENABLED ?? "false").toLowerCase() === "true";
const MEDIA_TMP_TTL_SECONDS = Number(env.MEDIA_TMP_TTL_SECONDS) || 60;

const AUDIT_LOG = join(REPO_ROOT, "logs", "audit.jsonl");
const logger = pino({ level: "info" });

// ============================================================================
// Rate limiter (in-memory, per-chat)
// ============================================================================

const rateLimitState = new Map<string, number[]>();

function rateLimitAllow(jid: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitState.get(jid) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitState.set(jid, timestamps);
    return false;
  }
  timestamps.push(now);
  rateLimitState.set(jid, timestamps);
  return true;
}

// ============================================================================
// Audit log
// ============================================================================

function audit(event: Record<string, unknown>) {
  try {
    mkdirSync(dirname(AUDIT_LOG), { recursive: true });
    appendFileSync(
      AUDIT_LOG,
      JSON.stringify({ ts: new Date().toISOString(), ...event }) + "\n"
    );
  } catch {
    /* best-effort — never block on audit */
  }
}

// ============================================================================
// Sandbox setup
// ============================================================================

function ensureSandbox() {
  try {
    mkdirSync(CLAUDE_CWD, { recursive: true });
    const claudeMd = join(CLAUDE_CWD, "CLAUDE.md");
    if (!existsSync(claudeMd)) {
      writeFileSync(
        claudeMd,
        [
          "# reverb sandbox",
          "",
          "This directory is the sandbox for the reverb daemon.",
          "Claude Code has read/write access ONLY to files inside this directory.",
          "It cannot access files outside of it unless `CLAUDE_CWD` is reconfigured.",
          "",
          "Use this space for temporary artifacts, notes, or files you want Claude",
          "to work with via WhatsApp.",
          "",
        ].join("\n")
      );
    }
  } catch (err) {
    logger.warn({ err, cwd: CLAUDE_CWD }, "Could not initialize sandbox");
  }
}

ensureSandbox();

// ============================================================================
// Message dispatcher
// ============================================================================

async function handleMessage(sock: WASocket, msg: WAMessage): Promise<void> {
  if (!msg.message) return;
  const jid = msg.key.remoteJid;
  if (!jid) return;

  const msgType = Object.keys(msg.message)[0] ?? "unknown";

  const myJidNorm = sock.user?.id
    ? jidNormalizedUser(sock.user.id)
    : undefined;
  const myLidNorm = (sock.user as any)?.lid
    ? jidNormalizedUser((sock.user as any).lid)
    : undefined;
  const jidNorm = jidNormalizedUser(jid);

  const isSelf = jidNorm === myJidNorm || jidNorm === myLidNorm;
  const isAllowed = ALLOWED_JIDS.includes(jidNorm);

  if (!isSelf && !isAllowed) return;

  await routeMessage({
    msg,
    sock,
    jid,
    msgType,
    isSelf,
    claudeBin: CLAUDE_BIN,
    claudeCwd: CLAUDE_CWD,
    claudeMcpConfig: CLAUDE_MCP_CONFIG,
    claudeTimeoutMs: CLAUDE_TIMEOUT_MS,
    sessionMode: SESSION_MODE,
    rateLimitAllow,
    rateLimitMax: RATE_LIMIT_MAX,
    rateLimitWindowMs: RATE_LIMIT_WINDOW_MS,
    audit,
    logger,
    whisperBin: AUDIO_ENABLED ? WHISPER_BIN : undefined,
    whisperModel: WHISPER_MODEL,
    whisperLanguage: WHISPER_LANGUAGE,
    mediaTmpTtlSeconds: MEDIA_TMP_TTL_SECONDS,
  });
}

// ============================================================================
// Entrypoint
// ============================================================================

let currentSock: WASocket | null = null;

let httpServerInstance: { close: () => void } | null = null;
if (HTTP_ENABLED) {
  httpServerInstance = createHttpServer({
    host: HTTP_HOST,
    port: HTTP_PORT,
    readEnv: () => readEnvFile(ENV_PATH),
    writeEnv: (values) => writeEnvFile(ENV_PATH, values),
    getSock: () => currentSock,
    onStop: () => logger.warn("stop requested via HTTP"),
    claudeBin: CLAUDE_BIN,
    claudeCwd: CLAUDE_CWD,
    claudeMcpConfig: CLAUDE_MCP_CONFIG,
  });
}

startWhatsApp({
  repoRoot: REPO_ROOT,
  httpHost: HTTP_HOST,
  httpPort: HTTP_PORT,
  onSockReady: (sock) => {
    currentSock = sock;
  },
  onMessage: handleMessage,
  logger,
}).catch((err) => {
  logger.error({ err }, "Fatal error");
  process.exit(1);
});

const gracefulShutdown = (signal: string) => {
  logger.info({ signal }, "signal received, shutting down");
  httpServerInstance?.close();
  process.exit(0);
};
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
