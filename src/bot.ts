import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import qrcode from "qrcode-terminal";
import qrPng from "qrcode";
import pino from "pino";

import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
  useMultiFileAuthState,
  type WAMessage,
  type WASocket,
} from "@whiskeysockets/baileys";

import { state as bridgeState } from "./http/state.js";
import {
  createHttpServer,
  readEnvFile,
  writeEnvFile,
} from "./http/server.js";

// ============================================================================
// Config (env)
// ============================================================================

const envFromFile = loadEnvFile();

const REPO_ROOT = resolve(import.meta.dirname ?? ".", "..");

const CLAUDE_BIN =
  envFromFile.CLAUDE_BIN ?? process.env.CLAUDE_BIN ?? "claude";
const CLAUDE_CWD = resolve(
  REPO_ROOT,
  envFromFile.CLAUDE_CWD ?? process.env.CLAUDE_CWD ?? "./workspace"
);
const CLAUDE_MCP_CONFIG = resolve(
  REPO_ROOT,
  envFromFile.CLAUDE_MCP_CONFIG ??
    process.env.CLAUDE_MCP_CONFIG ??
    "./empty-mcp.json"
);
const CLAUDE_TIMEOUT_MS =
  (Number(envFromFile.CLAUDE_TIMEOUT_SECONDS) || 180) * 1000;
const SESSION_MODE = (envFromFile.SESSION_MODE ?? "continue").toLowerCase();

const ALLOWED_JIDS = (envFromFile.ALLOWED_JIDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((j) => jidNormalizedUser(j));

const RATE_LIMIT_MAX = Number(envFromFile.RATE_LIMIT_MAX) || 10;
const RATE_LIMIT_WINDOW_MS =
  (Number(envFromFile.RATE_LIMIT_WINDOW_SECONDS) || 60) * 1000;

const HTTP_ENABLED =
  (envFromFile.HTTP_ENABLED ?? "true").toLowerCase() !== "false";
const HTTP_HOST = envFromFile.HTTP_HOST ?? "127.0.0.1";
const HTTP_PORT = Number(envFromFile.HTTP_PORT) || 3737;

const AUDIT_LOG = join(REPO_ROOT, "logs", "audit.jsonl");

const logger = pino({ level: "info" });

// Ensure sandbox exists and is a directory we own
ensureSandbox();

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
    const line = JSON.stringify({ ts: new Date().toISOString(), ...event }) + "\n";
    appendFileSync(AUDIT_LOG, line);
  } catch {
    /* best-effort — never block on audit */
  }
}

function hashJid(jid: string): string {
  return createHash("sha256").update(jid).digest("hex").slice(0, 16);
}

// ============================================================================
// WhatsApp connection
// ============================================================================

async function main() {
  const { state, saveCreds } = await useMultiFileAuthState(
    join(REPO_ROOT, "auth_info")
  );

  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info({ version, isLatest }, "Using WhatsApp Web version");

  const sock: WASocket = makeWASocket({
    auth: state,
    version,
    browser: ["reverb", "Chrome", "1.0.0"],
    logger: pino({ level: "silent" }) as any,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      bridgeState.connection = "pairing";
      bridgeState.qr = qr;
      const pngPath = "/tmp/reverb-qr.png";
      qrPng
        .toFile(pngPath, qr, { scale: 10, margin: 2 })
        .then(() =>
          console.log(
            `\nQR also saved as PNG: ${pngPath}\nOr scan in the browser: http://${HTTP_HOST}:${HTTP_PORT}/pair`
          )
        )
        .catch((err) => console.error("PNG save failed:", err));
      console.log("\nScan this QR with your WhatsApp mobile app:");
      console.log("(WhatsApp > Settings > Linked Devices > Link a Device)\n");
      qrcode.generate(qr);
    }
    if (connection === "open") {
      bridgeState.connection = "connected";
      bridgeState.qr = null;
      bridgeState.me = {
        id: sock.user?.id ?? "",
        name: sock.user?.name ?? null,
      };
      bridgeState.lastError = null;
      logger.info(
        { me: sock.user?.id, name: sock.user?.name },
        "Connected to WhatsApp"
      );
    }
    if (connection === "connecting") {
      bridgeState.connection = "connecting";
    }
    if (connection === "close") {
      bridgeState.connection = "disconnected";
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      bridgeState.lastError = `statusCode ${statusCode}`;
      logger.warn({ statusCode, shouldReconnect }, "Connection closed");
      if (shouldReconnect) {
        setTimeout(main, 3000);
      } else {
        logger.error("Logged out. Delete auth_info/ and re-pair.");
        process.exit(1);
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      try {
        await handleMessage(sock, msg);
      } catch (err) {
        logger.error({ err }, "Error handling message");
      }
    }
  });
}

// ============================================================================
// Message handling
// ============================================================================

async function handleMessage(sock: WASocket, msg: WAMessage) {
  if (!msg.message) return;
  const jid = msg.key.remoteJid;
  if (!jid) return;

  const msgType = Object.keys(msg.message)[0] ?? "unknown";

  // Self-chat detection (WhatsApp uses LID for self messages in recent versions)
  const myJidNorm = sock.user?.id
    ? jidNormalizedUser(sock.user.id)
    : undefined;
  const myLidNorm = (sock.user as any)?.lid
    ? jidNormalizedUser((sock.user as any).lid)
    : undefined;
  const jidNorm = jidNormalizedUser(jid);

  const matchesSelf = jidNorm === myJidNorm || jidNorm === myLidNorm;
  const isAllowed = ALLOWED_JIDS.includes(jidNorm);

  if (!matchesSelf && !isAllowed) return;

  // Extract text
  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    undefined;

  // Notify on unsupported message types
  if (!text) {
    const mediaTypes = [
      "audioMessage",
      "imageMessage",
      "videoMessage",
      "documentMessage",
      "stickerMessage",
    ];
    if (mediaTypes.includes(msgType)) {
      await sock.sendMessage(jid, {
        text: `⚠️ ${msgType} not supported yet. Only text messages for now.`,
      });
    }
    return;
  }

  // Kill switch
  if (text.trim() === "/stop" && matchesSelf) {
    await sock.sendMessage(jid, {
      text: "🛑 reverb stopping. Use `launchctl kickstart` (macOS) or `systemctl restart` (Linux) to bring it back.",
    });
    logger.warn("Kill switch activated via /stop");
    process.exit(0);
  }

  // Help command
  if (text.trim() === "/help") {
    await sock.sendMessage(jid, {
      text: [
        "reverb commands:",
        "• Any text → sent to Claude Code",
        "• /help → this message",
        "• /stop → shut down the bridge",
        "",
        `Rate limit: ${RATE_LIMIT_MAX} msgs / ${RATE_LIMIT_WINDOW_MS / 1000}s`,
      ].join("\n"),
    });
    return;
  }

  // Reject other slash commands (reserved)
  if (text.startsWith("/")) {
    await sock.sendMessage(jid, {
      text: "⚠️ Unknown command. Try /help.",
    });
    return;
  }

  // Rate limit
  if (!rateLimitAllow(jid)) {
    await sock.sendMessage(jid, {
      text: `⚠️ Rate limit: max ${RATE_LIMIT_MAX} msgs per ${RATE_LIMIT_WINDOW_MS / 1000}s. Slow down.`,
    });
    return;
  }

  // Audit (hashed JID — no raw phone numbers stored)
  audit({
    jidHash: hashJid(jid),
    msgType,
    preview: text.slice(0, 100),
  });

  logger.info({ jidHash: hashJid(jid), preview: text.slice(0, 80) }, "Dispatching to Claude");

  await sock.sendPresenceUpdate("composing", jid);
  const answer = await callClaude(text);
  await sock.sendPresenceUpdate("paused", jid);

  // Chunk long responses to fit WhatsApp's ~4096 char limit
  for (const chunk of chunkText(answer, 3900)) {
    await sock.sendMessage(jid, { text: chunk });
  }

  bridgeState.processed += 1;
}

function chunkText(text: string, size: number): string[] {
  if (text.length <= size) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > size) {
    // Try to split at paragraph / sentence boundary near `size`
    let cut = remaining.lastIndexOf("\n\n", size);
    if (cut < size * 0.5) cut = remaining.lastIndexOf("\n", size);
    if (cut < size * 0.5) cut = remaining.lastIndexOf(". ", size);
    if (cut < size * 0.5) cut = size;
    chunks.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

// ============================================================================
// Claude subprocess
// ============================================================================

function callClaude(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    // --mcp-config pointing to an empty server map disables MCP startup,
    // which hangs under LaunchAgent (no TTY). OAuth / keychain auth still
    // works (that requires NOT using --bare).
    const args: string[] = [
      "--print",
      "--mcp-config",
      CLAUDE_MCP_CONFIG,
      "--no-session-persistence",
    ];
    if (SESSION_MODE === "continue") args.push("--continue");

    const child = spawn(CLAUDE_BIN, args, {
      cwd: CLAUDE_CWD,
      env: { ...process.env, CI: "1" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), CLAUDE_TIMEOUT_MS);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      clearTimeout(timer);
      logger.error({ err }, "spawn error");
      resolve(`⚠️ Error invoking Claude: ${err.message}`);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(stdout.trim() || "(empty response)");
      } else {
        logger.warn({ code, stderr }, "claude exited non-zero");
        const tail = (stderr || stdout).trim().slice(-1500);
        resolve(`⚠️ Claude exited with code ${code}.\n${tail}`);
      }
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

// ============================================================================
// Sandbox setup
// ============================================================================

function ensureSandbox() {
  try {
    mkdirSync(CLAUDE_CWD, { recursive: true });
    const claudeMd = join(CLAUDE_CWD, "CLAUDE.md");
    if (!existsSync(claudeMd)) {
      const content = [
        "# reverb sandbox",
        "",
        "This directory is the sandbox for the reverb daemon.",
        "Claude Code has read/write access ONLY to files inside this directory.",
        "It cannot access files outside of it unless `CLAUDE_CWD` is reconfigured.",
        "",
        "Use this space for temporary artifacts, notes, or files you want Claude",
        "to work with via WhatsApp.",
        "",
      ].join("\n");
      writeFileSync(claudeMd, content);
    }
  } catch (err) {
    logger.warn({ err, cwd: CLAUDE_CWD }, "Could not initialize sandbox");
  }
}

// ============================================================================
// Minimal .env loader (no dotenv dep)
// ============================================================================

function loadEnvFile(): Record<string, string> {
  const path = join(import.meta.dirname ?? ".", "..", ".env");
  if (!existsSync(path)) return {};
  try {
    const text = readFileSync(path, "utf8");
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
  } catch {
    return {};
  }
}

// ============================================================================
// Entrypoint
// ============================================================================

// ============================================================================
// Entrypoint
// ============================================================================

// Start HTTP admin server (optional)
let httpServerInstance: { close: () => void } | null = null;
if (HTTP_ENABLED) {
  httpServerInstance = createHttpServer({
    host: HTTP_HOST,
    port: HTTP_PORT,
    readEnv: readEnvFile,
    writeEnv: writeEnvFile,
    onStop: () => logger.warn("stop requested via HTTP"),
    claudeBin: CLAUDE_BIN,
    claudeCwd: CLAUDE_CWD,
    claudeMcpConfig: CLAUDE_MCP_CONFIG,
  });
}

main().catch((err) => {
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
