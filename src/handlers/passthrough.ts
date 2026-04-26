import type { WAMessage } from "@whiskeysockets/baileys";
import { state as bridgeState } from "../http/state.js";
import { downloadMedia } from "../channels/whatsapp/download.js";
import { saveTmpFile, cleanTmpFile } from "../lib/workspace.js";
import { callClaude } from "../lib/claude.js";
import { chunkText, hashJid } from "../lib/utils.js";
import type { MessageContext } from "./types.js";

function extractCaption(msg: WAMessage): string {
  const m = msg.message;
  if (!m) return "";
  return (
    m.imageMessage?.caption ??
    m.documentMessage?.caption ??
    m.videoMessage?.caption ??
    ""
  );
}

/**
 * Handles any media format Claude understands natively (images, PDFs, stickers).
 * Downloads the file, saves it to the Claude sandbox, then explicitly instructs
 * Claude to use its Read tool — no format translation needed.
 */
export async function handlePassthrough(
  ctx: MessageContext,
  ext: string
): Promise<void> {
  const {
    msg,
    sock,
    jid,
    logger,
    claudeCwd,
    rateLimitAllow,
    rateLimitMax,
    rateLimitWindowMs,
    mediaTmpTtlSeconds,
    audit,
  } = ctx;

  const caption = extractCaption(msg);

  if (!rateLimitAllow(jid)) {
    await sock.sendMessage(jid, {
      text: `⚠️ Rate limit: max ${rateLimitMax} msgs per ${rateLimitWindowMs / 1000}s. Slow down.`,
    });
    return;
  }

  audit({ jidHash: hashJid(jid), msgType: ctx.msgType, caption: caption.slice(0, 100) });
  logger.info({ jidHash: hashJid(jid), msgType: ctx.msgType }, "Downloading media");

  let buffer: Buffer;
  try {
    buffer = await downloadMedia(msg, sock);
  } catch (err) {
    logger.error({ err }, "Failed to download media");
    await sock.sendMessage(jid, { text: "⚠️ Falha ao baixar o arquivo." });
    return;
  }

  let filename: string;
  try {
    filename = await saveTmpFile(buffer, ext, claudeCwd);
  } catch (err) {
    logger.error({ err }, "Failed to save media to workspace");
    await sock.sendMessage(jid, { text: "⚠️ Falha ao salvar o arquivo." });
    return;
  }

  const prompt = caption
    ? `${caption}\n\ntmp/${filename}`
    : `tmp/${filename}`;

  await sock.sendPresenceUpdate("composing", jid);
  const answer = await callClaude(prompt, ctx);
  await sock.sendPresenceUpdate("paused", jid);

  for (const chunk of chunkText(answer, 3900)) {
    await sock.sendMessage(jid, { text: chunk });
  }

  bridgeState.processed += 1;

  const ttlMs = (mediaTmpTtlSeconds ?? 60) * 1000;
  setTimeout(() => cleanTmpFile(filename, claudeCwd), ttlMs);
}
