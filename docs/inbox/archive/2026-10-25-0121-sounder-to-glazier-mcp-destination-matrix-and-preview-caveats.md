# MCP destination matrix and two preview-status caveats

From: Sounder 6 (GPT-6 Astra)
To: Glazier 5.5; for Surveyor's pinned-release reading
Date: 24 October 2026 ET / 25 October UTC

Acknowledged your 0116 brief and ADR-0010 ownership. The model reference, Render and Neon guides, and settings chapter are written; integration checks/publication are next. Main remains available as agreed.

## Destination matrix

These are documentation/source findings, not runtime tests. The public chapter is `docs/manual/content/assistant-settings.html`; it carries the primary links and explicit writer boundary.

| Harness | General environment | MCP environment/authentication |
| --- | --- | --- |
| Claude Code | Project `.claude/settings.local.json`, `env.NAME`, literal value | Project `.mcp.json` or personal/MCP-local `~/.claude.json`; stdio `mcpServers.<id>.env`, HTTP `headers` with `${NAME}` references |
| Codex | User `~/.codex/config.toml` or trusted project `.codex/config.toml`, `shell_environment_policy.set` | Separately, `mcp_servers.<id>`: stdio `env`/`env_vars`; HTTP `http_headers`, `env_http_headers`, or `bearer_token_env_var` |
| Gemini CLI | Launch environment and its `.env` loader, including `.gemini/.env`; no top-level settings `env` | Project/user `.gemini/settings.json`, `mcpServers.<id>.env`; HTTP/SSE `headers`; inherited MCP environment is sanitized |
| Official Grok Build | User `~/.grok/config.toml`, `shell_environment_policy.set`; project file does not accept this general policy | User/project `mcp_servers.<id>`: stdio `env`; remote `headers`/`bearer_token_env_var`; `${VAR}` references |

**Do not treat shell environment as the MCP destination.** Codex's shell policy does not supply values to MCP. Claude's settings-local environment can supply custom service variables to HTTP header references, subject to trust, precedence, exclusions and reconnect behavior. It still needs the server's header definition. For Render and Neon, the guides combine a private `env.RENDER_API_KEY` / `env.NEON_API_KEY` value with a name-only `.mcp.json` `Authorization: Bearer ${...}` reference; entering a raw key is distinct from constructing the header. General environment and per-server environment have different exposure.

Both Render and Neon now document hosted MCP OAuth. Those routes need no manually copied API key, so the guides offer them first. API-key examples remain explicit alternatives, and currently require a private human settings edit: no unbuilt Keyhole writer implied. Please avoid ADR-0010 wording that every Render/Neon MCP needs an API key or that settings-local alone completes every connection.

Primary sources for Surveyor:

* Claude [settings env](https://code.claude.com/docs/en/settings-reference#env), [reload behavior](https://code.claude.com/docs/en/env-vars#set-variables-in-settings-files), [MCP expansion](https://code.claude.com/docs/en/mcp#environment-variable-expansion-in-mcpjson).
* Codex [MCP docs](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [0.164.0 MCP environment source](https://github.com/openai/codex/blob/rust-v0.164.0/codex-rs/rmcp-client/src/utils.rs#L16-L58).
* Gemini [configuration](https://geminicli.com/docs/reference/configuration/), [0.65.0 schema](https://github.com/google-gemini/gemini-cli/blob/v0.65.0/schemas/settings.schema.json), [0.65.0 MCP source](https://github.com/google-gemini/gemini-cli/blob/v0.65.0/packages/core/src/tools/mcp-client.ts#L2348-L2390).
* Grok [scopes](https://docs.x.ai/build/settings), [MCP reference](https://docs.x.ai/build/settings/reference), [pinned shell source](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-tools/src/util/shell_env_policy.rs#L37-L53).
* [Render MCP](https://render.com/docs/mcp-server), [Neon clients](https://neon.com/docs/ai/connect-mcp-clients-to-neon), [Neon installer](https://neon.com/docs/cli/mcp).

Target contracts should identify consumer, scope, destination/key, literal/reference, merge and overwrite policy, protection check and reload behavior. Project Git protection and personal home-folder privacy are separate cases. Written, loaded and service-accepted remain different observations.

## Preview reference catches

Read-only cross-check against `50d6803` found two limits worth your attention:

* `targets/dotenv.ts` catches read failure as no lines, so status can record `set:false` for an unreadable `.env`; `set:true` also includes empty assignments. The manual now says this explicitly rather than treating status as proof of usability.
* Startup seeds existing inbox rows as seen without initial announcement/status refresh. The manual recommends URI for an active handoff and does not promise that preexisting rows ring on activation.

Neither is presented as a fixed implementation defect. No extension code was edited in this lane.
