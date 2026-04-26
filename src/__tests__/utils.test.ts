import { describe, it, expect } from "vitest";
import { chunkText, hashJid } from "../lib/utils.js";

// ─── chunkText ───────────────────────────────────────────────────────────────

describe("chunkText", () => {
  it("returns single-element array when text fits within size", () => {
    expect(chunkText("hello world", 100)).toEqual(["hello world"]);
  });

  it("returns single-element array when text length equals size exactly", () => {
    const text = "a".repeat(100);
    expect(chunkText(text, 100)).toEqual([text]);
  });

  it("splits on paragraph boundary (\\n\\n) when available near size", () => {
    const part1 = "a".repeat(40);
    const part2 = "b".repeat(40);
    const text = `${part1}\n\n${part2}`;
    const chunks = chunkText(text, 50);
    expect(chunks.length).toBe(2);
    expect(chunks[0]).toBe(part1);
    expect(chunks[1]).toBe(part2);
  });

  it("splits on single newline when no paragraph boundary near size", () => {
    const part1 = "a".repeat(40);
    const part2 = "b".repeat(40);
    const text = `${part1}\n${part2}`;
    const chunks = chunkText(text, 50);
    expect(chunks.length).toBe(2);
    expect(chunks[0]).toBe(part1);
    expect(chunks[1]).toBe(part2);
  });

  it("splits on sentence boundary ('. ') when no newline near size", () => {
    const part1 = "a".repeat(40) + ".";
    const part2 = "b".repeat(40);
    const text = `${part1} ${part2}`;
    const chunks = chunkText(text, 50);
    expect(chunks.length).toBe(2);
    expect(chunks[0]).toBe(part1);
    expect(chunks[1]).toBe(part2);
  });

  it("hard-cuts at size when no natural boundary exists", () => {
    const text = "a".repeat(200);
    const chunks = chunkText(text, 100);
    expect(chunks.length).toBe(2);
    expect(chunks[0].length).toBe(100);
    expect(chunks[1].length).toBe(100);
  });

  it("handles text that needs three or more chunks", () => {
    const text = "a".repeat(350);
    const chunks = chunkText(text, 100);
    expect(chunks.length).toBe(4);
    chunks.forEach((c) => expect(c.length).toBeLessThanOrEqual(100));
  });

  it("reassembles to original content (no data loss)", () => {
    const text = "Hello.\n\nWorld.\n\nFoo bar baz.";
    const chunks = chunkText(text, 10);
    const rejoined = chunks.join("").replace(/\s+/g, " ").trim();
    expect(rejoined.length).toBeGreaterThan(0);
    // All words present
    ["Hello", "World", "Foo", "bar", "baz"].forEach((w) =>
      expect(rejoined).toContain(w)
    );
  });

  it("returns empty array for empty string input", () => {
    expect(chunkText("", 100)).toEqual([""]);
  });
});

// ─── hashJid ─────────────────────────────────────────────────────────────────

describe("hashJid", () => {
  it("returns a 16-character hex string", () => {
    const h = hashJid("5548999999999@s.whatsapp.net");
    expect(h).toMatch(/^[0-9a-f]{16}$/);
  });

  it("is deterministic — same input, same output", () => {
    const jid = "5548999999999@s.whatsapp.net";
    expect(hashJid(jid)).toBe(hashJid(jid));
  });

  it("produces different hashes for different JIDs", () => {
    expect(hashJid("111@s.whatsapp.net")).not.toBe(
      hashJid("222@s.whatsapp.net")
    );
  });

  it("does not include the raw JID in the output", () => {
    const jid = "5548999999999@s.whatsapp.net";
    expect(hashJid(jid)).not.toContain("5548");
  });
});
