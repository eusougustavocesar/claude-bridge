import type { WAMessage, WASocket } from "@whiskeysockets/baileys";
import type { Logger } from "pino";
import type { ClaudeOpts } from "../lib/claude.js";

export interface MessageContext extends ClaudeOpts {
  msg: WAMessage;
  sock: WASocket;
  jid: string;
  msgType: string;
  isSelf: boolean;
  rateLimitAllow: (jid: string) => boolean;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  audit: (event: Record<string, unknown>) => void;
  logger: Logger;
  // Set by audio handler after transcription to override msg text
  text?: string;
  // Audio
  whisperBin?: string;
  whisperModel?: string;
  whisperLanguage?: string;
  // Image
  mediaTmpTtlSeconds?: number;
}
