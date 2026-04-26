import { readFileSync, existsSync } from "node:fs";
import type { Logger } from "pino";
import type { WASocket } from "@whiskeysockets/baileys";
import type { MonitorConfig, MonitorState } from "./types.js";
import { runHttpCheck } from "./http.js";
import { runShellCheck } from "./shell.js";
import { scheduleInterval, scheduleCron } from "./scheduler.js";

export function loadMonitors(configPath: string): MonitorConfig[] {
  if (!existsSync(configPath)) return [];
  try {
    const raw = readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("monitors.json must be an array");
    return parsed as MonitorConfig[];
  } catch (err) {
    throw new Error(`Failed to load monitors config at ${configPath}: ${err}`);
  }
}

export function startMonitors(
  sock: WASocket,
  configPath: string,
  logger: Logger
): () => void {
  let monitors: MonitorConfig[];
  try {
    monitors = loadMonitors(configPath);
  } catch (err) {
    logger.error({ err }, "Failed to load monitors config — monitors disabled");
    return () => {};
  }

  if (monitors.length === 0) return () => {};

  const stopFns: Array<() => void> = [];

  for (const monitor of monitors) {
    const state: MonitorState = { last: "unknown" };

    const tick = () => {
      if (monitor.type === "http") {
        runHttpCheck(monitor, state, sock, logger).catch((err) =>
          logger.error({ err, monitor: monitor.name }, "http monitor tick error")
        );
      } else if (monitor.type === "shell") {
        runShellCheck(monitor, sock, logger).catch((err) =>
          logger.error({ err, monitor: monitor.name }, "shell monitor tick error")
        );
      } else {
        const unknown = monitor as MonitorConfig;
        logger.warn({ monitor: unknown.name, type: (unknown as any).type }, "Unknown monitor type — skipped");
      }
    };

    if (monitor.interval) {
      try {
        stopFns.push(scheduleInterval(tick, monitor.interval));
        logger.info({ monitor: monitor.name, interval: monitor.interval }, "Monitor scheduled (interval)");
      } catch (err) {
        logger.error({ err, monitor: monitor.name }, "Invalid interval — monitor skipped");
      }
    } else if (monitor.cron) {
      try {
        stopFns.push(scheduleCron(tick, monitor.cron));
        logger.info({ monitor: monitor.name, cron: monitor.cron }, "Monitor scheduled (cron)");
      } catch (err) {
        logger.error({ err, monitor: monitor.name }, "Invalid cron pattern — monitor skipped");
      }
    } else {
      logger.warn({ monitor: monitor.name }, "Monitor has no interval or cron — skipped");
    }
  }

  logger.info({ count: monitors.length }, "Monitors started");
  return () => stopFns.forEach((fn) => fn());
}
