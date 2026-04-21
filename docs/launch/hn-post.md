# HN post draft

## Title (≤80 chars)

```
Show HN: Claude-bridge – Persistent Claude Code over WhatsApp, no Docker
```

Alternative:
```
Show HN: Claude-bridge – Use Claude Code from WhatsApp when your Mac is closed
```

## Body (300–600 words is the sweet spot)

```
Hi HN — I built claude-bridge because I wanted to use Claude Code from my phone, and every existing option had a wall I couldn't get past.

The official WhatsApp channel plugin for Claude Code (approved in the Anthropic plugin marketplace) is a plugin — it only runs while Claude Code is running. Close Claude Code, lose the bridge. Fine for my desk, useless on the bus.

Docker-based alternatives like claude-code-channels persist, but they run a 2–4 GB Linux VM 24/7 on my Mac for what amounts to a background chat bridge. That's a lot of overhead for a personal tool.

Twilio + API-key routes cost money and don't use my existing Claude Code subscription.

So I wrote a ~300-line Node daemon: a long-lived Baileys (multidevice WhatsApp) client that spawns `claude --print` per message. It runs as a LaunchAgent (macOS) — ~50 MB RAM, auto-restart on crash, auto-reconnect on network drops, auto-start on boot. Send yourself a WhatsApp message, Claude replies. Your Mac can be closed.

Three non-obvious traps I hit, in case anyone else tries this:

1. WhatsApp self-chat routes through LID (*@lid), not phone JID (*@s.whatsapp.net). If your filter compares against the phone JID you'll silently drop every self-message.

2. Claude Code's MCP auto-loader hangs when spawned without a TTY. You can pass `--mcp-config` pointing to `{"mcpServers":{}}` to bypass MCP startup while keeping OAuth intact.

3. The obvious escape hatch (`--bare`) also disables keychain reads, which breaks OAuth auth for subscription users. The empty `--mcp-config` is narrower and the right fix.

What's in v0.1 (released today):
- WhatsApp channel (Baileys)
- LaunchAgent + install script (macOS)
- Sandboxed CLAUDE_CWD (scoped to ./workspace, not $HOME)
- Rate limiting per chat (10 msgs/60s default)
- Audit log with hashed JIDs
- /stop kill switch, /help command
- Response chunking to fit WhatsApp's ~4 KB text limit

What's next:
- Telegram channel (v0.2)
- systemd unit + Linux quickstart (v0.3)
- Session per chat (v0.4)
- Audio (whisper) + images (vision) (v0.5)

It's MIT-licensed, ~50 MB RAM, no cloud, no telemetry. Uses your Claude Code subscription via `claude --print` — no API tokens needed.

Repo: https://github.com/YOUR_USERNAME/claude-bridge
Why I built it (longer writeup): https://github.com/YOUR_USERNAME/claude-bridge/blob/main/docs/why-persistence.md

Happy to hear feedback — especially from anyone who's tried the official plugin or the Docker alternatives. Curious how many of you would actually use this vs. just waiting for Anthropic to add native persistence.
```

## Posting checklist

- [ ] Username clear, avatar set
- [ ] Title under 80 chars, starts with "Show HN:"
- [ ] Link goes to repo, not personal site
- [ ] No emoji in title
- [ ] First comment posted within 5 min pointing out "happy to take questions / PRs / criticism"
- [ ] Stay online for at least 4h after posting to reply
- [ ] Don't ask for upvotes anywhere else during HN front-page window (HN punishes this hard)
- [ ] Post at 8am ET (9am BRT) — Tuesday/Wednesday/Thursday are highest engagement days
```
