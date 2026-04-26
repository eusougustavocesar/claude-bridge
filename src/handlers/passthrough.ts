import { state as bridgeState } from "../http/state.js";
import { saveTmpFile, cleanTmpFile } from "../lib/workspace.js";
import { callClaude } from "../lib/claude.js";
import { chunkText, hashJid } from "../lib/utils.js";
import type { MessageContext } from "./types.js";

export async function handlePassthrough(
  ctx: MessageContext,
  ext: string
): Promise<void> {
  const {
    from,
    logger,
    claudeCwd,
    rateLimitAllow,
    rateLimitMax,
    rateLimitWindowMs,
    mediaTmpTtlSeconds,
    audit,
    reply,
    sendPresence,
    downloadMedia,
    caption = "",
  } = ctx;

  if (!rateLimitAllow(from)) {
    await reply(
      `⚠️ Rate limit: max ${rateLimitMax} msgs per ${rateLimitWindowMs / 1000}s. Slow down.`
    );
    return;
  }

  if (!downloadMedia) {
    await reply("⚠️ Este canal não suporta download de mídia.");
    return;
  }

  audit({ fromHash: hashJid(from), msgType: ctx.msgType, caption: caption.slice(0, 100) });
  logger.info({ fromHash: hashJid(from), msgType: ctx.msgType }, "Downloading media");

  let buffer: Buffer;
  try {
    buffer = await downloadMedia();
  } catch (err) {
    logger.error({ err }, "Failed to download media");
    await reply("⚠️ Falha ao baixar o arquivo.");
    return;
  }

  let filename: string;
  try {
    filename = await saveTmpFile(buffer, ext, claudeCwd);
  } catch (err) {
    logger.error({ err }, "Failed to save media to workspace");
    await reply("⚠️ Falha ao salvar o arquivo.");
    return;
  }

  const prompt = caption ? `${caption}\n\ntmp/${filename}` : `tmp/${filename}`;

  await sendPresence?.("composing");
  const answer = await callClaude(prompt, ctx);
  await sendPresence?.("paused");

  for (const chunk of chunkText(answer, 3900)) {
    await reply(chunk);
  }

  bridgeState.processed += 1;

  const ttlMs = (mediaTmpTtlSeconds ?? 60) * 1000;
  setTimeout(() => cleanTmpFile(filename, claudeCwd), ttlMs);
}
