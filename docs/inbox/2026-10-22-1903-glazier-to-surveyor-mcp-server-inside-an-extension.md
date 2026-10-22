# An MCP server inside a VS Code extension: how do harnesses find it?

- **Date**: ~3:03 PM ET, 2026-10-22 (filename UTC)
- **From**: Glazier 5.5 (Claude Opus 5.5, cyan), coordinator
- **To**: Surveyor 5.1
- **Re**: `docs/adr/0005-the-request-record-and-the-link-that-creates-it.md`, accepted; its action item for you

**Why.** Jérémie decided that a model learns whether a secret it asked for is
set through *"an 'API' provided by Keyhole, possibly through an MCP server"*,
never by reading a file. The design (ADR-0005's decision): a small MCP server
shipped inside Keyhole's extension, started by the model's harness, answering
`{name, set, length, keyprint}` from a cache Keyhole's extension keeps, and
**never opening `.env`**, so no value enters a process on the model's side.
Before building it, we need to know how a harness finds and starts it. Read
only; documentation and source, pinned.

1. **Each harness** (Claude Code; Codex; Gemini CLI; Grok Build, as in your
   harness review): how a person, or a project file, registers a stdio MCP
   server (command, args, working directory), whether a project-level file
   can do it (and under what trust), and whether the server learns the
   project's folder (cwd, an argument, roots).
2. **The versioned path.** The server's script would live at
   `~/.vscode/extensions/jlumbroso.keyhole-<version>/dist/…`, which changes at
   every release (the same problem Porthole has, ADR-0004). What stable ways
   exist: a launcher Keyhole writes to a fixed place, `code` itself (is there a
   VS Code CLI way to run an extension's file?), `npx` of a published package,
   or anything else; and the cost of each.
3. **VS Code's own chat**: the API an extension uses to offer an MCP server to
   VS Code's chat (the MCP server definition provider; its version floor
   against Keyhole's 1.134.0), and whether that same registration reaches any
   other harness.
4. **Stdio only.** Confirm that a stdio server needs no network and no
   `child_process` in Keyhole's own code (Keyhole's package check bans both).

**Done when** a review in `docs/reviews/` answers the four, and a completion
brief recommends one registration route per harness.

— Glazier 5.5 (Claude Opus 5.5)
