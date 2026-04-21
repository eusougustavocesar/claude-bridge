# Why persistence matters

*A short note on why I built claude-bridge.*

---

I wanted to use Claude Code from my phone.

Not Claude.ai. Not the Claude desktop app. **Claude Code** — the CLI, with my project context, my permissions, my tools. I wanted to send `"run the tests on branch X"` from the bus and see the result come back.

The first thing I found was the [official WhatsApp channel plugin](https://github.com/Rich627/whatsapp-claude-plugin), approved in the Anthropic marketplace. Installed it. Paired. Tested. It worked beautifully.

Then I closed Claude Code, and the bridge died.

Because it's a **plugin**. Plugins are hosted by their host process. When Claude Code exits, every plugin it loaded exits with it. Obvious in hindsight, but a fundamental ceiling on what a plugin-based bridge can be.

I looked at the Docker alternatives. [osisdie/claude-code-channels](https://github.com/osisdie/claude-code-channels) runs Claude Code in a container, which does persist — at the cost of a full 2–4 GB Linux VM running forever on my 16 GB Mac. For a background chat bridge. That's a lot of overhead.

The Twilio + API-key route was out: paid tokens, WhatsApp Business API paperwork, not using my existing Claude subscription.

So I did what anyone would do: wrote a **separate process**. A daemon. Not a plugin. Not a container. Just a Node script hosting a Baileys WhatsApp client, sitting in the background, spawning `claude --print` when a message arrives.

The OS already has great tools for "run this in the background forever": **LaunchAgent** on macOS, **systemd** on Linux. I wired it up. It uses ~50 MB of RAM. It auto-restarts on crash. It auto-reconnects on network drops. It survives reboots.

It's been running for me for a while now. My Mac can be closed, and my phone still gets Claude replies. That's the point.

## The bugs I hit along the way, for anyone else building this

Three non-obvious traps:

1. **WhatsApp self-chat routes through LID, not phone JID.** When you send a message to yourself, WhatsApp's multidevice protocol delivers it to your other devices under a privacy-preserving Linked-device ID (`*@lid`), not your phone number JID (`*@s.whatsapp.net`). If your filter is `fromMe === true && remoteJid === phoneJid`, you'll silently drop every self-message.

2. **Claude Code's MCP auto-loader hangs without a TTY.** When spawned as a child of a daemon (no TTY), the default `claude --print` waits forever for plugin/MCP servers that were written to be interactive. Pass `--mcp-config` pointing to an empty server map to bypass it while keeping OAuth/keychain auth intact. (Using `--bare` also bypasses, but it disables keychain reads, breaking OAuth.)

3. **`--bare` is the wrong escape hatch.** `--bare` disables plugin sync *and* keychain auth. Fine if you're using `ANTHROPIC_API_KEY`, fatal if you rely on your Claude Code subscription's OAuth. The empty `--mcp-config` trick is the narrower fix.

These aren't documented anywhere I could find. I dug them out by watching processes hang, reading stderr, and reasoning about what changes between an interactive terminal and a headless daemon. I wrote it all down so the next person doesn't spend a morning on it.

That's the whole project.
