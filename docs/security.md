# Security

## Threat model

`claude-bridge` gives a WhatsApp message access to Claude Code running on your machine. The reasonable threat is: **what happens if someone gains access to your WhatsApp account?**

Defaults are designed to blunt that:

### Sandboxed `CLAUDE_CWD`

By default, Claude Code runs with its working directory scoped to `./workspace` inside the repo. It can read and write files only there. It cannot access your `~/.ssh`, your password manager, your Documents, or anything else outside the sandbox.

**Do not set `CLAUDE_CWD` to `$HOME` or to a path containing secrets.** If you need Claude to work with a specific external directory, either:

- Copy files into `./workspace/` temporarily, or
- Wait for the `--add-dir` feature (see Roadmap)

### Rate limiting

Per-chat token bucket: `RATE_LIMIT_MAX` messages per `RATE_LIMIT_WINDOW_SECONDS`. Defaults: 10 / 60s. Exceeding the rate triggers an explicit reply, not silent drop — so abuse is visible.

### JID allowlist

By default only **your own self-chat** triggers Claude. Adding JIDs to `ALLOWED_JIDS` should be done carefully — every allowed chat is a potential attacker if the account is compromised.

### Audit log

Every processed message is appended to `logs/audit.jsonl` with:

- Timestamp
- **Hashed** chat JID (SHA-256, truncated) — no plaintext phone numbers
- Message type
- First 100 characters of the message

Retention is your responsibility. Rotate or delete periodically.

### Kill switch

`/stop` in your own self-chat causes the daemon to exit (0). LaunchAgent will restart it — to stop permanently, run `launchctl bootout`.

## What `claude-bridge` does NOT protect against

- **Prompt injection.** User input is passed verbatim to `claude --print`. A malicious message could attempt to make Claude exfiltrate data from the sandbox, call tools, or return doctored responses. The sandbox limits the blast radius but does not eliminate it. Treat messages from any allowed-but-not-self JID with the same care you'd treat input from any third party.
- **WhatsApp account takeover.** If your WhatsApp is cloned or SIM-swapped, an attacker can issue commands from your own chat. Consider 2FA on WhatsApp and a separate number for heavy bridging.
- **Supply chain.** This project depends on Baileys, which is an unofficial WhatsApp client. Vulnerabilities in Baileys could affect claude-bridge.

## WhatsApp Terms of Service

WhatsApp's multidevice protocol (used by linked devices like WhatsApp Web) is not officially open to programmatic clients. Using Baileys (or any unofficial WhatsApp client) **may** result in a ban of the linked number — historically rare for low-volume personal use, but non-zero.

**Recommendation:** use a dedicated WhatsApp number for automation-heavy deployments, separate from your primary phone number. Don't forward high-volume or outbound traffic through claude-bridge.

## Responsible disclosure

Found a security issue? Please open a private security advisory on GitHub instead of a public issue.
