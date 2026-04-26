import { spawn } from "node:child_process";
import type { Logger } from "pino";
import type { WASocket } from "@whiskeysockets/baileys";
import type { ShellMonitor } from "./types.js";
import { formatNotification } from "../lib/notify.js";
import { chunkText } from "../lib/utils.js";

export async function runShellCheck(
  monitor: ShellMonitor,
  sock: WASocket,
  logger: Logger
): Promise<void> {
  const { name, cmd, jid } = monitor;

  let stdout = "";
  let stderr = "";
  let exitCode: number | null = null;

  try {
    exitCode = await new Promise<number>((resolve, reject) => {
      const child = spawn("sh", ["-c", cmd], { stdio: ["pipe", "pipe", "pipe"] });
      child.stdout.on("data", (d) => (stdout += d.toString()));
      child.stderr.on("data", (d) => (stderr += d.toString()));
      child.on("error", (err) => reject(new Error(`spawn failed: ${err.message}`)));
      child.on("close", resolve);
    });
  } catch (err) {
    logger.error({ monitor: name, err }, "Shell monitor spawn error");
    await sock.sendMessage(jid, {
      text: formatNotification({
        title: `${name} falhou ao executar`,
        body: String(err),
        level: "error",
        service: "reverb · monitor",
      }),
    });
    return;
  }

  if (exitCode !== 0) {
    logger.warn({ monitor: name, exitCode, stderr: stderr.slice(-400) }, "Shell monitor non-zero exit");
    const body = (stderr || stdout).trim();
    await sock.sendMessage(jid, {
      text: formatNotification({
        title: `${name} falhou (exit ${exitCode})`,
        body: body.slice(0, 1500) || undefined,
        level: "error",
        service: "reverb · monitor",
      }),
    });
    return;
  }

  const output = stdout.trim();
  if (!output) return;

  for (const chunk of chunkText(output, 3900)) {
    await sock.sendMessage(jid, { text: chunk });
  }
}
