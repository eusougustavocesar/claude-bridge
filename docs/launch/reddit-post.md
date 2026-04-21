# Reddit r/ClaudeAI post draft

## Title

```
I built a persistent Claude Code ↔ WhatsApp bridge that doesn't need Docker
```

## Body

```
Every existing option for using Claude Code over WhatsApp had a trade-off I couldn't live with:

- **Official plugin** (Rich627's WhatsApp channel, approved in the Anthropic marketplace): only works while Claude Code is open. Close CC, bridge dies.
- **claude-code-channels** (Docker): persists, but at the cost of a 2–4 GB Linux VM running 24/7.
- **Twilio-based bridges**: paid, WhatsApp Business API paperwork, don't use my existing CC subscription.

So I wrote a ~300-line Node daemon that uses Baileys (WhatsApp multidevice) + spawns `claude --print` per message. Runs as LaunchAgent on macOS. ~50 MB RAM. Auto-restart. Auto-reconnect. Your Mac can be closed, phone still gets Claude replies.

**v0.1 features:**
- Sandboxed CLAUDE_CWD (scoped to ./workspace, not $HOME)
- Rate limiting per chat (10 msgs/60s default, configurable)
- Hashed-JID audit log
- `/stop` kill switch, `/help` command
- Response chunking for WhatsApp's ~4 KB text limit
- MIT-licensed

**Three gotchas I documented for anyone else trying this:**
1. WhatsApp self-chat routes through LID (`*@lid`), not phone JID. Your self-messages won't match if the filter only knows the phone JID.
2. `claude --print` hangs without a TTY when MCP servers try to start. Pass `--mcp-config` pointing to `{"mcpServers":{}}` to bypass while keeping OAuth working.
3. `--bare` disables keychain reads, breaking OAuth for subscription users. The empty `--mcp-config` is the narrower fix.

**Repo:** [github.com/eusougustavocesar/claude-bridge](https://github.com/eusougustavocesar/claude-bridge)

**Full writeup on why + arch:** [docs/why-persistence.md](https://github.com/eusougustavocesar/claude-bridge/blob/main/docs/why-persistence.md)

Happy to answer questions / take feedback. Especially interested in hearing:
- Anyone who tried the official plugin and hit the same wall?
- Anyone running the Docker alternatives — worth the RAM?
- What channels would you want next? (Telegram's v0.2)
```

## Posting notes

- r/ClaudeAI: primary target. Post tomorrow morning Brazilian time (which is still early enough for US audience to see).
- r/LocalLLaMA: cross-post potential — they care about self-hosted AI tooling. Trim the body if doing this (Reddit hates duplicate long posts).
- Flair: "Project" or "Show" if available.
- Respond to every top-level comment within the first 2 hours.
```
