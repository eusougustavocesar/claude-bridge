# Contributing

Thanks for considering contributing to reverb!

## Philosophy

This project is intentionally small. A single-file daemon plus thin templates and docs. I'd rather reject a useful PR than let the surface area grow faster than the maintainer headcount (one person, right now).

**Please open an issue before writing code** for anything larger than a bug fix or typo. The goal is to ship modest improvements with confidence, not grow scope for its own sake.

## Scope

### In scope
- Bug fixes
- New channels (Telegram, Signal, Discord — but see "adapter model" below)
- Reliability improvements (reconnect logic, error handling)
- Docs improvements, typo fixes, clearer troubleshooting
- `systemd` unit template for Linux

### Out of scope (for now)
- Cloud deployment recipes (Fly, Railway, etc.)
- Multi-tenant / multi-user (this is a personal tool)
- Web UI
- Integration with external services beyond the Claude CLI

## Adapter model (future)

When v0.2 lands, adding a new channel should mean implementing a small `Channel` interface, not forking the whole file. Until then, adding a new channel is invasive — please discuss the design in an issue first.

## Development

```bash
git clone https://github.com/eusougustavocesar/reverb.git
cd reverb
npm install
cp .env.example .env
# Edit .env as needed
npm run dev
```

`npm run dev` uses `tsx` to run directly from `src/bot.ts` — no build step while iterating.

## Code style

- TypeScript strict mode
- Minimal dependencies (every new dep adds supply-chain risk)
- Comments should explain **why**, not **what** — if the code isn't self-explanatory, the code needs work, not more comments
- Prefer editing existing files over adding new ones, especially at this project size

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/) loosely:

```
feat: add telegram channel adapter
fix: handle LID-based self-chat routing
docs: clarify sandbox CWD threat model
chore: bump baileys to 6.8.0
```

One commit per logical change. Squash merge style on PRs.

## Security disclosures

If you find a security issue, please use GitHub's [private security advisory](https://docs.github.com/en/code-security/security-advisories) feature instead of a public issue.

## License

By contributing, you agree that your contributions will be licensed under the MIT license.
