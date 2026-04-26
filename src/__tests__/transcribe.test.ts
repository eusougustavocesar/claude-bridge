import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "node:events";

// Mock node:child_process before importing
vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

// Mock node:fs/promises before importing
vi.mock("node:fs/promises", () => ({
  writeFile: vi.fn(),
  readFile: vi.fn(),
  unlink: vi.fn(),
}));

import { spawn } from "node:child_process";
import { writeFile, readFile, unlink } from "node:fs/promises";
import { transcribeAudio } from "../lib/transcribe.js";
import pino from "pino";

const logger = pino({ level: "silent" });

function makeChildMock(exitCode: number, stderrText = "") {
  const child = new EventEmitter() as any;
  child.stderr = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stdin = { end: vi.fn() };

  // Emit events after a microtask so listeners are attached first
  setTimeout(() => {
    if (stderrText) child.stderr.emit("data", Buffer.from(stderrText));
    child.emit("close", exitCode);
  }, 0);

  return child;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(writeFile).mockResolvedValue(undefined);
  vi.mocked(readFile).mockResolvedValue("ok" as any);
  vi.mocked(unlink).mockResolvedValue(undefined);
});

describe("transcribeAudio", () => {
  it("returns transcript from whisper output file", async () => {
    vi.mocked(spawn).mockReturnValue(makeChildMock(0) as any);
    vi.mocked(readFile).mockResolvedValue("Olá mundo" as any);

    const result = await transcribeAudio(Buffer.from("audio"), {
      whisperBin: "whisper",
      model: "base",
      logger,
    });

    expect(result).toBe("Olá mundo");
  });

  it("trims leading and trailing whitespace from transcript", async () => {
    vi.mocked(spawn).mockReturnValue(makeChildMock(0) as any);
    vi.mocked(readFile).mockResolvedValue("  hello world  \n" as any);

    const result = await transcribeAudio(Buffer.from("audio"), {
      whisperBin: "whisper",
      model: "base",
      logger,
    });

    expect(result).toBe("hello world");
  });

  it("passes model flag to whisper", async () => {
    vi.mocked(spawn).mockReturnValue(makeChildMock(0) as any);

    await transcribeAudio(Buffer.from("audio"), {
      whisperBin: "whisper",
      model: "small",
      logger,
    });

    const [, args] = vi.mocked(spawn).mock.calls[0];
    expect(args).toContain("--model");
    expect(args).toContain("small");
  });

  it("passes --output-format txt", async () => {
    vi.mocked(spawn).mockReturnValue(makeChildMock(0) as any);

    await transcribeAudio(Buffer.from("audio"), {
      whisperBin: "whisper",
      model: "base",
      logger,
    });

    const [, args] = vi.mocked(spawn).mock.calls[0];
    expect(args).toContain("--output-format");
    expect(args).toContain("txt");
  });

  it("passes --language flag when language is set", async () => {
    vi.mocked(spawn).mockReturnValue(makeChildMock(0) as any);

    await transcribeAudio(Buffer.from("audio"), {
      whisperBin: "whisper",
      model: "base",
      language: "pt",
      logger,
    });

    const [, args] = vi.mocked(spawn).mock.calls[0];
    expect(args).toContain("--language");
    expect(args).toContain("pt");
  });

  it("omits --language flag when language is undefined", async () => {
    vi.mocked(spawn).mockReturnValue(makeChildMock(0) as any);

    await transcribeAudio(Buffer.from("audio"), {
      whisperBin: "whisper",
      model: "base",
      logger,
    });

    const [, args] = vi.mocked(spawn).mock.calls[0];
    expect(args).not.toContain("--language");
  });

  it("throws when whisper exits non-zero", async () => {
    vi.mocked(spawn).mockReturnValue(makeChildMock(1, "model not found") as any);

    await expect(
      transcribeAudio(Buffer.from("audio"), {
        whisperBin: "whisper",
        model: "base",
        logger,
      })
    ).rejects.toThrow("whisper exited 1");
  });

  it("throws when whisper spawn errors", async () => {
    const child = new EventEmitter() as any;
    child.stderr = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stdin = { end: vi.fn() };
    setTimeout(() => child.emit("error", new Error("ENOENT")), 0);
    vi.mocked(spawn).mockReturnValue(child as any);

    await expect(
      transcribeAudio(Buffer.from("audio"), {
        whisperBin: "whisper",
        model: "base",
        logger,
      })
    ).rejects.toThrow("ENOENT");
  });

  it("cleans up temp files even on success", async () => {
    vi.mocked(spawn).mockReturnValue(makeChildMock(0) as any);

    await transcribeAudio(Buffer.from("audio"), {
      whisperBin: "whisper",
      model: "base",
      logger,
    });

    // unlink called for both input and output files
    expect(vi.mocked(unlink).mock.calls.length).toBe(2);
  });

  it("cleans up temp files even on failure", async () => {
    vi.mocked(spawn).mockReturnValue(makeChildMock(1) as any);

    await expect(
      transcribeAudio(Buffer.from("audio"), {
        whisperBin: "whisper",
        model: "base",
        logger,
      })
    ).rejects.toThrow();

    expect(vi.mocked(unlink).mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("writes buffer to temp ogg file", async () => {
    vi.mocked(spawn).mockReturnValue(makeChildMock(0) as any);

    const buf = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
    await transcribeAudio(buf, { whisperBin: "whisper", model: "base", logger });

    const [, writtenBuf] = vi.mocked(writeFile).mock.calls[0];
    expect(writtenBuf).toEqual(buf);
  });

  it("uses the provided whisperBin path", async () => {
    vi.mocked(spawn).mockReturnValue(makeChildMock(0) as any);

    await transcribeAudio(Buffer.from("audio"), {
      whisperBin: "/usr/local/bin/whisper",
      model: "base",
      logger,
    });

    const [bin] = vi.mocked(spawn).mock.calls[0];
    expect(bin).toBe("/usr/local/bin/whisper");
  });
});
