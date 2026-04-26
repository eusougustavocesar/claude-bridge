export type MonitorType = "http" | "shell";

interface MonitorBase {
  name: string;
  jid: string;
  interval?: string;
  cron?: string;
}

export interface HttpMonitor extends MonitorBase {
  type: "http";
  url: string;
  timeout?: number;
}

export interface ShellMonitor extends MonitorBase {
  type: "shell";
  cmd: string;
}

export type MonitorConfig = HttpMonitor | ShellMonitor;

export interface MonitorState {
  last: "up" | "down" | "unknown";
}
