import { transcribeAudio } from "../lib/transcribe.js";
import { hashJid } from "../lib/utils.js";
import { handleText } from "./text.js";
import type { MessageContext } from "./types.js";

export async function handleAudio(ctx: MessageContext): Promise<void> {
  const { from, logger, audit, whisperBin, whisperModel, whisperLanguage, reply, downloadMedia } = ctx;

  if (!whisperBin) {
    await reply(
      "⚠️ Áudio recebido, mas Whisper não está configurado. Instale com `pip install openai-whisper` e defina `WHISPER_BIN` no .env."
    );
    return;
  }

  if (!downloadMedia) {
    await reply("⚠️ Este canal não suporta download de mídia.");
    return;
  }

  let buffer: Buffer;
  try {
    buffer = await downloadMedia();
  } catch (err) {
    logger.error({ err }, "Failed to download audio");
    await reply("⚠️ Falha ao baixar o áudio.");
    return;
  }

  audit({ fromHash: hashJid(from), msgType: "audio" });
  logger.info({ fromHash: hashJid(from) }, "Transcribing audio");

  let transcript: string;
  try {
    transcript = await transcribeAudio(buffer, {
      whisperBin,
      model: whisperModel ?? "base",
      language: whisperLanguage,
      logger,
    });
  } catch (err) {
    logger.error({ err }, "Transcription failed");
    await reply("⚠️ Falha na transcrição do áudio.");
    return;
  }

  if (!transcript) {
    await reply("⚠️ Transcrição vazia.");
    return;
  }

  await reply(`🎤 _${transcript}_`);
  await handleText({ ...ctx, msgType: "text", text: transcript });
}
