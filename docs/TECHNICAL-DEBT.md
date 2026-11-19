# Technical debt

Architectural issues, workarounds and design compromises, recorded when found so they do not accumulate in the dark (CLAUDE.md, "Technical Debt Tracking"). Each entry: issue, location, impact, workaround, fix, priority.

---

## 1. The other harnesses' equivalents of Claude Code's `settings.local.json` `env` are read, not designed

- **Issue**: Keyhole's next destination after `.env` is Claude Code's `.claude/settings.local.json` under `env` (ADR-0010). The equivalent places in the other harnesses are known only from one reading: Codex (`~/.codex/config.toml` or a trusted project's `.codex/config.toml`, `mcp_servers.<id>.env` and `env_vars`), Gemini CLI (`.gemini/settings.json` `mcpServers.<id>.env`, with name-only `$VAR` emptied for redacted names unless allow-listed), Grok Build (`mcp_servers.<id>` and its `bearer_token_file`), from Sounder's matrix and Surveyor's pinned reading (`docs/reviews/2026-10-24-mcp-destination-matrix-pinned-reading.md`). **Not read at all**: Google's Antigravity, which Jérémie names beside Gemini (2026-11-19), and any other harness since.
- **Location**: ADR-0010 (its Decision, "The other three, not built"); no code yet.
- **Impact**: until each is designed, Keyhole serves only Claude Code's MCP servers; a person on another harness must still copy a value by hand, the thing Keyhole exists to prevent. User-scope files (Codex's and Grok's home files) have no git check to lean on, so each needs its own consent and protection story before any writer exists.
- **Workaround**: Sounder's guides say plainly which harnesses Keyhole does not write for yet, and offer OAuth routes where a service has them (no key at all).
- **Fix**: per harness, a reading at pinned releases (Antigravity first, since it is unread), then a short design: the file, the key, literal or reference, the protection check, the reload step the person must take, and the consent for a file outside the project.
- **Priority**: high, after the Claude Code destination ships; it is the first thing a non-Claude user will ask for.

---

## 2. The Claude Code destination must be built as one provider of many, not as a special case

- **Issue**: Jérémie, 2026-11-19 (ADR-0010, his updated answer): *"we need to abstract the 'Claude Code' version of the functionality so we can easily add more providers/vendors — we need to think about how to detect the toolset in a project, and offer to make the setting changes according to the toolset; this sort of implies a scaffolding with a multithread pipeline with detectors, parsers, writers, etc."* ADR-0001 already set the boundary (each harness file a *target* behind one interface: "is this file protected? write this name and value"), but only `.env` exists, so the interface has one implementation and has never been tested against a second.
- **Location**: `src/targets/` (today `dotenv.ts` alone); `src/setSecret.ts`, which calls the `.env` target directly.
- **Impact**: built as a special case, the Claude Code destination would make the third and fourth harnesses rewrites instead of additions, against ADR-0001's "a new harness a new target with nothing else touched".
- **Workaround**: none needed yet; the debt is in what comes next.
- **Fix**: build the Claude Code destination as the second implementation of one pipeline, and let the second implementation shape the interface:
  - a **detector** per harness (is this harness used in this project: `.claude/`, `.mcp.json`, `.codex/`, `.gemini/`, `.grok/`, and Antigravity's files once read);
  - a **parser** per file format (dotenv, JSON, JSON with comments, TOML);
  - a **writer** per destination, behind the existing protection checks;
  - and an offer to the person, shaped by what was detected ("this project uses Claude Code and Codex; set NAME for both?"), one consent per destination.
  For JSON, an edit must keep every other byte of the person's file (their formatting, their key order, any comments a reader tolerates). Keyhole is TypeScript, so Jérémie's `json-source-edit` (Lumbroso Commons, **Python**, "surgical, byte-preserving JSON editing") is the model, not a dependency; his note: a port "in TypeScript — perhaps not at first, but we could go there". **First candidate, before any port**: Microsoft's `jsonc-parser`, the library VS Code itself uses to edit a person's `settings.json`: its `modify()` returns minimal text edits for one path and `applyEdits()` applies them, so the rest of the file, comments included, stays as it was. To check before adopting it: that its edits are byte-minimal for Keyhole's case (one key added or replaced under `env`), on real files with comments and odd formatting, in tests; that it bundles with no network or process module (the package check); and its license. If it falls short, the port is the fix, scoped to what Keyhole needs.
- **Priority**: high, and due with the Claude Code destination itself (ADR-0010's build), since that is when the interface gets its second implementation.
