import { spawn } from "node:child_process";
import type { Logger } from "pino";

export interface ClaudeOpts {
  claudeBin: string;
  claudeCwd: string;
  claudeMcpConfig: string;
  claudeTimeoutMs: number;
  sessionMode: string;
  logger: Logger;
}

export function callClaude(prompt: string, opts: ClaudeOpts): Promise<string> {
  return new Promise((resolve) => {
    const args: string[] = [
      "--print",
      "--mcp-config",
      opts.claudeMcpConfig,
      "--no-session-persistence",
    ];
    if (opts.sessionMode === "continue") args.push("--continue");

    const child = spawn(opts.claudeBin, args, {
      cwd: opts.claudeCwd,
      env: { ...process.env, CI: "1" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), opts.claudeTimeoutMs);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      clearTimeout(timer);
      opts.logger.error({ err }, "spawn error");
      resolve(`⚠️ Error invoking Claude: ${err.message}`);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) return resolve(stdout.trim() || "(empty response)");
      opts.logger.warn({ code, stderr }, "claude exited non-zero");
      resolve(
        `⚠️ Claude exited with code ${code}.\n${(stderr || stdout).trim().slice(-1500)}`
      );
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}
