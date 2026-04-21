# claude-bridge sandbox

This directory is the sandboxed working directory for claude-bridge.

Claude Code invocations triggered by incoming WhatsApp messages run with this
directory as their `cwd`. Claude has read/write access only to files inside
this directory — it cannot access files outside of it unless you change
`CLAUDE_CWD` in `.env`.

**Don't** set `CLAUDE_CWD` to `$HOME` or any directory containing secrets.
Any compromise of your WhatsApp account would expose every file Claude can see.

Use this space for notes, temporary artifacts, or small projects that you
want Claude to work with via WhatsApp.
