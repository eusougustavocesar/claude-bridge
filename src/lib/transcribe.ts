import { spawn } from "node:child_process";
import { writeFile, readFile, unlink } from "node:fs/promises";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";
import type { Logger } from "pino";

export interface TranscribeOpts {
  whisperBin: string;
  model: string;
  language?: string;
  logger: Logger;
}

export async function transcribeAudio(
  buffer: Buffer,
  opts: TranscribeOpts
): Promise<string> {
  const { whisperBin, model, language, logger } = opts;
  const tag = `reverb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const inputPath = join(tmpdir(), `${tag}.ogg`);
  // Whisper names the output file after the input basename
  const outputPath = join(tmpdir(), `${tag}.txt`);

  try {
    await writeFile(inputPath, buffer);

    const args = [
      inputPath,
      "--model",
      model,
      "--output-format",
      "txt",
      "--output-dir",
      tmpdir(),
    ];
    if (language) args.push("--language", language);

    await new Promise<void>((resolve, reject) => {
      const child = spawn(whisperBin, args, {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stderr = "";
      child.stderr.on("data", (d) => (stderr += d.toString()));
      child.stdout.on("data", () => {
        /* Whisper writes progress to stdout — ignore */
      });

      child.on("error", (err) =>
        reject(new Error(`whisper spawn failed: ${err.message}`))
      );
      child.on("close", (code) => {
        if (code !== 0) {
          logger.warn({ code, stderr: stderr.slice(-400) }, "whisper non-zero exit");
          reject(new Error(`whisper exited ${code}`));
        } else {
          resolve();
        }
      });
    });

    const transcript = await readFile(outputPath, "utf8");
    return transcript.trim();
  } finally {
    for (const p of [inputPath, outputPath]) {
      try {
        await unlink(p);
      } catch {
        /* best-effort cleanup */
      }
    }
  }
}
