#!/usr/bin/env node
/**
 * Cross-platform setup: build → register daemon → start daemon.
 * Called via `npm run setup`.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoDir = join(__dirname, "..");
const opts = { cwd: repoDir, stdio: "inherit" };

// ── 1. Build ────────────────────────────────────────────────────────────────
if (!existsSync(join(repoDir, "dist", "bot.js"))) {
  console.log("==> Building...");
  execSync("npm run build", opts);
}

// ── 2. Register system service ──────────────────────────────────────────────
console.log("==> Registering system service...");
if (process.platform === "win32") {
  execSync("powershell -ExecutionPolicy Bypass -File scripts\\install.ps1", opts);
} else {
  execSync("bash scripts/install.sh", opts);
}

// ── 3. Start daemon ─────────────────────────────────────────────────────────
console.log("\n==> Starting daemon...");
try {
  if (process.platform === "darwin") {
    const plist = `${process.env.HOME}/Library/LaunchAgents/com.${process.env.USER}.reverb.plist`;
    execSync(`launchctl bootstrap gui/$(id -u) ${plist}`, { ...opts, shell: "/bin/sh" });
  } else if (process.platform === "linux") {
    execSync("systemctl --user start reverb", opts);
  } else if (process.platform === "win32") {
    execSync('Start-ScheduledTask -TaskName "Reverb"', {
      ...opts,
      shell: "powershell",
    });
  }
  console.log("\n✓ Daemon is running.\n");
} catch {
  console.log("\n  (daemon start skipped — pair first, then re-run setup or start manually)\n");
}

console.log("==> Next: run  npm run pair  to link your WhatsApp.\n");
