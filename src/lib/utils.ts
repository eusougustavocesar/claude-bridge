import { createHash } from "node:crypto";

export function chunkText(text: string, size: number): string[] {
  if (text.length <= size) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > size) {
    let cut = remaining.lastIndexOf("\n\n", size);
    if (cut < size * 0.5) cut = remaining.lastIndexOf("\n", size);
    if (cut < size * 0.5) {
      const s = remaining.lastIndexOf(". ", size);
      if (s >= 0) cut = s + 1; // +1 keeps the "." in the first chunk
    }
    if (cut < size * 0.5) cut = size;
    chunks.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export function hashJid(jid: string): string {
  return createHash("sha256").update(jid).digest("hex").slice(0, 16);
}
