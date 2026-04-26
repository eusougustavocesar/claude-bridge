import { join } from "node:path";
import { tmpdir } from "node:os";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type WAMessage,
  type WASocket,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import qrPng from "qrcode";
import pino, { type Logger } from "pino";
import { state as bridgeState } from "../../http/state.js";

export interface WhatsAppConnectOpts {
  repoRoot: string;
  httpHost: string;
  httpPort: number;
  onSockReady: (sock: WASocket) => void;
  onMessage: (sock: WASocket, msg: WAMessage) => Promise<void>;
  logger: Logger;
}

export async function startWhatsApp(opts: WhatsAppConnectOpts): Promise<void> {
  const { repoRoot, httpHost, httpPort, onSockReady, onMessage, logger } = opts;

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
      bridgeState.me = {
        id: sock.user?.id ?? "",
        name: sock.user?.name ?? null,
      };
      bridgeState.lastError = null;
      logger.info(
        { me: sock.user?.id, name: sock.user?.name },
        "Connected to WhatsApp"
      );
    }

    if (connection === "connecting") {
      bridgeState.connection = "connecting";
    }

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
        await onMessage(sock, msg);
      } catch (err) {
        logger.error({ err }, "Error handling message");
      }
    }
  });
}
