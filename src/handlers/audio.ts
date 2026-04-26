import { downloadMedia } from "../channels/whatsapp/download.js";
import { transcribeAudio } from "../lib/transcribe.js";
import { hashJid } from "../lib/utils.js";
import { handleText } from "./text.js";
import type { MessageContext } from "./types.js";

export async function handleAudio(ctx: MessageContext): Promise<void> {
  const { sock, jid, logger, audit, whisperBin, whisperModel, whisperLanguage, msg } = ctx;

  if (!whisperBin) {
    await sock.sendMessage(jid, {
      text: "⚠️ Áudio recebido, mas Whisper não está configurado. Instale com `pip install openai-whisper` e defina `WHISPER_BIN` no .env.",
    });
    return;
  }

  let buffer: Buffer;
  try {
    buffer = await downloadMedia(msg, sock);
  } catch (err) {
    logger.error({ err }, "Failed to download audio");
    await sock.sendMessage(jid, { text: "⚠️ Falha ao baixar o áudio." });
    return;
  }

  audit({ jidHash: hashJid(jid), msgType: "audio" });
  logger.info({ jidHash: hashJid(jid) }, "Transcribing audio");

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
    await sock.sendMessage(jid, {
      text: "⚠️ Falha na transcrição do áudio.",
    });
    return;
  }

  if (!transcript) {
    await sock.sendMessage(jid, { text: "⚠️ Transcrição vazia." });
    return;
  }

  // Echo the transcript before Claude's response
  await sock.sendMessage(jid, { text: `🎤 _${transcript}_` });

  // Route transcribed text through the normal Claude pipeline
  await handleText({ ...ctx, msgType: "text", text: transcript });
}
