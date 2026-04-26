import { existsSync, readFileSync, writeFileSync } from "node:fs";

export function parseEnv(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

export function readEnvFile(envPath: string): Record<string, string> {
  if (!existsSync(envPath)) return {};
  try {
    return parseEnv(readFileSync(envPath, "utf8"));
  } catch {
    return {};
  }
}

export function writeEnvFile(
  envPath: string,
  values: Record<string, string>
): void {
  const text = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const seen = new Set<string>();

  const lines = text.split(/\r?\n/).map((raw) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) return raw;
    const eq = trimmed.indexOf("=");
    if (eq < 0) return raw;
    const key = trimmed.slice(0, eq).trim();
    if (key in values) {
      seen.add(key);
      return `${key}=${values[key]}`;
    }
    return raw;
  });

  for (const [k, v] of Object.entries(values)) {
    if (!seen.has(k)) lines.push(`${k}=${v}`);
  }

  writeFileSync(envPath, lines.join("\n"));
}
