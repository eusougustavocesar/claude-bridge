import type { Logger } from "pino";
import type { ClaudeOpts } from "../lib/claude.js";

export interface MessageContext extends ClaudeOpts {
  from: string;
  msgType: string;
  isSelf: boolean;
  /** Send a message back to the originating chat. */
  reply: (text: string) => Promise<void>;
  /** Signal typing/paused presence — optional, channel may not support it. */
  sendPresence?: (status: "composing" | "paused") => Promise<void>;
  /** Lazily fetch the media buffer — populated by the channel adapter. */
  downloadMedia?: () => Promise<Buffer>;
  /** Caption attached to a media message, if any. */
  caption?: string;
  rateLimitAllow: (id: string) => boolean;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  audit: (event: Record<string, unknown>) => void;
  logger: Logger;
  // Set by audio handler after transcription to override inbound text
  text?: string;
  // Audio
  whisperBin?: string;
  whisperModel?: string;
  whisperLanguage?: string;
  // Media
  mediaTmpTtlSeconds?: number;
}
