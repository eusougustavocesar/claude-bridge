# Architecture

## Top-level shape

claude-bridge is intentionally simple: **one daemon, two I/O boundaries**.

```
                   ┌─────────────────────────────┐
                   │   WhatsApp servers (cloud)  │
                   └──────────────┬──────────────┘
                                  │  WebSocket (multidevice protocol)
                                  │
                   ┌──────────────▼──────────────┐
                   │      Baileys client         │   ← long-lived connection
                   ├─────────────────────────────┤
                   │   message handler           │   ← filter, rate limit, audit
                   ├─────────────────────────────┤
                   │   subprocess spawner        │   ← spawn claude --print
                   └──────────────┬──────────────┘
                                  │  stdin  / stdout
                                  │
                   ┌──────────────▼──────────────┐
                   │      claude --print         │   ← short-lived (per message)
                   │      (your CC session)      │
                   └─────────────────────────────┘

        ↑ hosted by LaunchAgent (macOS) / systemd (Linux, planned)
        ↑ KeepAlive=true — respawns on crash
        ↑ RunAtLoad=true — starts on login/boot
```

## Lifecycle

- **Daemon** (Node process): long-running. Maintains the WhatsApp WebSocket, handles reconnects, receives messages.
- **Claude subprocess**: spawned per user message, exits after stdout is drained. No shared state between invocations beyond what `claude --continue` gives you.

This separation is deliberate. The WhatsApp socket has a different lifecycle (hours–days) from a Claude Code invocation (seconds–minutes). Coupling them — as Claude Code channel plugins do — means the socket dies whenever Claude Code exits. Decoupling them means each can be restarted independently.

## Why LaunchAgent (not tmux, not screen, not nohup)

| Option | Survives reboot? | Auto-restart? | RAM overhead | Setup |
|---|:---:|:---:|:---:|---|
| `nohup ... &` | ❌ | ❌ | 0 | none |
| `tmux` / `screen` | ❌ | ❌ | small | session mgmt |
| Docker | ✅ (with restart policy) | ✅ | 2–4 GB | Dockerfile + compose |
| **LaunchAgent** | ✅ | ✅ | ~0 | plist file |
| **systemd unit** | ✅ | ✅ | ~0 | unit file |

LaunchAgent and systemd are the OS-native answers to "run this thing in the background forever". They're the right tool for a bridge whose job is to stay alive.

## Message flow (happy path)

1. Phone sends `"run npm test"` to your own WhatsApp self-chat.
2. Baileys (inside the daemon) receives the `messages.upsert` event.
3. Handler:
   - Normalizes the JID (strips device suffix, supports both phone JID and LID)
   - Confirms the sender is allowed (self-chat or in `ALLOWED_JIDS`)
   - Checks rate limit; if exceeded, replies with a rate-limit warning
   - Appends a hashed-JID entry to `logs/audit.jsonl`
   - Sends a "composing" presence update to the chat (UX: shows typing indicator)
4. `spawn(CLAUDE_BIN, ['--print', '--mcp-config', EMPTY_MCP, '--no-session-persistence', '--continue'])` runs in `CLAUDE_CWD`.
5. The prompt is written to `claude`'s stdin; stdout is buffered.
6. On exit code 0: buffered stdout is chunked (to fit WhatsApp's ~4 KB text limit) and sent back to the chat as one or more messages.
7. Non-zero exit: stderr tail is included in the reply for debugging.

## Why `--mcp-config <empty>` and not `--bare`

`claude --bare` is the documented way to get a minimal Claude Code. It skips:

- hooks
- LSP
- plugin sync
- **auto-memory**
- background prefetches
- **keychain reads**
- CLAUDE.md auto-discovery

It's too aggressive. Disabling keychain reads **breaks OAuth auth** for users on a Claude Code subscription — the subprocess fails with `Not logged in · Please run /login`.

The narrower fix is to pass `--mcp-config ./empty-mcp.json` with a blank `mcpServers` object. This:

- Bypasses the MCP startup code path (which hangs without a TTY)
- Keeps keychain, hooks, CLAUDE.md, everything else intact
- Leaves OAuth working

You lose access to your configured MCPs inside the bridge invocation — by design.

## Why Baileys (and why not use WhatsApp Business API)

**Baileys** is a community TypeScript client for WhatsApp's multidevice protocol (the same one WhatsApp Web uses). It's what every open-source WhatsApp bot uses. Trade-offs:

- ✅ Free. Uses your personal WhatsApp account.
- ✅ No business registration, no cloud provider, no API keys.
- ❌ Not officially supported by WhatsApp. Ban risk exists (low in practice for personal use).
- ❌ Breaking changes from WhatsApp happen every few months; Baileys usually catches up within days.

**WhatsApp Business API** (via Twilio, Meta directly, etc.) is the officially supported path. It requires:

- A business WhatsApp account (application process)
- Paid tokens
- A registered business phone number
- Compliance with message templates for non-session messages

For a personal developer tool — which is what claude-bridge is — Baileys is the right trade-off. If you want a production B2B bot, use Business API.

## File layout

```
claude-bridge/
├── src/
│   └── bot.ts              # single-file daemon (intentionally)
├── templates/
│   └── launchagent.plist.template
├── scripts/
│   └── install.sh
├── docs/
│   ├── architecture.md     # this file
│   ├── why-persistence.md  # the narrative / founding story
│   ├── security.md         # threat model
│   ├── configuration.md
│   └── troubleshooting.md
├── workspace/              # sandboxed Claude CWD (contents gitignored)
│   └── CLAUDE.md           # sandbox note for Claude
├── auth_info/              # Baileys session state (gitignored)
├── logs/                   # stdout, stderr, audit.jsonl (gitignored)
├── .env.example
├── empty-mcp.json          # the MCP bypass config
├── package.json
└── tsconfig.json
```

Single file for the daemon (`bot.ts`) is a conscious choice. It's ~300 lines. Splitting into modules would add noise without clarity at this size. When we add Telegram (v0.2), `src/channels/` appears.

## Extension points (where channels plug in — future)

Today the daemon has one channel hard-coded (WhatsApp). The v0.2 refactor will introduce:

```ts
interface Channel {
  name: string;
  start(dispatcher: MessageDispatcher): Promise<void>;
  stop(): Promise<void>;
}
```

Each channel (WhatsApp, Telegram, Signal, Discord) implements the interface. The dispatcher (rate limit, audit, Claude subprocess) stays shared.

## State

All persistent state lives on disk:

| Path | Purpose | Gitignored? |
|---|---|:---:|
| `auth_info/` | Baileys session + device keys | ✅ |
| `logs/audit.jsonl` | processed messages (hashed JIDs) | ✅ |
| `/tmp/claude-bridge.log` | stdout of the daemon | n/a (tmp) |
| `/tmp/claude-bridge.err` | stderr of the daemon | n/a (tmp) |
| `workspace/` | Claude sandbox CWD | ✅ |

No database. No state server. No cloud sync. That's by design — claude-bridge is meant to be self-contained and auditable.
