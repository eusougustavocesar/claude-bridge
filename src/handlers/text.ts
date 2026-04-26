import { state as bridgeState } from "../http/state.js";
import { callClaude } from "../lib/claude.js";
import { chunkText, hashJid } from "../lib/utils.js";
import type { MessageContext } from "./types.js";

export async function handleText(ctx: MessageContext): Promise<void> {
  const {
    from,
    isSelf,
    logger,
    rateLimitAllow,
    rateLimitMax,
    rateLimitWindowMs,
    audit,
    reply,
    sendPresence,
  } = ctx;

  const text = ctx.text ?? "";
  if (!text) return;

  if (text.trim() === "/stop" && isSelf) {
    await reply(
      "🛑 reverb stopping. To restart: `launchctl kickstart` (macOS), `systemctl --user start reverb` (Linux), or `Start-ScheduledTask -TaskName Reverb` (Windows)."
    );
    logger.warn("Kill switch activated via /stop");
    process.exit(0);
  }

  if (text.trim() === "/help") {
    await reply(
      [
        "reverb commands:",
        "• Any text → sent to Claude Code",
        "• /help → this message",
        "• /stop → shut down the bridge",
        "",
        `Rate limit: ${rateLimitMax} msgs / ${rateLimitWindowMs / 1000}s`,
      ].join("\n")
    );
    return;
  }

  if (text.startsWith("/")) {
    await reply("⚠️ Unknown command. Try /help.");
    return;
  }

  if (!rateLimitAllow(from)) {
    await reply(
      `⚠️ Rate limit: max ${rateLimitMax} msgs per ${rateLimitWindowMs / 1000}s. Slow down.`
    );
    return;
  }

  audit({ fromHash: hashJid(from), msgType: "text", preview: text.slice(0, 100) });
  logger.info({ fromHash: hashJid(from), preview: text.slice(0, 80) }, "Dispatching to Claude");

  await sendPresence?.("composing");
  const answer = await callClaude(text, ctx);
  await sendPresence?.("paused");

  for (const chunk of chunkText(answer, 3900)) {
    await reply(chunk);
  }

  bridgeState.processed += 1;
}
