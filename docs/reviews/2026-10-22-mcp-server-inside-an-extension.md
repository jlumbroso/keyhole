# An MCP server inside a VS Code extension: how harnesses find it, where it can live, what it must not do

- **Date**: 2026-10-22
- **By**: Surveyor 5.1 (Claude Fable 5.1), read not run
- **For**: Glazier's brief `2026-10-22-1903-glazier-to-surveyor-mcp-server-inside-an-extension.md`; ADR-0005's decision (a stdio MCP server shipped inside Keyhole, started by the model's harness, answering from the cache and never opening `.env`)
- **Sources, pinned**: Claude Code's documentation as of 2026-10-22 (it names 2.1.305); Codex CLI at `rust-v0.163.0` and its documentation; Gemini CLI at `v0.64.0` and its documentation; Grok Build at the public commit `2bdd1d6a` and docs.x.ai; the MCP specification revisions 2025-11-25 and 2026-07-28; `@modelcontextprotocol/sdk` 1.32.1 and the 2.3.1 monorepo; VS Code at tags 1.134.0 and 1.141.0 (`src/vscode-dts/vscode.d.ts`, `src/vs/workbench/contrib/mcp/`); Keyhole's `scripts/check-package-contents.mjs`. Documentation lookups were delegated and the quotes are the vendors'; the VS Code and Keyhole lines are mine.

## TL;DR

1. **Every harness starts a stdio server from a `command` + `args` (+ `env`) entry, at user scope or project scope, and project scope is trust-gated in all four.** User scope is the right place for Keyhole's entry: the server's path is machine-specific, and a project file would commit it.
2. **How the server learns the project folder differs, and the specification just deprecated the one portable mechanism.** Roots are deprecated in MCP 2026-07-28 ("pass directories or files via tool parameters, resource URIs, or server configuration"); Codex and Grok never offered them anyway. What is portable: the server's own working directory is the session's folder in Codex (by source), Gemini (SDK default) and Grok (by source), and Claude Code sets `CLAUDE_PROJECT_DIR` in the server's environment. So the tool takes an optional `project` path, and defaults to `CLAUDE_PROJECT_DIR`, else `process.cwd()`.
3. **The stable path is the extension's own global storage folder**, which VS Code gives every extension and which does not carry the version. Keyhole copies the server bundle there at activation; the registration points there forever. VS Code's command line cannot run an extension's file; `npx` is a second registry and a network fetch.
4. **VS Code's own chat has an API for this at the 1.134.0 floor** (`vscode.lm.registerMcpServerDefinitionProvider` with the `mcpServerDefinitionProviders` contribution point), and it starts the server itself, with VS Code's own Node. It reaches no other harness: VS Code only imports others' configurations, never exports.
5. **Stdio only holds.** A stdio server reads stdin and writes stdout; the harness spawns it, Keyhole's extension spawns nothing. The SDK's stdio and server modules import no network or process module. Keyhole's package check scans only `dist/extension.js`; the server bundle must be added to the allowlist and scanned the same way.

## 1. Each harness

| | Claude Code | Codex CLI `rust-v0.163.0` | Gemini CLI `v0.64.0` | Grok Build `2bdd1d6a` |
| --- | --- | --- | --- | --- |
| User-scope file | `~/.claude.json` (`claude mcp add --scope user`, or `local`, per project path) | `~/.codex/config.toml` `[mcp_servers.<name>]` (`codex mcp add <name> -- <command> …`) | `~/.gemini/settings.json` `mcpServers.<name>` (`gemini mcp add -s user …`) | `~/.grok/config.toml` `[mcp_servers.<name>]` (`grok mcp add <name> -- <command> …`, user by default) |
| Project-scope file | `.mcp.json`; approval prompt per server, choices in `.claude/settings.local.json` (`enabledMcpjsonServers`, `enableAllProjectMcpServers`); ignored in an untrusted folder | `.codex/config.toml` (`mcp_servers` is not on the project denylist); trusted projects only | `.gemini/settings.json`; the whole file is dropped when untrusted, and **any** stdio server, even user-scope, is refused in an untrusted folder ("uses stdio transport but current folder is not trusted") | `.grok/config.toml` at cwd and repo root; project-declared servers dropped until the folder is trusted (`--trust`, `/hooks-trust`) |
| Fields | `type`, `command`, `args`, `env`, `timeout`; no `cwd` | `command`, `args`, `env`, `env_vars`, **`cwd`**, timeouts, `enabled` | `command`, `args`, `env`, **`cwd`**, `timeout`, `trust`, include/exclude tools | `command`, `args`, `env`, `enabled`, timeouts; `cwd` documented but **ignored** at this commit (`server_details.rs` L137–150, `cwd: _`) |
| `${VAR}` expansion | `${VAR}`, `${VAR:-default}` in `command`, `args`, `env`, `url`, `headers` | none | in `env` values only | `${VAR}`, `${VAR:-default}` in `command`, `args`, `env`, `url`, `headers` |
| Environment the server gets | `env` plus `CLAUDE_PROJECT_DIR`; inheritance not documented | **cleared**, then `HOME`, `PATH`, `SHELL`, `USER`, `LANG`, `TMPDIR`, … plus `env_vars` plus `env` (`rmcp-client/src/utils.rs` L16–57, L162–174) | inherited, then names matching `*KEY*`, `*TOKEN*`, `*SECRET*`, … redacted unless restated in `env` | inherited in full, plus `GROK_SESSION_ID` |
| Working directory | not documented; `CLAUDE_PROJECT_DIR` "is the stable project root" | `cwd`, else the session's working directory (`stdio_server_launcher.rs` L277) | `cwd`, else Gemini's own | Grok's own (the `cwd` field is dropped) |
| MCP roots | yes: launch directory plus `--add-dir`s, with `list_changed` | no (capability not declared) | yes: cwd plus `--include-directories` | no ("never advertised") |
| Reads other harnesses' files | no | no | no | yes, as a lower-priority compatibility source: Claude's, Cursor's, `.mcp.json` |

**What the server can rely on to find the project**, and so the cache ADR-0005 puts in the project (`.keyhole/outcomes.local.json`):

- A `project` parameter on the tool, which the specification now prefers (section 5) and which the model always knows. The skill teaches it.
- Failing that, `CLAUDE_PROJECT_DIR` when set (Claude Code), else `process.cwd()`, which is the session's folder under Codex (source), Gemini (the SDK's default, "the current working directory will be inherited") and Grok (source). Under Claude Code the spawn directory is not documented, which is why the variable comes first.
- Roots only as a hint, never as the answer: deprecated, and absent in two of the four.

Two cautions from the table. Gemini redacts token-shaped names from the server's environment, and Codex clears it; neither matters to a server that reads only the cache, which is the design. And a user-scope server under Gemini still fails to start in an untrusted folder, so "Keyhole's API is unavailable here" is a state the skill should expect.

## 2. A path that survives releases

The server's script would ship at `~/.vscode/extensions/jlumbroso.keyhole-<version>/dist/…`, which changes at every release.

| Route | How | Cost |
| --- | --- | --- |
| **The extension's global storage folder** (recommended) | VS Code gives every extension `context.globalStorageUri` (`vscode.d.ts` L8527 at 1.134.0), a folder of its own under the product's user data (`…/User/globalStorage/jlumbroso.keyhole/`), no version in the path, writable without any consent dialog because it is the extension's own. At activation Keyhole copies `dist/mcp-server.js` there (version-stamped; rewrite when the stamp differs). The registration in every harness is `node <that path>` and never changes | One copy per VS Code product (Code, Insiders, Cursor and VSCodium each have their own user data), so a person using two products registers two paths or Keyhole writes the same bytes from each. The macOS path contains a space (`Application Support`): fine in JSON and TOML, quoted in a shell |
| A launcher Keyhole writes elsewhere (`~/.keyhole/bin/…`, `~/.local/bin/…`) | the same idea outside VS Code's folder | writing into the home folder is the consent question ADR-0001 raised for the skill; global storage avoids it |
| VS Code's own command line | `code` has no option that runs an extension's file or command: `src/vs/platform/environment/node/argv.ts` at 1.141.0 defines no such flag (install, list, open, diff, and so on) | not available |
| `npx <published package>@<version>` | the harness fetches the package on first run | a second registry, token and release pipeline (Purser's objection in porthole's ADR-0014), a network fetch at first use, and version skew between the extension and the package |
| VS Code's own Node for the server | VS Code's own registration (section 3) may use `process.execPath`; other harnesses would need the Electron binary's path plus `ELECTRON_RUN_AS_NODE=1` in `env` | works where `env` exists (all four), but the binary's path is per product and per install; a `node` on `PATH` is simpler, and Codex's allowlist keeps `PATH` |

Who writes the registration: Keyhole cannot run `claude mcp add` or its siblings (that is `child_process`), and project files carry the machine-specific path and trigger trust prompts. So Keyhole shows the person one command per harness, with the path filled in, to run once (a copy button in the tab); or, for the two harnesses that expand `${VAR}` in `command` (Claude Code, Grok), a project `.mcp.json` entry can read `${KEYHOLE_MCP:-…}`, which only moves the problem to an environment variable. The one-time command is the honest route.

## 3. VS Code's own chat

- **API at the floor.** `vscode.lm.registerMcpServerDefinitionProvider(id, provider)` (`vscode.d.ts` 1.134.0 L20838), with the manifest contribution `contributes.mcpServerDefinitionProviders` required first (L20815–20832; the extension point in `contrib/mcp/common/mcpConfiguration.ts` L322, L361–365). `McpStdioServerDefinition(label, command, args?, env?, version?)` with an optional `cwd: Uri` (L20422 on): "Node.js-based servers may use `process.execPath` to use the editor's version of Node.js to run the script"; `env` entries "overwrite or remove (if null) the default environment variables of the editor's extension host"; `version` "if this changes, the editor will indicate that the server has changed". The provider's `provideMcpServerDefinitions` and `onDidChangeMcpServerDefinitions` are the whole interface. So under VS Code the versioned path is no problem at all: the definition names `context.extensionPath` directly, and VS Code starts the server with its own Node.
- **It reaches no other harness.** VS Code's MCP discovery is one-way: it *imports* Claude Desktop's, Cursor's and Windsurf's configurations (`contrib/mcp/common/discovery/nativeMcpDiscoveryAdapters.ts` L25, L70–84 at 1.141.0) and exports nothing. A server registered through the API exists only inside that VS Code window's chat. The harness-side entry of section 2 is separate, and both can run at once: two instances of a server that reads one cache are harmless.

## 4. Stdio only

- **The protocol.** "The client launches the MCP server as a subprocess … The server reads JSON-RPC messages from `stdin` and writes JSON-RPC messages to `stdout`" (specification 2025-11-25 and 2026-07-28, stdio transport). The harness is the parent; Keyhole's extension never spawns it, so no `child_process` in Keyhole. Three rules the server must keep: "The server MUST NOT write anything to its `stdout` that is not a valid MCP message"; logging goes to `stderr`; "Servers SHOULD exit promptly when their standard input is closed".
- **The SDK.** `@modelcontextprotocol/sdk` 1.32.1, `src/server/stdio.ts` imports `node:process`, `node:stream` and the SDK's own shared modules; the transitive import walk from `server/stdio.js` and `server/mcp.js` reaches `zod`, `zod-to-json-schema`, `ajv`, `ajv-formats`, `json-schema-typed`, and **no `node:http`, `express`, `cross-spawn` or `child_process`**. Those live only in `server/streamableHttp.ts`, `server/sse.ts`, `server/express.ts`, `server/auth/**` and `client/stdio.ts`, none on the stdio server's path, so a bundler entering at the two modules excludes them (they remain in the package's `dependencies`, so `npm install` fetches them; the bundle does not). The 2.x line, `@modelcontextprotocol/server` 2.3.1, is leaner by design: dependencies `@modelcontextprotocol/core` and `zod` only, with a `./stdio` subpath "to keep the process-stdio surface … out of the default bundle surface".
- **Keyhole's gate.** `scripts/check-package-contents.mjs` allowlists `dist/extension.js` (L15) and scans only that file for `net`, `http`, `https`, `http2`, `dgram`, `tls`, `dns`, `child_process`, `fetch`, `XMLHttpRequest`, `WebSocket` (L31–44). A second bundle `dist/mcp-server.js` must be added to the allowlist and to the scan, and one more rule belongs to it alone: the only file it may open is the cache (ADR-0005's "a test that it opens no file but the cache"), which a scan for `readFile` targets or a mocked `fs` in the test can enforce.

## Consequences for the design

- The tool answers `{ name, set, length, keyprint }` for a `name` and an optional `project` path; without `project` it uses `CLAUDE_PROJECT_DIR`, then its working directory. It never takes a value and never opens anything but the cache.
- The server bundle is copied to global storage at activation and registered once per harness by a command Keyhole prints; VS Code's chat gets it through the provider API, no copy needed.
- Under Gemini, an untrusted folder has no Keyhole API at all; under Codex and Grok, a project file that names the server is itself trust-gated. User scope avoids all of that except Gemini's rule.
- Roots are a hint for the next twelve months at most; do not build on them.

## What this does not settle

- Claude Code's spawn working directory (not documented); the variable covers it.
- Grok's `cwd` field may be honored in a binary newer than the public snapshot; the design does not depend on it.
- None of the four registrations was run against Keyhole's server, which does not exist yet; the first hand check is "the harness lists the tool, and the tool answers for a name".
