import { join } from "node:path";
import { tmpdir } from "node:os";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
  useMultiFileAuthState,
  type WAMessage,
  type WASocket,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import qrPng from "qrcode";
import pino, { type Logger } from "pino";
import { state as bridgeState } from "../../http/state.js";
import { downloadMedia } from "./download.js";
import type { ContextFactory } from "../types.js";
import type { MessageContext } from "../../handlers/types.js";

export interface WhatsAppConnectOpts {
  repoRoot: string;
  httpHost: string;
  httpPort: number;
  allowedJids: string[];
  onSockReady: (sock: WASocket) => void;
  onMessage: (ctx: MessageContext) => Promise<void>;
  buildCtx: ContextFactory;
  logger: Logger;
}

function extractText(msg: WAMessage): string | undefined {
  const m = msg.message;
  if (!m) return undefined;
  return m.conversation ?? m.extendedTextMessage?.text ?? undefined;
}

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

export async function startWhatsApp(opts: WhatsAppConnectOpts): Promise<void> {
  const {
    repoRoot,
    httpHost,
    httpPort,
    allowedJids,
    onSockReady,
    onMessage,
    buildCtx,
    logger,
  } = opts;

  const { state, saveCreds } = await useMultiFileAuthState(
    join(repoRoot, "auth_info")
  );
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info({ version, isLatest }, "Using WhatsApp Web version");

  const sock: WASocket = makeWASocket({
    auth: state,
    version,
    browser: ["reverb", "Chrome", "1.0.0"],
    logger: pino({ level: "silent" }) as any,
  });

  onSockReady(sock);
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      bridgeState.connection = "pairing";
      bridgeState.qr = qr;
      const pngPath = join(tmpdir(), "reverb-qr.png");
      qrPng
        .toFile(pngPath, qr, { scale: 10, margin: 2 })
        .then(() =>
          console.log(
            `\nQR saved as PNG: ${pngPath}\nScan in browser: http://${httpHost}:${httpPort}/pair`
          )
        )
        .catch((err) => console.error("PNG save failed:", err));
      console.log("\nScan this QR with your WhatsApp mobile app:");
      console.log("(WhatsApp > Settings > Linked Devices > Link a Device)\n");
      qrcode.generate(qr);
    }

    if (connection === "open") {
      bridgeState.connection = "connected";
      bridgeState.qr = null;
      bridgeState.me = { id: sock.user?.id ?? "", name: sock.user?.name ?? null };
      bridgeState.lastError = null;
      logger.info({ me: sock.user?.id, name: sock.user?.name }, "Connected to WhatsApp");
    }

    if (connection === "connecting") bridgeState.connection = "connecting";

    if (connection === "close") {
      bridgeState.connection = "disconnected";
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      bridgeState.lastError = `statusCode ${statusCode}`;
      logger.warn({ statusCode, shouldReconnect }, "Connection closed");
      if (shouldReconnect) {
        setTimeout(() => startWhatsApp(opts), 3000);
      } else {
        logger.error("Logged out. Delete auth_info/ and re-pair.");
        process.exit(1);
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      try {
        if (!msg.message) continue;
        const jid = msg.key.remoteJid;
        if (!jid) continue;

        const myJidNorm = sock.user?.id ? jidNormalizedUser(sock.user.id) : undefined;
        const myLidNorm = (sock.user as any)?.lid
          ? jidNormalizedUser((sock.user as any).lid)
          : undefined;
        const jidNorm = jidNormalizedUser(jid);

        const isSelf = jidNorm === myJidNorm || jidNorm === myLidNorm;
        if (!isSelf && !allowedJids.includes(jidNorm)) continue;

        const msgType = Object.keys(msg.message)[0] ?? "unknown";
        const text = extractText(msg);
        const caption = extractCaption(msg);

        const ctx = buildCtx({
          from: jid,
          msgType,
          isSelf,
          reply: (t) => sock.sendMessage(jid, { text: t }).then(() => {}),
          sendPresence: (status) => sock.sendPresenceUpdate(status, jid),
          downloadMedia: () => downloadMedia(msg, sock),
          caption,
        });

        // Inject text for text-type messages
        await onMessage(text !== undefined ? { ...ctx, text } : ctx);
      } catch (err) {
        logger.error({ err }, "Error handling WhatsApp message");
      }
    }
  });
}
