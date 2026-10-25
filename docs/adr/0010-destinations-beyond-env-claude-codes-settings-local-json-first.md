<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs-for-ai
  plugin: adr@adrs4ai
-->

# Destinations beyond .env: Claude Code's settings.local.json first

- **Date**: 2026-10-25
- **Iteration**: 2
- **Status**: Accepted
- **Deciders**: Jérémie Lumbroso; Glazier 5.5 (Claude Opus 5.5, the implementation); Sounder 6 (the guides and the destination matrix); Surveyor 5.1 (each harness's environment, read)

**TL;DR**: Right after the skill release (Jérémie: C), Keyhole can write a value where a Claude Code MCP server reads it: the literal in `.claude/settings.local.json` under `env`, checked by git like `.env`, while the server's entry in `.mcp.json` stays name-only (`${NAME}`); the person then trusts the folder and reconnects the server; OAuth-based MCP servers need no key at all; the other three harnesses each need their own design.

---

## Originating Context

**Source**: Sounder's brief `2026-10-25-0113-sounder-to-glazier-model-first-guides-and-harness-targets.md`, relaying Jérémie (2026-10-24): the sites' central value is that **a model can trigger the last mile** while Porthole shows the instructions; standardized service guides, starting with **Render and Neon credentials for MCPs**; and, renewed, `.claude/settings.local.json` under `env`, with verified equivalents for Codex, Gemini CLI and Grok Build. Sounder's own scope is ADR-0009 (the sites and guides).

**Already decided** (ADR-0001, QST-SETTINGS-LOCAL, his answer): *"Option A (on request) and Option B (a setting, off by default, with allowlist and/or blocklist). The scenario is, for instance, the human-AI collaboration template A would probably want to vet a broad range of MCP servers with specific tokens, etc., and pre-vet the configuration of these for streamlined purposes, maybe?"* And ADR-0001's architecture: each harness file is a *target* behind one interface ("is this file protected by git? write this name and value"), `.env` first, `settings.local.json` second, a new harness a new target with nothing else touched.

---

## Explicitation

**What I understand**:

1. **Why this is the last mile for MCPs.** `.env` is read only by what loads it; an MCP server Claude Code starts gets its environment from Claude Code, which takes `env` from its settings files (Surveyor's ADR-0001 source check). So for "the Render API key, for the Render MCP server", the value belongs in `.claude/settings.local.json` → `env.RENDER_API_KEY`, and the inbox release (ADR-0005), which writes `.env` only, cannot finish that request.
2. **The target, as decided**: a second module behind the `.env` target's interface; chosen per variable, when the request names it (the link gains a key for the destination, ruled by the naming review) or the person chooses it, and the masked box says where the value goes before the person types; plus a setting, off by default, with an allow- or blocklist of names that always go there too.
3. **Its checks, which differ from `.env`'s**: the file is JSON, so Keyhole merges one key into `env` and keeps every other key byte for byte where it can (Surveyor's review of settings files, `docs/reviews/2026-10-20-env-loaders-duplicates-and-settings-comments.md`); git must ignore it and not track it, as for `.env`; and the masked box's detail says the honest cost ADR-0001 named: a value there reaches every command the model runs, which is the point and the exposure.
4. **The other harnesses**: Sounder's research matrix, then Surveyor's reading of each harness's MCP-versus-shell environment, before any writer exists. A user-scope file (outside the project, like `~/.codex/config.toml` or `~/.grok/config.toml`) has no git check to lean on and needs its own consent and protection story; none is implied until designed.

**Confirm**: Jérémie, QST-TARGET-ORDER.

---

## Questions

### QST-TARGET-ORDER: When does Keyhole start writing to Claude Code's `.claude/settings.local.json`?
- Status: answered
- Why asking: A model asking for a Render or Neon key for an MCP server needs the value in Claude Code's `.claude/settings.local.json` under `env`, because the MCP server reads its environment from Claude Code, not from `.env`. How the target behaves is decided (ADR-0001: per variable on request, and a setting off by default with an allow- or blocklist). What is open is where it goes among the releases already ordered (ADR-0004, D): 0.1.0, the person's path (waiting on one naming check); then the skill for models (ADR-0008); then the inbox and the link (ADR-0005, built on a branch); then the entry tab; then the instruction pages.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — with the inbox release**: the request names its destination ("for Claude Code's MCP servers"), and the inbox release writes there; the first release in which a model can ask for a Render key and the Render MCP server can use it.
- **B — its own release, right after the inbox**: the inbox ships as built; the target follows as the next stable form.
- **C — before the inbox, right after the skill**: the person's command gains the destination first (no link yet), so a person following Sounder's Render or Neon guide can already put the key where the MCP server reads it.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-25)
**C — before the inbox, right after the skill.** *Rationale*: it is the smallest stable form that makes Sounder's MCP guides true: the person's path is built and checked by hand, the target is one module behind an interface designed for it, and the guides can say "run Keyhole: Set a Secret, choose Claude Code" without waiting for the link; the inbox then arrives with its destination key already meaningful. A couples two new surfaces (a link from a model, and the most exposed file) in one release, against the watchmaker's test. *Confidence*: 0.6 — because the skill release and this one could merge into one if both are small. *If wrong*: A, if a destination without a model's request is rarely what a newcomer needs; B, if the inbox should ship first because it is built.

**ANS:** (by Jérémie Lumbroso)
OK, I agree with Option C, your recommendation on scheduling seem sound.

---

## Decision

### Chosen: Claude Code's `settings.local.json` `env`, literal there and name-only in `.mcp.json`; right after the skill release

**When (QST-TARGET-ORDER, C; Jérémie, 2026-10-25)**: *"OK, I agree with Option C, your recommendation on scheduling seem sound."* After 0.1.0 and the skill release (ADR-0008), before the inbox (ADR-0005): the person's command gains the destination first.

**A correction to this ADR's first framing, from Sounder's matrix and Surveyor's reading** (`docs/reviews/2026-10-24-mcp-destination-matrix-pinned-reading.md`, Claude Code 2.1.304 run; probe `scripts/ephemeral/2026-10-24-claude-mcp-env-probe.sh`): not every Render or Neon MCP connection needs a key (both document hosted MCP with OAuth, which needs none, and Sounder's guides offer it first), and `settings.local.json` alone does not complete a connection: the server's own entry must use the value. What is now known:

- **The target**: `.claude/settings.local.json`, project scope, key `env.<NAME>`, **the literal value**. Observed: a settings `env` value is in a stdio MCP server's environment, and it is what `${NAME}` in `.mcp.json` expands to. **The server's entry stays name-only and committable**: nothing, if the server reads that name; `"env": { "SERVER_VAR": "${NAME}" }` if it wants another; `"headers": { "Authorization": "Bearer ${NAME}" }` for an HTTP server (Claude Code blanks an unlisted set of "credential variables" in remote `url` and `headers`; `RENDER_API_KEY` and `NEON_API_KEY` are not named, and the first real header will show it).
- **Its checks**: the same two git checks as `.env` (Claude Code ignores the file only when it creates it, through the global excludes; a tracked copy is treated as repository-supplied and held until trust), and a JSON merge of one key into `env` that keeps every other key.
- **What the person does next**, which Keyhole's notice must say: the folder must be trusted (project and local `env`, and the `.mcp.json` approvals, apply only after trust); then **`/mcp` → Reconnect** on the server (or `/mcp reconnect all`), because a running server keeps the environment it started with. Keyhole can say *written*; *loaded* is the reconnect; *accepted* is the service's.
- **The other three, not built, each different** (the reading's one line each): Codex rebuilds a stdio server's environment from an allowlist, its only private literal place is the home file, restart after a change; Gemini CLI empties a name-only `$VAR` for any `*KEY*`/`*TOKEN*` name unless allow-listed, restart after a change; Grok Build reads `bearer_token_file` on every request, so a 0600 file Keyhole writes is the cleanest split there, with no restart. Each needs its own consent and protection design before a writer exists.

---

## Action Items

- [x] Answer QST-TARGET-ORDER — Owner: Jérémie (2026-10-25: C)
- [x] Send the destination matrix (each harness's file for MCP servers' environment, project versus user scope, official sources) — Owner: Sounder 6 (2026-10-25)
- [x] Read, at pinned releases, how each harness hands environment to MCP servers versus shell commands, and what Claude Code does with `settings.local.json`'s `env` (merge order with `settings.json`, whether it is gitignored by Claude Code itself) — Owner: Surveyor 5.1 (2026-10-25, with a Claude Code probe)
- [ ] Build the Claude Code target behind the target interface, per variable and by setting, with its git check and the masked box's line saying where the value goes; tests that every other key survives the merge and that a tracked or unignored file is refused — Owner: Glazier
- [ ] Name the destination's word in the link and in the box, and the setting — Owner: the naming review

---

## Iterations

### Iteration 1 (2026-10-25)
- Trigger: Jérémie's renewed request, relayed by Sounder
- Contributors: Glazier 5.5 (Claude Opus 5.5)
- Changes: the target's why for MCPs, its checks, the other harnesses deferred to a reading; one question on order
- Outcome: `Draft`

### Iteration 2 (2026-10-25)
- Trigger: Jérémie's answer (C); Sounder's matrix; Surveyor's pinned reading and Claude Code probe
- Contributors: Jérémie Lumbroso, Sounder 6, Surveyor 5.1, Glazier 5.5 (Claude Opus 5.5)
- Changes: the decision: the literal in `settings.local.json` `env`, the server's entry name-only, trust then Reconnect; this ADR's first framing corrected (OAuth needs no key; the settings file alone does not complete a connection)
- Outcome: `Draft → Accepted`

---

## Links

- The decision this builds on: [ADR-0001](0001-keyhole-founding-design-from-the-seed.md), QST-SETTINGS-LOCAL and the target boundary
- The order of releases: [ADR-0004](0004-requests-and-drafts-an-inbox-for-secrets-and-instructions-shown-in-porthole.md); the skill: [ADR-0008](0008-keyholes-skill-for-models-and-installing-it-from-keyhole.md); the inbox and link: [ADR-0005](0005-the-request-record-and-the-link-that-creates-it.md)
- The sites and guides: [ADR-0009](0009-make-the-assistant-handoff-and-mcp-service-guides-explicit.md)
