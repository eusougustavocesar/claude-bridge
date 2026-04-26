import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseEnv, readEnvFile, writeEnvFile } from "../lib/env.js";

// ─── parseEnv ────────────────────────────────────────────────────────────────

describe("parseEnv", () => {
  it("parses simple key=value pairs", () => {
    expect(parseEnv("FOO=bar\nBAZ=qux")).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("ignores comment lines starting with #", () => {
    expect(parseEnv("# comment\nFOO=bar")).toEqual({ FOO: "bar" });
  });

  it("ignores blank lines", () => {
    expect(parseEnv("\n\nFOO=bar\n\n")).toEqual({ FOO: "bar" });
  });

  it("strips double-quoted values", () => {
    expect(parseEnv('FOO="hello world"')).toEqual({ FOO: "hello world" });
  });

  it("strips single-quoted values", () => {
    expect(parseEnv("FOO='hello world'")).toEqual({ FOO: "hello world" });
  });

  it("keeps unquoted values with spaces intact", () => {
    expect(parseEnv("FOO=hello world")).toEqual({ FOO: "hello world" });
  });

  it("handles values containing = signs", () => {
    expect(parseEnv("FOO=a=b=c")).toEqual({ FOO: "a=b=c" });
  });

  it("handles empty values", () => {
    expect(parseEnv("FOO=")).toEqual({ FOO: "" });
  });

  it("ignores lines without = sign", () => {
    expect(parseEnv("NOEQUALS\nFOO=bar")).toEqual({ FOO: "bar" });
  });

  it("handles Windows-style CRLF line endings", () => {
    expect(parseEnv("FOO=bar\r\nBAZ=qux")).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("returns empty object for empty input", () => {
    expect(parseEnv("")).toEqual({});
  });

  it("last value wins on duplicate keys", () => {
    expect(parseEnv("FOO=first\nFOO=second")).toEqual({ FOO: "second" });
  });
});

// ─── readEnvFile ─────────────────────────────────────────────────────────────

describe("readEnvFile", () => {
  let dir: string;

  beforeEach(() => {
    dir = join(tmpdir(), `reverb-env-test-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns empty object when file does not exist", () => {
    expect(readEnvFile(join(dir, "nonexistent.env"))).toEqual({});
  });

  it("reads and parses an existing .env file", () => {
    const path = join(dir, ".env");
    writeFileSync(path, "FOO=bar\nBAZ=qux\n");
    expect(readEnvFile(path)).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("handles comments and blank lines in file", () => {
    const path = join(dir, ".env");
    writeFileSync(path, "# comment\n\nFOO=bar\n");
    expect(readEnvFile(path)).toEqual({ FOO: "bar" });
  });
});

// ─── writeEnvFile ────────────────────────────────────────────────────────────

describe("writeEnvFile", () => {
  let dir: string;

  beforeEach(() => {
    dir = join(tmpdir(), `reverb-env-write-test-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("creates file with new keys when file does not exist", () => {
    const path = join(dir, ".env");
    writeEnvFile(path, { FOO: "bar", BAZ: "qux" });
    const content = readFileSync(path, "utf8");
    expect(content).toContain("FOO=bar");
    expect(content).toContain("BAZ=qux");
  });

  it("updates existing keys while preserving structure and comments", () => {
    const path = join(dir, ".env");
    writeFileSync(path, "# my comment\nFOO=old\nBAR=keep\n");
    writeEnvFile(path, { FOO: "new" });
    const content = readFileSync(path, "utf8");
    expect(content).toContain("# my comment");
    expect(content).toContain("FOO=new");
    expect(content).toContain("BAR=keep");
    expect(content).not.toContain("FOO=old");
  });

  it("appends keys not present in existing file", () => {
    const path = join(dir, ".env");
    writeFileSync(path, "FOO=bar\n");
    writeEnvFile(path, { NEW_KEY: "value" });
    const content = readFileSync(path, "utf8");
    expect(content).toContain("FOO=bar");
    expect(content).toContain("NEW_KEY=value");
  });

  it("round-trips correctly: write then read", () => {
    const path = join(dir, ".env");
    const values = { CLAUDE_BIN: "claude", HTTP_PORT: "3737", SESSION_MODE: "continue" };
    writeEnvFile(path, values);
    expect(readEnvFile(path)).toMatchObject(values);
  });

  it("handles empty values correctly", () => {
    const path = join(dir, ".env");
    writeFileSync(path, "ALLOWED_JIDS=old\n");
    writeEnvFile(path, { ALLOWED_JIDS: "" });
    expect(readEnvFile(path)).toMatchObject({ ALLOWED_JIDS: "" });
  });
});
