import { Bot, type Context } from "grammy";
import type { Logger } from "pino";
import type { ContextFactory } from "../types.js";
import type { MessageContext } from "../../handlers/types.js";

export interface TelegramConnectOpts {
  token: string;
  allowedIds: string[];
  buildCtx: ContextFactory;
  onMessage: (ctx: MessageContext) => Promise<void>;
  logger: Logger;
}

function telegramMsgType(tgCtx: Context): string {
  const msg = tgCtx.message;
  if (!msg) return "unknown";
  if (msg.text) return "conversation";
  if (msg.voice) return "pttMessage";
  if (msg.audio) return "audioMessage";
  if (msg.photo) return "imageMessage";
  if (msg.document) return "documentMessage";
  if (msg.video) return "videoMessage";
  if (msg.sticker) return "stickerMessage";
  return "unknown";
}

function telegramCaption(tgCtx: Context): string {
  return tgCtx.message?.caption ?? "";
}

function telegramText(tgCtx: Context): string | undefined {
  const msg = tgCtx.message;
  if (!msg) return undefined;
  return msg.text ?? undefined;
}

async function telegramDownloadMedia(
  tgCtx: Context
): Promise<() => Promise<Buffer>> {
  return async () => {
    const msg = tgCtx.message!;
    let fileId: string | undefined;
    if (msg.voice) fileId = msg.voice.file_id;
    else if (msg.audio) fileId = msg.audio.file_id;
    else if (msg.photo) fileId = msg.photo.at(-1)?.file_id;
    else if (msg.document) fileId = msg.document.file_id;
    else if (msg.video) fileId = msg.video.file_id;
    else if (msg.sticker) fileId = msg.sticker.file_id;
    if (!fileId) throw new Error("No downloadable file in message");

    const file = await tgCtx.api.getFile(fileId);
    if (!file.file_path) throw new Error("Telegram returned no file_path");

    const token = (tgCtx.api as any).token as string;
    const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Telegram file download failed: ${res.status}`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  };
}

export async function startTelegram(opts: TelegramConnectOpts): Promise<() => void> {
  const { token, allowedIds, buildCtx, onMessage, logger } = opts;

  const bot = new Bot(token);

  bot.on("message", async (tgCtx) => {
    try {
      const from = String(tgCtx.from?.id ?? tgCtx.message?.chat.id ?? "");
      const isSelf = false; // Telegram bots never receive their own messages via polling

      if (allowedIds.length > 0 && !allowedIds.includes(from)) return;

      const msgType = telegramMsgType(tgCtx);
      const text = telegramText(tgCtx);
      const caption = telegramCaption(tgCtx);
      const isMedia = msgType !== "conversation" && msgType !== "unknown";
      const downloadMediaFn = isMedia ? await telegramDownloadMedia(tgCtx) : undefined;

      const ctx = buildCtx({
        from,
        msgType,
        isSelf,
        reply: (t) => tgCtx.reply(t).then(() => {}),
        downloadMedia: downloadMediaFn,
        caption,
      });

      await onMessage(text !== undefined ? { ...ctx, text } : ctx);
    } catch (err) {
      logger.error({ err }, "Error handling Telegram message");
    }
  });

  bot.catch((err) => logger.error({ err }, "Telegram bot error"));

  logger.info("Starting Telegram bot (long polling)");
  bot.start();

  return () => {
    bot.stop();
    logger.info("Telegram bot stopped");
  };
}
