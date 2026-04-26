import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@whiskeysockets/baileys", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@whiskeysockets/baileys")>();
  return { ...actual, downloadMediaMessage: vi.fn() };
});

import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { downloadMedia } from "../channels/whatsapp/download.js";

const mockMsg = {
  key: { id: "msg-1", remoteJid: "5500000000000@s.whatsapp.net" },
  message: { audioMessage: {} },
};

const mockSock = {
  updateMediaMessage: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(downloadMediaMessage).mockResolvedValue(Buffer.from("media data") as any);
});

describe("downloadMedia", () => {
  it("passes the message as first argument to downloadMediaMessage", async () => {
    await downloadMedia(mockMsg as any, mockSock as any);
    const [msg] = vi.mocked(downloadMediaMessage).mock.calls[0];
    expect(msg).toBe(mockMsg);
  });

  it("requests buffer mode", async () => {
    await downloadMedia(mockMsg as any, mockSock as any);
    const [, type] = vi.mocked(downloadMediaMessage).mock.calls[0];
    expect(type).toBe("buffer");
  });

  it("passes sock.updateMediaMessage as reuploadRequest", async () => {
    await downloadMedia(mockMsg as any, mockSock as any);
    const [, , , opts] = vi.mocked(downloadMediaMessage).mock.calls[0];
    expect((opts as any).reuploadRequest).toBe(mockSock.updateMediaMessage);
  });

  it("returns the buffer from downloadMediaMessage", async () => {
    const expected = Buffer.from([1, 2, 3, 4]);
    vi.mocked(downloadMediaMessage).mockResolvedValue(expected as any);
    const result = await downloadMedia(mockMsg as any, mockSock as any);
    expect(result).toEqual(expected);
  });

  it("throws when downloadMediaMessage rejects", async () => {
    vi.mocked(downloadMediaMessage).mockRejectedValue(new Error("media expired"));
    await expect(downloadMedia(mockMsg as any, mockSock as any)).rejects.toThrow("media expired");
  });
});
