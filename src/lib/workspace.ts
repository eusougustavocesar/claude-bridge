import { writeFile, unlink, mkdir } from "node:fs/promises";
import { join } from "node:path";

export async function saveTmpFile(
  buffer: Buffer,
  ext: string,
  cwd: string
): Promise<string> {
  const tmpDir = join(cwd, "tmp");
  await mkdir(tmpDir, { recursive: true });
  const filename = `media_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
  await writeFile(join(tmpDir, filename), buffer);
  return filename;
}

export async function cleanTmpFile(
  filename: string,
  cwd: string
): Promise<void> {
  try {
    await unlink(join(cwd, "tmp", filename));
  } catch {
    /* best-effort */
  }
}
