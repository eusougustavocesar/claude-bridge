# Twitter/X thread draft

---

## Tweet 1 (hook)

```
I wanted to use Claude Code from my phone.

Every option had a wall:
• Official WA plugin dies when Claude Code closes
• Docker alts = 2-4 GB VM running 24/7
• Twilio = paid tokens

So I built claude-bridge. ~50 MB, LaunchAgent, uses your Claude sub.

github.com/eusougustavocesar/claude-bridge
```

[attach demo GIF here — 10-15s showing: send msg on phone → Mac closed → reply arrives]

---

## Tweet 2 (why it works)

```
Key insight: the WhatsApp socket and the Claude Code lifecycle are independent.

claude-bridge is a daemon that holds the WA socket alive.
It spawns `claude --print` per message, subprocess exits.
Close your Mac, daemon keeps running via LaunchAgent.
```

---

## Tweet 3 (the 3 gotchas)

```
Three traps that took me a morning to find — writing them down so nobody else repeats:

1. WhatsApp self-chat routes through LID (*@lid), NOT phone JID
2. Claude's MCP loader hangs without a TTY — pass empty --mcp-config
3. Don't use --bare, it breaks OAuth. Empty MCP config alone works.
```

---

## Tweet 4 (what's in v0.1)

```
v0.1 shipped:
• WhatsApp channel
• Sandboxed CLAUDE_CWD (scoped dir, not $HOME)
• Rate limiting per chat
• Audit log w/ hashed JIDs
• /stop kill switch
• Response chunking for WA's 4 KB text limit

MIT, no telemetry, no cloud.
```

---

## Tweet 5 (roadmap + CTA)

```
Next up:
• Telegram channel (v0.2)
• systemd / Linux support (v0.3)
• Per-chat sessions (v0.4)
• Audio + images (v0.5)

Issues, PRs, or just ⭐ welcome:
github.com/eusougustavocesar/claude-bridge

HN post: [link once live]
```

---

## Posting plan

**Timing:**
- Thread publishes ~21h BRT tonight (soft launch)
- HN post follows tomorrow 9h BRT (8am ET)
- Quote-retweet the HN link from Tweet 1 when HN goes live

**Hashtags:** none. Thread reach is better without in the first hour. Can add `#ClaudeCode #Anthropic` on the final tweet if engagement stalls.

**Who to tag / mention:**
- Don't tag @AnthropicAI at launch (spammy). Let it be found organically.
- If you have a friend whose RTs would amplify in the Claude Code dev niche, consider DMing them before posting.
```
