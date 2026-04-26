import {
  downloadMediaMessage,
  type WAMessage,
  type WASocket,
} from "@whiskeysockets/baileys";

export async function downloadMedia(
  msg: WAMessage,
  sock: WASocket
): Promise<Buffer> {
  const buffer = await downloadMediaMessage(
    msg,
    "buffer",
    {},
    {
      logger: undefined as any,
      reuploadRequest: sock.updateMediaMessage,
    }
  );
  return buffer as Buffer;
}
