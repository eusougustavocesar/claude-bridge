export type MediaStrategy =
  | { kind: "passthrough"; ext: string }
  | { kind: "transcribe" }
  | { kind: "unsupported" };

/**
 * Maps WhatsApp message types to how reverb should handle them.
 *
 * passthrough  — Claude understands the format natively (images, docs, stickers).
 *               Download → save to workspace → Claude reads via Read tool.
 *
 * transcribe   — Claude cannot process the format directly.
 *               Download → translate to text (Whisper) → Claude.
 *
 * unsupported  — No handler available yet.
 */
export const MEDIA_STRATEGIES: Record<string, MediaStrategy> = {
  imageMessage:    { kind: "passthrough", ext: ".jpg"  },
  documentMessage: { kind: "passthrough", ext: ".pdf"  },
  stickerMessage:  { kind: "passthrough", ext: ".webp" },
  audioMessage:    { kind: "transcribe"                },
  pttMessage:      { kind: "transcribe"                },
  videoMessage:    { kind: "unsupported"               },
};
