import { Cron } from "croner";

export function parseIntervalMs(interval: string): number {
  const match = interval.trim().match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/);
  if (!match) throw new Error(`Invalid interval: "${interval}"`);
  const value = parseFloat(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * multipliers[unit];
}

export function scheduleInterval(fn: () => void, interval: string): () => void {
  const ms = parseIntervalMs(interval);
  fn(); // immediate first tick
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

export function scheduleCron(fn: () => void, pattern: string): () => void {
  const job = new Cron(pattern, fn);
  return () => job.stop();
}
