# Troubleshooting

## QR code doesn't appear / rendering broken in terminal

The `npm run pair` flow prints the QR in two forms:

- ASCII in your terminal
- PNG saved to `/tmp/reverb-qr.png` (macOS/Linux) or `%TEMP%\reverb-qr.png` (Windows)

If the ASCII looks mangled (some fonts break Unicode half-blocks), open the PNG:

```bash
# macOS
open /tmp/reverb-qr.png

# Linux
xdg-open /tmp/reverb-qr.png

# Windows (PowerShell)
Start-Process "$env:TEMP\reverb-qr.png"
```

The QR expires every ~20 seconds; a new one regenerates automatically. If 5+ rotations pass without a successful pair, the phone-side scan is failing — try again faster.

## Bot doesn't respond to my messages

Check the daemon log — every incoming message logs `Incoming message` with its `jid`, `fromMe`, and `msgType`. If you see the message logged but nothing else, the filter rejected it.

```bash
# macOS / Linux
tail -f /tmp/reverb.log

# Windows (PowerShell)
Get-Content "$env:TEMP\reverb.log" -Wait
```

**Common cause:** WhatsApp self-chat routes through LID (`*@lid`), not your phone JID. Add your device LID to `ALLOWED_JIDS` in `.env`:

```env
ALLOWED_JIDS=123456789012345@lid
```

Then restart the service:

```bash
# macOS
launchctl kickstart -k gui/$(id -u)/com.$(whoami).reverb

# Linux
systemctl --user restart reverb

# Windows (PowerShell)
Stop-ScheduledTask -TaskName "Reverb"; Start-ScheduledTask -TaskName "Reverb"
```

## Claude subprocess hangs / times out after 180 seconds

This almost always means MCP servers failed to start. Make sure `CLAUDE_MCP_CONFIG` points to a valid `empty-mcp.json`:

```json
{ "mcpServers": {} }
```

Using the full MCP config that Claude Code uses for your interactive sessions **will hang** when spawned from a headless service (no TTY).

## "Not logged in · Please run /login"

You probably have `--bare` in your bot args — it disables keychain reads, which is where Claude Code's OAuth token lives. Remove `--bare`. `--mcp-config` alone is enough to disable MCPs without breaking auth.

## WhatsApp `statusCode 401` / "Logged out"

Auth expired (can happen after ~20 days without the primary phone using WhatsApp, or if someone revoked the linked device). Re-pair:

```bash
# macOS
launchctl bootout gui/$(id -u)/com.$(whoami).reverb || true
rm -rf auth_info
npm run pair
# re-scan QR, then Ctrl+C
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.$(whoami).reverb.plist
```

```bash
# Linux
systemctl --user stop reverb
rm -rf auth_info
npm run pair
# re-scan QR, then Ctrl+C
systemctl --user start reverb
```

```powershell
# Windows
Stop-ScheduledTask -TaskName "Reverb"
Remove-Item -Recurse -Force auth_info
npm run pair
# re-scan QR, then Ctrl+C
Start-ScheduledTask -TaskName "Reverb"
```

## Service logs missing after reboot

`/tmp` is cleared on boot on macOS and many Linux distros. Current logs are fine (the service rewrites them on start), but historical logs are gone.

- **macOS:** redirect `StandardOutPath`/`StandardErrorPath` in the plist to `~/Library/Logs/reverb/` instead of `/tmp/`
- **Linux:** use `journalctl --user -u reverb -f` — systemd persists journal across reboots
- **Windows:** logs are written to `%APPDATA%\reverb\reverb.log` by default

## Rate limit triggering too fast / too slow

Tune `.env`:

```env
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_SECONDS=60
```

Restart the service (see commands above).

## `launchctl: Bootstrap failed: 5: Input/output error` (macOS)

Usually the plist is already loaded. Bootout first, then bootstrap:

```bash
launchctl bootout gui/$(id -u)/com.$(whoami).reverb || true
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.$(whoami).reverb.plist
```

## Claude responds, but with `⚠️ Claude exited with code 1`

Check the tail of the error included in the response. Most common:
- **"Not logged in"** — see above
- **"rate limited"** (on Anthropic side) — your Claude Code subscription hit its ceiling
- **File access denied** — the sandboxed `CLAUDE_CWD` is doing its job; if you *want* to grant access to a specific directory, copy files into `./workspace/` temporarily

## Still stuck?

Open an issue with:
- Your OS and version
- `node --version`
- `claude --version`
- The last ~30 lines of the log (`/tmp/reverb.log` on macOS/Linux, `%APPDATA%\reverb\reverb.log` on Windows)
