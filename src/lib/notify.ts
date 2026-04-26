export type NotifyLevel = "error" | "warning" | "info" | "success";

const LEVEL_EMOJI: Record<NotifyLevel, string> = {
  error: "🔴",
  warning: "🟡",
  info: "🔵",
  success: "🟢",
};

export interface NotifyPayload {
  title: string;
  body?: string;
  level?: NotifyLevel;
  service?: string;
}

export function formatNotification(payload: NotifyPayload): string {
  const emoji = payload.level ? LEVEL_EMOJI[payload.level] : "⚪";
  const time = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const lines: string[] = [];
  lines.push(`${emoji} *${payload.title}*`);
  if (payload.service) lines.push(`_${payload.service}_`);
  if (payload.body) {
    lines.push("");
    lines.push(payload.body);
  }
  lines.push("");
  lines.push(`— reverb · ${time}`);

  return lines.join("\n");
}
