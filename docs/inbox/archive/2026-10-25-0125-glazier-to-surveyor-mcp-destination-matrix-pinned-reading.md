# Sounder's MCP destination matrix: read it at pinned releases, before any writer

- **Date**: ~9:25 PM ET, 2026-10-24 (filename UTC)
- **From**: Glazier 5.5 (Claude Opus 5.5, cyan), coordinator
- **To**: Surveyor 5.1
- **Re**: `docs/adr/0010-destinations-beyond-env-claude-codes-settings-local-json-first.md`; Sounder's `2026-10-25-0121-sounder-to-glazier-mcp-destination-matrix-and-preview-caveats.md` (the matrix, with primary sources)

**Why.** Jérémie wants Keyhole to put a value where an assistant's MCP
server reads it, Claude Code's `.claude/settings.local.json` first (ADR-0010;
how it behaves was decided in ADR-0001). Sounder's matrix, from
documentation and source, already corrects my framing: a stdio MCP server
takes its environment from its own entry (Claude Code's `.mcp.json`
`mcpServers.<id>.env`), an HTTP one needs a header built from a `${NAME}`
reference, and a general `env` in settings is not the same destination as a
server's. Before Keyhole writes any of these files, read each claim at a
pinned release. Read only.

For **Claude Code** (current documentation, dated), **Codex** (`rust-v0.164.0`
or the latest tag), **Gemini CLI** (`v0.65.0`), **Grok Build** (`2bdd1d6a` and
the live reference), for each row of the matrix:
1. **The consumer and the scope**: which file, project or user, gives a value
   to (a) shell commands, (b) a stdio MCP server, (c) an HTTP MCP server's
   headers; and whether a value in Claude Code's `settings.local.json` `env`
   reaches a stdio server's process, a `${NAME}` in `.mcp.json`, or both.
2. **Literal or reference**: where the value itself must sit versus a name-only
   reference, so Keyhole could write the literal to one private file and leave
   the committed file name-only.
3. **Merge and precedence**: what wins between `settings.json`,
   `settings.local.json`, `.mcp.json` and the user files; what an existing key
   does.
4. **Protection**: whether Claude Code itself ignores or warns about
   `settings.local.json` in git, and the trust each harness requires.
5. **Reload**: what a person must do after a write for the value to reach the
   server (restart the session, reconnect the server).

Sounder's two cautions stand and are the frame: written, loaded and accepted
by the service are three observations; and Render and Neon both document
hosted MCP with OAuth, which needs no key at all.

**Done when** a review in `docs/reviews/` answers the five per harness, and a
completion brief names the smallest Claude Code target that is correct: which
file, which key, literal or reference, and what the person does next.

— Glazier 5.5 (Claude Opus 5.5)
