import type { MessageContext } from "../handlers/types.js";

export type ContextFactory = (opts: {
  from: string;
  msgType: string;
  isSelf: boolean;
  reply: (text: string) => Promise<void>;
  sendPresence?: (status: "composing" | "paused") => Promise<void>;
  downloadMedia?: () => Promise<Buffer>;
  caption?: string;
}) => MessageContext;
