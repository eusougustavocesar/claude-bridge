/**
 * Metadata for every known env key. Drives the Config form UI —
 * grouping, labels, help text, input types, and defaults.
 */

export type FieldType = "text" | "number" | "select" | "boolean" | "textarea";

export interface FieldMeta {
  key: string;
  label: string;
  type: FieldType;
  help: string;
  placeholder?: string;
  options?: string[]; // for select
}

export interface FieldGroup {
  id: string;
  title: string;
  description: string;
  fields: FieldMeta[];
}

export const CONFIG_SCHEMA: FieldGroup[] = [
  {
    id: "claude",
    title: "Claude Code",
    description: "How the daemon spawns claude --print to answer messages.",
    fields: [
      {
        key: "CLAUDE_BIN",
        label: "Claude binary path",
        type: "text",
        help: "Run `which claude` in a terminal to find yours.",
        placeholder: "/Users/you/.local/bin/claude",
      },
      {
        key: "CLAUDE_CWD",
        label: "Sandbox working directory",
        type: "text",
        help:
          "Claude runs with read/write access only inside this path. Never set this to $HOME or a directory with secrets.",
        placeholder: "./workspace",
      },
      {
        key: "CLAUDE_MCP_CONFIG",
        label: "MCP config",
        type: "text",
        help:
          "Must point to a file with an empty mcpServers object. Bypasses MCP startup hang under headless daemon. Don't change unless you know what you're doing.",
        placeholder: "./empty-mcp.json",
      },
      {
        key: "CLAUDE_TIMEOUT_SECONDS",
        label: "Timeout (seconds)",
        type: "number",
        help: "Max seconds to wait for a Claude response before killing it.",
        placeholder: "180",
      },
      {
        key: "SESSION_MODE",
        label: "Session mode",
        type: "select",
        help:
          "'continue' = single rolling session across messages. 'none' = each message is stateless.",
        options: ["continue", "none"],
      },
    ],
  },
  {
    id: "whatsapp",
    title: "WhatsApp channel",
    description: "Who's allowed to talk to the bridge over WhatsApp.",
    fields: [
      {
        key: "ALLOWED_JIDS",
        label: "Allowed JIDs (comma-separated)",
        type: "textarea",
        help:
          "Leave empty to only respond to self-chat. Include BOTH your phone JID (…@s.whatsapp.net) and device LID (…@lid) if you message yourself across devices.",
        placeholder: "5511999999999@s.whatsapp.net,123456789012345@lid",
      },
    ],
  },
  {
    id: "rate-limit",
    title: "Rate limiting",
    description: "Per-chat token bucket to prevent runaway message loops.",
    fields: [
      {
        key: "RATE_LIMIT_MAX",
        label: "Max messages per window",
        type: "number",
        help: "How many messages one chat can send before being rate-limited.",
        placeholder: "10",
      },
      {
        key: "RATE_LIMIT_WINDOW_SECONDS",
        label: "Window length (seconds)",
        type: "number",
        help: "Rolling window. Default: 60 (so 10 msgs / 60s).",
        placeholder: "60",
      },
    ],
  },
  {
    id: "http",
    title: "Admin HTTP server",
    description:
      "This UI itself. Changes here take effect after daemon restart.",
    fields: [
      {
        key: "HTTP_ENABLED",
        label: "Enable admin HTTP server",
        type: "select",
        help:
          "If set to false, this UI stops working and the daemon runs CLI-only.",
        options: ["true", "false"],
      },
      {
        key: "HTTP_HOST",
        label: "Bind host",
        type: "text",
        help:
          "Keep 127.0.0.1 to only expose to your local machine. Never bind to 0.0.0.0 without authentication.",
        placeholder: "127.0.0.1",
      },
      {
        key: "HTTP_PORT",
        label: "Port",
        type: "number",
        help: "Default 3737 — pick another if it's in use.",
        placeholder: "3737",
      },
    ],
  },
];

export const KNOWN_KEYS = new Set(
  CONFIG_SCHEMA.flatMap((g) => g.fields.map((f) => f.key))
);
