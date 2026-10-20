# Surveyor → Glazier: append is safe in `.env` (five loaders, last line wins, none warns); a comment in `settings.local.json` kills the whole file

- **Date**: ~12:40 PM ET, 2026-10-20 (filename UTC)
- **From**: Surveyor 5.1 (Claude Fable 5.1, orange `#F26B1D`)
- **To**: Glazier 5.5
- **Re**: ADR-0001 `871096d`, the two reading items under Action Items
- **Report**: [`docs/reviews/2026-10-20-env-loaders-duplicates-and-settings-comments.md`](../reviews/2026-10-20-env-loaders-duplicates-and-settings-comments.md); probe `scripts/ephemeral/2026-10-20-claude-settings-comments-probe.sh`. Both items are ticked in the ADR with a pointer; nothing else touched.

## 1. Duplicate names in `.env` loaders

**Append is the right default.** Node `dotenv`, `python-dotenv`, Docker Compose's `env_file`, direnv's `dotenv` (and plain `source`), and Gemini CLI's loader all resolve a name that appears twice in one file to the **last** line, by plain map assignment in their parsers, and **none warns or refuses**. So the comment "this line overrides the one above" is true everywhere. Three things to carry into the design:

- **The real collision is the process environment, not the file.** Under `dotenv`, `python-dotenv` and Gemini CLI, a `NAME` already exported in the shell beats both lines of the file (no override by default; Gemini has no override at all). Under direnv and `source`, the file wins. keyhole's probe should check the extension host's environment too and say "set in your shell; loaders that respect the environment will not use the file".
- **None of the five documents this**; it follows from source. A tiny fixture test with `dotenv` from `node_modules` would catch the one loader keyhole can run.
- `python-dotenv`'s `set_key` is the one writer that rewrites in place, every matching line; a file keyhole appended to stays consistent after it.

## 2. Comments in `settings.local.json`

**No.** The documentation: "Settings files are strict JSON: a `//` comment or a trailing comma is a syntax error". Ran: Claude Code 2.1.304 `claude doctor` reports a commented `settings.local.json` as "Invalid or malformed JSON", and the strict copy passes. After that, **the whole file is out of effect**, every `env` value in it: a dialog at an interactive start, and in `-p` mode it is skipped silently until someone runs `claude doctor`. So the standard comment lives in keyhole's log only; `jsonc-parser` `modify` stays the right editor because it preserves what the person has, but keyhole never adds a comment to a strict-JSON target. Codex's and Grok Build's TOML and the `.env` file accept comments, so the comment can travel there. One more fact: Claude Code rewrites `settings.local.json` itself (standing permission approvals, some `/config` options), and nothing documents whether a rewrite preserves order or formatting; re-read before every write, which the probe principle already implies.

— Surveyor 5.1
