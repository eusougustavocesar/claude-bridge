import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { saveTmpFile, cleanTmpFile } from "../lib/workspace.js";

let testCwd: string;

beforeEach(() => {
  testCwd = join(tmpdir(), `reverb-ws-test-${Date.now()}`);
  mkdirSync(testCwd, { recursive: true });
});

afterEach(() => {
  rmSync(testCwd, { recursive: true, force: true });
});

describe("saveTmpFile", () => {
  it("creates tmp/ subdirectory if it does not exist", async () => {
    const buf = Buffer.from("hello");
    await saveTmpFile(buf, ".txt", testCwd);
    expect(existsSync(join(testCwd, "tmp"))).toBe(true);
  });

  it("returns filename (not full path)", async () => {
    const filename = await saveTmpFile(Buffer.from("x"), ".jpg", testCwd);
    expect(filename).not.toContain("/");
    expect(filename.endsWith(".jpg")).toBe(true);
  });

  it("writes the correct buffer content", async () => {
    const buf = Buffer.from([1, 2, 3, 4]);
    const filename = await saveTmpFile(buf, ".bin", testCwd);
    const written = readFileSync(join(testCwd, "tmp", filename));
    expect(written).toEqual(buf);
  });

  it("uses the provided extension", async () => {
    const filename = await saveTmpFile(Buffer.from("x"), ".png", testCwd);
    expect(filename.endsWith(".png")).toBe(true);
  });

  it("generates unique filenames on multiple calls", async () => {
    const buf = Buffer.from("x");
    const a = await saveTmpFile(buf, ".jpg", testCwd);
    const b = await saveTmpFile(buf, ".jpg", testCwd);
    expect(a).not.toBe(b);
  });

  it("prefixes filename with media_", async () => {
    const filename = await saveTmpFile(Buffer.from("x"), ".jpg", testCwd);
    expect(filename.startsWith("media_")).toBe(true);
  });
});

describe("cleanTmpFile", () => {
  it("deletes the file from tmp/", async () => {
    const filename = await saveTmpFile(Buffer.from("x"), ".jpg", testCwd);
    expect(existsSync(join(testCwd, "tmp", filename))).toBe(true);
    await cleanTmpFile(filename, testCwd);
    expect(existsSync(join(testCwd, "tmp", filename))).toBe(false);
  });

  it("does not throw if file does not exist", async () => {
    await expect(
      cleanTmpFile("nonexistent.jpg", testCwd)
    ).resolves.not.toThrow();
  });
});
