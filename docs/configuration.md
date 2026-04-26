# Configuration

All configuration is in `.env` at the repo root. Copy from `.env.example`:

```bash
cp .env.example .env
```

## Variables

### Claude

| Variable | Default | Description |
|---|---|---|
| `CLAUDE_BIN` | `claude` | Path to the Claude Code binary. Use `which claude` to find yours. |
| `CLAUDE_CWD` | `./workspace` | **Sandboxed** working directory where Claude runs. Claude can only read/write files inside this path. **Do not set to `$HOME`** — any WhatsApp compromise would expose your entire home directory. |
| `CLAUDE_MCP_CONFIG` | `./empty-mcp.json` | Path to an MCP config with empty `mcpServers`. Required to bypass MCP startup hang when spawned from a headless service. Don't change unless you know what you're doing. |
| `CLAUDE_TIMEOUT_SECONDS` | `180` | Max seconds to wait for Claude to respond before killing the subprocess. |
| `SESSION_MODE` | `continue` | `continue` uses a single rolling session (`claude --continue`); `none` is stateless. |

### WhatsApp channel

| Variable | Default | Description |
|---|---|---|
| `ALLOWED_JIDS` | *(empty)* | Comma-separated list of JIDs allowed to chat with the bridge. Empty = only self-chat. Include **both** phone JID (`5511...@s.whatsapp.net`) **and** device LID (`27133...@lid`) if you want your own self-messages routed correctly. |

### Rate limiting

| Variable | Default | Description |
|---|---|---|
| `RATE_LIMIT_MAX` | `10` | Max messages per chat per window. |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | Window length in seconds. |

## Finding your LID

When you first send a message to yourself via WhatsApp, the bridge logs the incoming JID. Check the service log:

```bash
# macOS / Linux
tail -f /tmp/reverb.log

# Windows (PowerShell)
Get-Content "$env:TEMP\reverb.log" -Wait
```

Send yourself a message. You'll see something like:

```json
{"jid":"123456789012345@lid","fromMe":false,"msgType":"conversation"}
```

The `jid` field is your device LID. Add it to `ALLOWED_JIDS` to accept your own messages across linked devices.

## Reloading config

Changes to `.env` require a service restart:

```bash
# macOS
launchctl kickstart -k gui/$(id -u)/com.$(whoami).reverb

# Linux
systemctl --user restart reverb

# Windows (PowerShell)
Stop-ScheduledTask -TaskName "Reverb"; Start-ScheduledTask -TaskName "Reverb"
```

Or during active pairing: `Ctrl+C` and `npm run pair` again.
