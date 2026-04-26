import { state as bridgeState } from "../http/state.js";
import { callClaude } from "../lib/claude.js";
import { chunkText, hashJid } from "../lib/utils.js";
import type { MessageContext } from "./types.js";

export async function handleText(ctx: MessageContext): Promise<void> {
  const {
    msg,
    sock,
    jid,
    isSelf,
    logger,
    rateLimitAllow,
    rateLimitMax,
    rateLimitWindowMs,
    audit,
  } = ctx;

  const text =
    ctx.text ??
    msg.message?.conversation ??
    msg.message?.extendedTextMessage?.text ??
    "";

  if (!text) return;

  // Kill switch
  if (text.trim() === "/stop" && isSelf) {
    await sock.sendMessage(jid, {
      text: "🛑 reverb stopping. To restart: `launchctl kickstart` (macOS), `systemctl --user start reverb` (Linux), or `Start-ScheduledTask -TaskName Reverb` (Windows).",
    });
    logger.warn("Kill switch activated via /stop");
    process.exit(0);
  }

  // Help
  if (text.trim() === "/help") {
    await sock.sendMessage(jid, {
      text: [
        "reverb commands:",
        "• Any text → sent to Claude Code",
        "• /help → this message",
        "• /stop → shut down the bridge",
        "",
        `Rate limit: ${rateLimitMax} msgs / ${rateLimitWindowMs / 1000}s`,
      ].join("\n"),
    });
    return;
  }

  // Reserved slash commands
  if (text.startsWith("/")) {
    await sock.sendMessage(jid, { text: "⚠️ Unknown command. Try /help." });
    return;
  }

  // Rate limit
  if (!rateLimitAllow(jid)) {
    await sock.sendMessage(jid, {
      text: `⚠️ Rate limit: max ${rateLimitMax} msgs per ${rateLimitWindowMs / 1000}s. Slow down.`,
    });
    return;
  }

  audit({ jidHash: hashJid(jid), msgType: "text", preview: text.slice(0, 100) });
  logger.info({ jidHash: hashJid(jid), preview: text.slice(0, 80) }, "Dispatching to Claude");

  await sock.sendPresenceUpdate("composing", jid);
  const answer = await callClaude(text, ctx);
  await sock.sendPresenceUpdate("paused", jid);

  for (const chunk of chunkText(answer, 3900)) {
    await sock.sendMessage(jid, { text: chunk });
  }

  bridgeState.processed += 1;
}
