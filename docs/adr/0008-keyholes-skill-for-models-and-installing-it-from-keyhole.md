<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs-for-ai
  plugin: adr@adrs4ai
-->

# Keyhole's skill for models, and installing it from Keyhole

- **Date**: 2026-10-24
- **Iteration**: 1
- **Status**: Draft
- **Deciders**: Jérémie Lumbroso; Glazier 5.5 (Claude Opus 5.5); the naming review (every name); Surveyor 5.1 (how each harness finds a skill, read)

**TL;DR**: Right after 0.1.0 (Jérémie, 2026-10-24), Keyhole ships a skill that teaches models never to take a secret in the conversation and to send the person to Keyhole instead, and a command (and a link) that installs it into a project, copied from Porthole's; it grows with the link and the API in the next release; one question decides which harnesses it reaches.

---

## Originating Context

**Source**: Jérémie, 2026-10-24: *"Does Keyhole have a skill and an install-skill command that advertises itself to models? If not can we add that to the immediate backlog for right after the first release?"* It does not: ADR-0005 carries one open action ("Teach models the link in Keyhole's own skill, as Porthole's skill does"), and no install command exists.

**The model to copy**: Porthole's skill and its installer (`jlumbroso/porthole`, ADR-0016; `src/skill.ts`): the skill ships inside the extension and is written to `.claude/skills/porthole/SKILL.md` in a workspace folder, where every Claude Code session started there finds it; one action, from the command palette (**Porthole: Install the Skill for Models in This Project**) or from a link (`/v1/install-skill`); a line after the front matter records which version wrote it and a checksum, so a later version updates an untouched copy and never overwrites an edited one without asking ("has local edits", the naming review's ruling there). ADR-0001: copy Porthole's code, do not share it.

**Agency Grant**: design now; build right after 0.1.0 ships.

---

## Explicitation

**What I understand**:

1. **What the skill teaches, by release.** Right after 0.1.0, there is no link and no API yet, so the skill teaches the first law from the model's side: never ask the person to paste a secret into the conversation, never read `.env` or echo a value; ask the person to run **Keyhole: Set a Secret in .env…** with the variable's name, and tell them where to get the token; say that the value never passes through the chat. It also points to the manual's chapter on stopping accidental reads (`docs/manual/keeping-secrets-out-of-the-conversation.md`). With the second release (ADR-0005), the skill gains the request link and `check_secret`, and Keyhole's own MCP server's description already advertises itself to any harness that connects it.
2. **"Advertises itself to models"**: three channels, each a different reach. The skill's own description, which a harness reads to decide when to load it (written to trigger whenever a model is about to ask for a token, an API key or a password); the MCP server's tool description and instructions (second release); and Keyhole's log line at startup naming the install route, as Porthole's does.
3. **The install**: a command and a link, Porthole's genre and its contract: an idempotent converge (installing twice is a no-op), a version-and-checksum line, never overwriting a copy with local edits without asking. The link needs Keyhole's URI handler, which today lives on the branch `release-2-inbox`; the right-after-0.1.0 release takes the handler for this one verb, and the second release adds `/v1/request` to it.

**Doubts**:

- **Porthole's skill reaches Claude Code only** (`.claude/skills/`). Keyhole was designed for four harnesses from the start (ADR-0001; Surveyor's harness review). Codex, Gemini CLI and Grok Build each have their own way to give a model standing instructions or skills, and whether a project file can do it, under which trust, is a reading not yet done (QST-SKILL-REACH).
- **A skill is text a model trusts.** If Keyhole writes it into a project, it is committed and read by every model in that project; its words must be as reviewed as Keyhole's own dialogs (the naming review), and it must never contain an example value shaped like a real token (the gate's secret scan reads it).

**Confirm**: Jérémie, QST-SKILL-REACH; the naming review, the names.

---

## Questions

### QST-SKILL-REACH: Which harnesses does Keyhole's skill reach when Keyhole installs it in a project?
- Status: answered
- Why asking: Right after 0.1.0 Keyhole ships a skill teaching models never to take a secret in the conversation and to send the person to Keyhole, and a command that installs it into a project (this ADR). Porthole's version writes `.claude/skills/<name>/SKILL.md`, which only Claude Code reads. Keyhole was designed for four harnesses (Claude Code, Codex CLI, Gemini CLI, Grok Build; ADR-0001), and each has its own file for standing instructions or skills, some read only in a trusted folder.
- Need: pick a letter (or override — any shape answers), once the reading is in

Options:
- **A — Claude Code only, as Porthole**: one file, `.claude/skills/keyhole/SKILL.md`; the other harnesses learn Keyhole from the manual and, in the next release, from the MCP server's description.
- **B — every harness with a skill or instruction file the reading confirms**: one skill text, written to each harness's own place in the project, each with the same version-and-checksum line; the installer says which it wrote.
- **C — A now, B with the second release**: Claude Code first, then the others once the MCP server gives every harness the same API to point at.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-24)
**C — Claude Code now, the others with the second release.** *Rationale*: right after 0.1.0 the skill can only point to a command in VS Code, which every harness can name equally, so the extra files buy little; in the second release the skill gains the link and `check_secret`, and that is when a Codex or Grok model most needs to know them. Porthole's installer, copied, covers the first step at no new cost. *Confidence*: 0.55 — because Surveyor's reading may show that one shared file (an `AGENTS.md`-style convention) reaches several harnesses at once, which would make B nearly free now. *If wrong*: B, if one file reaches most harnesses; A, if the others' project files all need trust a newcomer will not have.

**ANS:** (by Jérémie Lumbroso)
Approving Option C. I don't really know how this works beyond Claude Code right now (shame on me! I realize a hypocritical homogeneity for someone advocating model diversity as an intrinsic and great good), so this will require research.

---

## Decision

**When (Jérémie, 2026-10-24)**: right after the first release, as the next one (provisionally 0.1.1), before the inbox release (ADR-0004, D), which then extends the skill with the link and the API. What it contains: this ADR's Explicitation, items 1 to 3. Which harnesses: QST-SKILL-REACH.

---

## Action Items

- [ ] Read each harness's skill and standing-instruction files (Codex, Gemini CLI, Grok Build; Claude Code's for comparison): the project-level file, the trust it needs, how a model discovers it, and whether one file serves several — Owner: Surveyor 5.1
- [ ] Answer QST-SKILL-REACH — Owner: Jérémie
- [ ] Name the skill, the install command and its link verb (Porthole's ruled `install-skill` is the obvious sibling), and review the skill's text, which models will treat as instructions — Owner: the naming review
- [ ] Build the skill and its installer right after 0.1.0 ships, copied from Porthole's `src/skill.ts` (not shared), with its tests: twice is a no-op; an edited copy is never overwritten without asking; the skill holds no token-shaped example — Owner: Glazier
- [ ] Extend the skill with the request link and `check_secret` in the inbox release — Owner: Glazier (ADR-0005's action item, folded in here)

---

## Iterations

### Iteration 1 (2026-10-24)
- Trigger: Jérémie's question and his timing
- Contributors: Jérémie Lumbroso, Glazier 5.5 (Claude Opus 5.5)
- Changes: the skill's content by release, its three channels, the install copied from Porthole; one question, waiting on a reading
- Outcome: `Draft`

---

## Links

- Porthole's skill and installer: `jlumbroso/porthole`, ADR-0016, `src/skill.ts`, `.claude/skills/porthole/SKILL.md`
- The first law: [ADR-0001](0001-keyhole-founding-design-from-the-seed.md); the order of releases: [ADR-0004](0004-requests-and-drafts-an-inbox-for-secrets-and-instructions-shown-in-porthole.md); the link and the API the skill will teach: [ADR-0005](0005-the-request-record-and-the-link-that-creates-it.md)
- The manual's chapter the skill points to: `docs/manual/keeping-secrets-out-of-the-conversation.md`
