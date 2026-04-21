# Troubleshooting

## QR code doesn't appear / rendering broken in terminal

The `npm run pair` flow prints the QR in two forms:

- ASCII in your terminal
- PNG saved to `/tmp/claude-bridge-qr.png`

If the ASCII looks mangled (some fonts break Unicode half-blocks), just open the PNG:

```bash
open /tmp/claude-bridge-qr.png   # macOS
```

The QR expires every ~20 seconds; a new one regenerates automatically. If 5+ rotations pass without a successful pair, the phone-side scan is failing — try again faster.

## Bot doesn't respond to my messages

Check `/tmp/claude-bridge.log` — every incoming message logs `Incoming message` with its `jid`, `fromMe`, and `msgType`. If you see the message logged but nothing else, the filter rejected it.

**Common cause:** WhatsApp self-chat routes through LID (`*@lid`), not your phone JID. Add your device LID to `ALLOWED_JIDS` in `.env`:

```env
ALLOWED_JIDS=123456789012345@lid
```

Restart:
```bash
launchctl kickstart -k gui/$(id -u)/com.$(whoami).claude-bridge
```

## Claude subprocess hangs / times out after 180 seconds

This almost always means MCP servers failed to start. Make sure `CLAUDE_MCP_CONFIG` points to a valid `empty-mcp.json`:

```json
{ "mcpServers": {} }
```

Using the full MCP config that Claude Code uses for your interactive sessions **will hang** when spawned from a headless daemon (no TTY).

## "Not logged in · Please run /login"

You probably have `--bare` in your bot args — it disables keychain reads, which is where Claude Code's OAuth token lives. Remove `--bare`. `--mcp-config` alone is enough to disable MCPs without breaking auth.

## WhatsApp `statusCode 401` / "Logged out"

Auth expired (can happen after ~20 days without the primary phone using WhatsApp, or if someone revoked the linked device). Re-pair:

```bash
launchctl bootout gui/$(id -u)/com.$(whoami).claude-bridge
rm -rf auth_info
npm run pair
# re-scan QR, then Ctrl+C
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.$(whoami).claude-bridge.plist
```

## Daemon logs missing after reboot

`/tmp` is cleaned on boot by macOS. Current logs are fine (daemon rewrites on start), but historical logs are gone. For durable logs, redirect `StandardOutPath`/`StandardErrorPath` in the plist to `~/Library/Logs/claude-bridge/` instead of `/tmp/`.

## Rate limit triggering too fast / too slow

Tune `.env`:

```env
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_SECONDS=60
```

Restart daemon.

## `launchctl: Bootstrap failed: 5: Input/output error`

Usually the plist already exists and is loaded. Bootout first, then bootstrap:

```bash
launchctl bootout gui/$(id -u)/com.$(whoami).claude-bridge || true
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.$(whoami).claude-bridge.plist
```

## Claude responds, but with `⚠️ Claude exited with code 1`

Check the tail of the error included in the response. Most common:
- **"Not logged in"** — see above
- **"rate limited"** (on Anthropic side) — your Claude Code subscription hit its ceiling
- **File access denied** — the sandboxed `CLAUDE_CWD` is doing its job; if you *want* to grant access to a specific directory, use `--add-dir` (future support, see Roadmap)

## Still stuck?

Open an issue with:
- Your macOS version
- `node --version`
- `claude --version`
- The last ~30 lines of `/tmp/claude-bridge.log`
- The last ~30 lines of `/tmp/claude-bridge.err`
