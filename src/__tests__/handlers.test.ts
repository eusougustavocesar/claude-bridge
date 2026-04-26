import { describe, it, expect, vi, beforeEach } from "vitest";
import pino from "pino";
import type { MessageContext } from "../handlers/types.js";

// ── Mocks (hoisted) ──────────────────────────────────────────────────────────

vi.mock("../lib/transcribe.js", () => ({
  transcribeAudio: vi.fn(),
}));
vi.mock("../lib/workspace.js", () => ({
  saveTmpFile: vi.fn(),
  cleanTmpFile: vi.fn(),
}));
vi.mock("../lib/claude.js", () => ({
  callClaude: vi.fn(),
}));
vi.mock("../http/state.js", () => ({
  state: { processed: 0 },
}));

import { handleAudio } from "../handlers/audio.js";
import { handlePassthrough } from "../handlers/passthrough.js";
import { routeMessage } from "../handlers/index.js";
import { transcribeAudio } from "../lib/transcribe.js";
import { saveTmpFile, cleanTmpFile } from "../lib/workspace.js";
import { callClaude } from "../lib/claude.js";
import { state as bridgeState } from "../http/state.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

const logger = pino({ level: "silent" });
const TEST_JID = "5500000000000@s.whatsapp.net";

function makeCtx(overrides: Partial<MessageContext> = {}): MessageContext {
  return {
    from: TEST_JID,
    msgType: "audioMessage",
    isSelf: true,
    reply: vi.fn().mockResolvedValue(undefined),
    sendPresence: vi.fn().mockResolvedValue(undefined),
    downloadMedia: vi.fn().mockResolvedValue(Buffer.from("media")),
    caption: "",
    claudeBin: "claude",
    claudeCwd: "/tmp/test-cwd",
    claudeMcpConfig: "/tmp/empty-mcp.json",
    claudeTimeoutMs: 30_000,
    sessionMode: "continue",
    rateLimitAllow: vi.fn().mockReturnValue(true),
    rateLimitMax: 10,
    rateLimitWindowMs: 60_000,
    audit: vi.fn(),
    logger,
    whisperBin: "whisper",
    whisperModel: "base",
    whisperLanguage: "pt",
    mediaTmpTtlSeconds: 60,
    ...overrides,
  };
}

function sentTexts(ctx: MessageContext): string[] {
  return (ctx.reply as ReturnType<typeof vi.fn>).mock.calls.map(
    (c: any[]) => c[0]
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  (bridgeState as any).processed = 0;
  vi.mocked(transcribeAudio).mockResolvedValue("Olá mundo");
  vi.mocked(saveTmpFile).mockResolvedValue("media_123.jpg");
  vi.mocked(cleanTmpFile).mockResolvedValue(undefined);
  vi.mocked(callClaude).mockResolvedValue("Claude response");
});

// ── handleAudio ──────────────────────────────────────────────────────────────

describe("handleAudio", () => {
  it("sends setup instructions when whisperBin is not set", async () => {
    const ctx = makeCtx({ whisperBin: undefined });
    await handleAudio(ctx);
    expect(sentTexts(ctx).some((t) => t.includes("Whisper não está configurado"))).toBe(true);
  });

  it("does not call downloadMedia when whisperBin is not set", async () => {
    const ctx = makeCtx({ whisperBin: undefined });
    await handleAudio(ctx);
    expect(ctx.downloadMedia).not.toHaveBeenCalled();
  });

  it("does not call Claude when whisperBin is not set", async () => {
    const ctx = makeCtx({ whisperBin: undefined });
    await handleAudio(ctx);
    expect(vi.mocked(callClaude)).not.toHaveBeenCalled();
  });

  it("sends error message when download fails", async () => {
    const ctx = makeCtx({
      downloadMedia: vi.fn().mockRejectedValue(new Error("network error")),
    });
    await handleAudio(ctx);
    expect(sentTexts(ctx).some((t) => t.includes("Falha ao baixar o áudio"))).toBe(true);
  });

  it("does not call Claude when download fails", async () => {
    const ctx = makeCtx({
      downloadMedia: vi.fn().mockRejectedValue(new Error("fail")),
    });
    await handleAudio(ctx);
    expect(vi.mocked(callClaude)).not.toHaveBeenCalled();
  });

  it("sends error message when transcription fails", async () => {
    vi.mocked(transcribeAudio).mockRejectedValue(new Error("whisper error"));
    const ctx = makeCtx();
    await handleAudio(ctx);
    expect(sentTexts(ctx).some((t) => t.includes("Falha na transcrição"))).toBe(true);
  });

  it("does not call Claude when transcription fails", async () => {
    vi.mocked(transcribeAudio).mockRejectedValue(new Error("fail"));
    const ctx = makeCtx();
    await handleAudio(ctx);
    expect(vi.mocked(callClaude)).not.toHaveBeenCalled();
  });

  it("sends empty transcript message when transcript is blank", async () => {
    vi.mocked(transcribeAudio).mockResolvedValue("");
    const ctx = makeCtx();
    await handleAudio(ctx);
    expect(sentTexts(ctx).some((t) => t.includes("Transcrição vazia"))).toBe(true);
  });

  it("echoes transcript with 🎤 prefix on happy path", async () => {
    const ctx = makeCtx();
    await handleAudio(ctx);
    expect(sentTexts(ctx).some((t) => t.includes("🎤") && t.includes("Olá mundo"))).toBe(true);
  });

  it("sends Claude response after transcript on happy path", async () => {
    vi.mocked(callClaude).mockResolvedValue("Claude response");
    const ctx = makeCtx();
    await handleAudio(ctx);
    expect(sentTexts(ctx)).toContain("Claude response");
  });

  it("calls callClaude with the transcribed text", async () => {
    vi.mocked(transcribeAudio).mockResolvedValue("my voice message");
    const ctx = makeCtx();
    await handleAudio(ctx);
    const [prompt] = vi.mocked(callClaude).mock.calls[0];
    expect(prompt).toBe("my voice message");
  });

  it("passes whisperBin, model, and language to transcribeAudio", async () => {
    const ctx = makeCtx({
      whisperBin: "/usr/bin/whisper",
      whisperModel: "small",
      whisperLanguage: "en",
    });
    await handleAudio(ctx);
    const opts = vi.mocked(transcribeAudio).mock.calls[0][1];
    expect(opts.whisperBin).toBe("/usr/bin/whisper");
    expect(opts.model).toBe("small");
    expect(opts.language).toBe("en");
  });

  it("calls audit on happy path", async () => {
    const ctx = makeCtx();
    await handleAudio(ctx);
    expect(ctx.audit).toHaveBeenCalled();
  });

  it("sends channel-not-supported error when downloadMedia is undefined", async () => {
    const ctx = makeCtx({ downloadMedia: undefined });
    await handleAudio(ctx);
    expect(sentTexts(ctx).some((t) => t.includes("canal não suporta"))).toBe(true);
  });
});

// ── handlePassthrough ────────────────────────────────────────────────────────

describe("handlePassthrough", () => {
  function makePassCtx(
    msgType: string,
    caption = "",
    overrides: Partial<MessageContext> = {}
  ): MessageContext {
    return makeCtx({ msgType, caption, ...overrides });
  }

  it("sends rate limit message when rate limit is exceeded", async () => {
    const ctx = makePassCtx("imageMessage", "", {
      rateLimitAllow: vi.fn().mockReturnValue(false),
    });
    await handlePassthrough(ctx, ".jpg");
    expect(sentTexts(ctx).some((t) => t.includes("Rate limit"))).toBe(true);
    expect(ctx.downloadMedia).not.toHaveBeenCalled();
  });

  it("sends error when download fails", async () => {
    const ctx = makePassCtx("imageMessage", "", {
      downloadMedia: vi.fn().mockRejectedValue(new Error("download error")),
    });
    await handlePassthrough(ctx, ".jpg");
    expect(sentTexts(ctx).some((t) => t.includes("Falha ao baixar o arquivo"))).toBe(true);
  });

  it("does not call Claude when download fails", async () => {
    const ctx = makePassCtx("imageMessage", "", {
      downloadMedia: vi.fn().mockRejectedValue(new Error("fail")),
    });
    await handlePassthrough(ctx, ".jpg");
    expect(vi.mocked(callClaude)).not.toHaveBeenCalled();
  });

  it("sends error when saveTmpFile fails", async () => {
    vi.mocked(saveTmpFile).mockRejectedValue(new Error("disk full"));
    const ctx = makePassCtx("imageMessage");
    await handlePassthrough(ctx, ".jpg");
    expect(sentTexts(ctx).some((t) => t.includes("Falha ao salvar o arquivo"))).toBe(true);
  });

  it("does not call Claude when saveTmpFile fails", async () => {
    vi.mocked(saveTmpFile).mockRejectedValue(new Error("fail"));
    const ctx = makePassCtx("imageMessage");
    await handlePassthrough(ctx, ".jpg");
    expect(vi.mocked(callClaude)).not.toHaveBeenCalled();
  });

  it("prompt is just the file path when there is no caption", async () => {
    vi.mocked(saveTmpFile).mockResolvedValue("media_abc.jpg");
    const ctx = makePassCtx("imageMessage", "");
    await handlePassthrough(ctx, ".jpg");
    const [prompt] = vi.mocked(callClaude).mock.calls[0];
    expect(prompt).toBe("tmp/media_abc.jpg");
  });

  it("prompt is caption + file path when caption is present", async () => {
    vi.mocked(saveTmpFile).mockResolvedValue("media_abc.jpg");
    const ctx = makePassCtx("imageMessage", "O que está escrito?");
    await handlePassthrough(ctx, ".jpg");
    const [prompt] = vi.mocked(callClaude).mock.calls[0];
    expect(prompt).toBe("O que está escrito?\n\ntmp/media_abc.jpg");
  });

  it("prompt includes document caption for documentMessage", async () => {
    vi.mocked(saveTmpFile).mockResolvedValue("media_doc.pdf");
    const ctx = makePassCtx("documentMessage", "Este PDF é o contrato");
    await handlePassthrough(ctx, ".pdf");
    const [prompt] = vi.mocked(callClaude).mock.calls[0];
    expect(prompt).toContain("Este PDF é o contrato");
    expect(prompt).toContain("tmp/media_doc.pdf");
  });

  it("saves file with correct extension (.jpg for image)", async () => {
    const ctx = makePassCtx("imageMessage");
    await handlePassthrough(ctx, ".jpg");
    const [, ext] = vi.mocked(saveTmpFile).mock.calls[0];
    expect(ext).toBe(".jpg");
  });

  it("saves file with correct extension (.pdf for document)", async () => {
    const ctx = makePassCtx("documentMessage");
    await handlePassthrough(ctx, ".pdf");
    const [, ext] = vi.mocked(saveTmpFile).mock.calls[0];
    expect(ext).toBe(".pdf");
  });

  it("saves file with correct extension (.webp for sticker)", async () => {
    const ctx = makePassCtx("stickerMessage");
    await handlePassthrough(ctx, ".webp");
    const [, ext] = vi.mocked(saveTmpFile).mock.calls[0];
    expect(ext).toBe(".webp");
  });

  it("sends Claude response to chat", async () => {
    vi.mocked(callClaude).mockResolvedValue("It's a diagram.");
    const ctx = makePassCtx("imageMessage");
    await handlePassthrough(ctx, ".jpg");
    expect(sentTexts(ctx)).toContain("It's a diagram.");
  });

  it("increments bridgeState.processed on success", async () => {
    (bridgeState as any).processed = 3;
    const ctx = makePassCtx("imageMessage");
    await handlePassthrough(ctx, ".jpg");
    expect((bridgeState as any).processed).toBe(4);
  });

  it("calls audit on happy path", async () => {
    const ctx = makePassCtx("imageMessage");
    await handlePassthrough(ctx, ".jpg");
    expect(ctx.audit).toHaveBeenCalled();
  });

  it("sends composing then paused presence updates", async () => {
    const ctx = makePassCtx("imageMessage");
    await handlePassthrough(ctx, ".jpg");
    const calls = (ctx.sendPresence as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe("composing");
    expect(calls[1][0]).toBe("paused");
  });

  it("schedules cleanTmpFile after mediaTmpTtlSeconds", async () => {
    vi.useFakeTimers();
    vi.mocked(saveTmpFile).mockResolvedValue("media_test.jpg");
    const ctx = makePassCtx("imageMessage", "", { mediaTmpTtlSeconds: 30 });
    await handlePassthrough(ctx, ".jpg");
    expect(vi.mocked(cleanTmpFile)).not.toHaveBeenCalled();
    vi.advanceTimersByTime(30_000);
    expect(vi.mocked(cleanTmpFile)).toHaveBeenCalledWith("media_test.jpg", ctx.claudeCwd);
    vi.useRealTimers();
  });

  it("sends channel-not-supported error when downloadMedia is undefined", async () => {
    const ctx = makePassCtx("imageMessage", "", { downloadMedia: undefined });
    await handlePassthrough(ctx, ".jpg");
    expect(sentTexts(ctx).some((t) => t.includes("canal não suporta"))).toBe(true);
  });
});

// ── routeMessage routing ─────────────────────────────────────────────────────

describe("routeMessage routing", () => {
  it("routes audioMessage to handleAudio (no whisperBin → setup reply)", async () => {
    const ctx = makeCtx({ msgType: "audioMessage", whisperBin: undefined });
    await routeMessage(ctx);
    expect(sentTexts(ctx).some((t) => t.includes("Whisper"))).toBe(true);
  });

  it("routes pttMessage to handleAudio (no whisperBin → setup reply)", async () => {
    const ctx = makeCtx({ msgType: "pttMessage", whisperBin: undefined });
    await routeMessage(ctx);
    expect(sentTexts(ctx).some((t) => t.includes("Whisper"))).toBe(true);
  });

  it("routes imageMessage to handlePassthrough (rate limit → rate limit reply)", async () => {
    const ctx = makeCtx({
      msgType: "imageMessage",
      rateLimitAllow: vi.fn().mockReturnValue(false),
    });
    await routeMessage(ctx);
    expect(sentTexts(ctx).some((t) => t.includes("Rate limit"))).toBe(true);
  });

  it("routes documentMessage to handlePassthrough (rate limit → rate limit reply)", async () => {
    const ctx = makeCtx({
      msgType: "documentMessage",
      rateLimitAllow: vi.fn().mockReturnValue(false),
    });
    await routeMessage(ctx);
    expect(sentTexts(ctx).some((t) => t.includes("Rate limit"))).toBe(true);
  });

  it("routes stickerMessage to handlePassthrough (rate limit → rate limit reply)", async () => {
    const ctx = makeCtx({
      msgType: "stickerMessage",
      rateLimitAllow: vi.fn().mockReturnValue(false),
    });
    await routeMessage(ctx);
    expect(sentTexts(ctx).some((t) => t.includes("Rate limit"))).toBe(true);
  });

  it("routes videoMessage to unsupported reply", async () => {
    const ctx = makeCtx({ msgType: "videoMessage" });
    await routeMessage(ctx);
    expect(sentTexts(ctx).some((t) => t.includes("not supported"))).toBe(true);
  });

  it("routes conversation to handleText → calls Claude", async () => {
    vi.mocked(callClaude).mockResolvedValue("text reply");
    const ctx = makeCtx({ msgType: "conversation", text: "hello" });
    await routeMessage(ctx);
    expect(sentTexts(ctx)).toContain("text reply");
  });

  it("routes extendedTextMessage to handleText → calls Claude", async () => {
    vi.mocked(callClaude).mockResolvedValue("ext reply");
    const ctx = makeCtx({ msgType: "extendedTextMessage", text: "hi" });
    await routeMessage(ctx);
    expect(sentTexts(ctx)).toContain("ext reply");
  });

  it("sends nothing for completely unknown message types", async () => {
    const ctx = makeCtx({ msgType: "unknownFutureType" });
    await routeMessage(ctx);
    expect(ctx.reply).not.toHaveBeenCalled();
  });
});
