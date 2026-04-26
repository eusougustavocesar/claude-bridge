import { handleText } from "./text.js";
import { handleAudio } from "./audio.js";
import { handlePassthrough } from "./passthrough.js";
import { MEDIA_STRATEGIES } from "../lib/media-strategies.js";
import type { MessageContext } from "./types.js";

const TEXT_TYPES = new Set(["conversation", "extendedTextMessage"]);

export async function routeMessage(ctx: MessageContext): Promise<void> {
  if (TEXT_TYPES.has(ctx.msgType)) {
    await handleText(ctx);
    return;
  }

  const strategy = MEDIA_STRATEGIES[ctx.msgType];

  if (!strategy) return; // unknown type — silent

  switch (strategy.kind) {
    case "passthrough":
      await handlePassthrough(ctx, strategy.ext);
      return;
    case "transcribe":
      await handleAudio(ctx);
      return;
    case "unsupported":
      await ctx.reply(`⚠️ ${ctx.msgType} not supported yet.`);
      return;
  }
}
