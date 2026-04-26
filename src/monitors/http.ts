import type { Logger } from "pino";
import type { WASocket } from "@whiskeysockets/baileys";
import type { HttpMonitor, MonitorState } from "./types.js";
import { formatNotification } from "../lib/notify.js";

export async function runHttpCheck(
  monitor: HttpMonitor,
  state: MonitorState,
  sock: WASocket,
  logger: Logger
): Promise<void> {
  const { name, url, jid, timeout = 10_000 } = monitor;

  let isUp: boolean;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    isUp = res.ok;
  } catch {
    isUp = false;
  }

  const current = isUp ? "up" : "down";

  if (current === state.last) return;

  const wasUnknown = state.last === "unknown";
  state.last = current;

  if (!isUp) {
    logger.warn({ monitor: name, url }, "Monitor down");
    await sock.sendMessage(jid, {
      text: formatNotification({
        title: `${name} caiu`,
        body: `Não foi possível alcançar ${url}`,
        level: "error",
        service: "reverb · monitor",
      }),
    });
    return;
  }

  if (!wasUnknown) {
    logger.info({ monitor: name, url }, "Monitor recovered");
    await sock.sendMessage(jid, {
      text: formatNotification({
        title: `${name} recuperado`,
        body: `${url} está respondendo normalmente`,
        level: "success",
        service: "reverb · monitor",
      }),
    });
  }
}
