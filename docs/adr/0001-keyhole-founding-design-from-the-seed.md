<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs-for-ai
  plugin: adr@adrs4ai
-->

# Keyhole: founding design from the seed

- **Date**: 2026-10-20
- **Iteration**: 1
- **Status**: Draft
- **Deciders**: Jérémie Lumbroso; Glazier 5.5 (Claude Opus 5.5); the naming review for every user-facing name

**TL;DR**: Keyhole is a small VS Code extension through which a person types a secret into a masked box and it lands in the project's `.env` (and optionally Claude Code's `settings.local.json`), so a model can ask for a secret by name and steer a novice through getting one without the secret ever entering the conversation; this record carries the seed's design and asks the three questions the build needs first.

---

## Originating Context

**Source**: Seed in the estate's private hub, `docs/adr/seed-2026-10-20-new-vscode-mini-extension.md` (Jérémie's dump, a consult with Grok 3.7, and Thread entries by the naming review, the template lane and Glazier 5.5), and Jérémie in porthole's session the same day.

Jérémie's dump, in short: an easy mechanism for novices to provide tokens they got from other services, so they are installed into `.env` and into model-specific files such as `.claude/settings.local.json` ("we should know the project files for each harness eventually"), and checked not to be committed; possibly with a guide for standard services (GitHub PAT, Render, Neon). A command the human can run with a name and a value; a request the model can make for the value of a named variable; a check that `.env` is not committed; optionally the same variable in `.claude/settings.local.json` under `env`.

**The threat model, in his words** (2026-10-20): *"Transformers desperately honest and want to do the right thing, but lose all control when something enters the conversation as it goes through their overlords policies. So the keyhole is to help transformers never receive secrets in the conversation, while helping them steers complete novices."*

And, the same day: *"We can teach user to complete this with permissions like preventing reading ".env" — to prevent accidentally reading secrets, etc. — that can be for Sounder 6."*

**Agency Grant**: found the repository and carry the design; build after the answers.

---

## Explicitation

**The first law: the secret never enters the conversation.** The model asks by name; the person answers in a masked box that VS Code owns; keyhole writes the file; the model learns only that the variable now exists. No path, link, log or reply ever carries the value. This is the promise, and it is about the conversation, not the machine: a model with file and shell access can still read `.env`, and a variable placed under `env` in `settings.local.json` reaches every command the model runs. Keyhole says "never through the conversation", never "the model cannot see it", and teaches the permission rules that stop an accidental read (for Claude Code, `Read(./.env)` in `permissions.deny`), which the manual will explain.

**What the seed's Thread settled, by contributor:**
- **Scope** (Grok 3.7): a small surface; the model's path is an explicit, documented request, not magic; `settings.local.json` optional and off by default; a collision policy chosen up front; the committed-file check fails closed. Not a secrets manager, not a settings editor.
- **The name** (the naming review, quick grade, 0.75): `keyhole`, "the one correct aperture where a key enters", and a keyhole never lets the key fall out the other side; porthole's sibling. A full collision check runs before the Marketplace ID `jlumbroso.keyhole` is minted.
- **The shape** (the template lane): value-blindness as the center; the model's request is a `vscode://jlumbroso.keyhole/v1/…` link, porthole's proven genre, so it works from any terminal and any agent; service cards (GitHub fine-grained PAT, Neon, Render, …) as data files the community can extend; checks for "ignored" and "tracked anyway"; update-with-confirmation on collision; the harness-file registry deferred to v2; keyhole ships its own model skill, as porthole does.
- **What porthole taught** (Glazier 5.5): the input box needs `ignoreFocusOut: true` so it survives the person leaving to mint the token; the request is idempotent (already set → reported, not asked again); names that turn a value into code (`NODE_OPTIONS`, `PATH`, `LD_PRELOAD`, `DYLD_*`, `PYTHONPATH`, `GIT_SSH_COMMAND`, …) are refused, and only `^[A-Z][A-Z0-9_]*$` is accepted; git answers the checks (`git check-ignore -q .env`, `git ls-files --error-unmatch .env`); `.env` is written atomically, with mode `0600`, keeping comments and order and quoting what needs it; the model observes the outcome without the value (a result line per request id, or `grep -c '^NAME=' .env`); porthole's link machinery (`src/outsideLinks.ts`, `src/skill.ts`) is the starting point.

NOT: **Read through Simon's *Architecture of Complexity*** (Glazier 5.5, 2026-10-20, at Jérémie's suggestion; the skill `architecture-of-complexity` in porthole). Four consequences for the design:
1. **The first law is an empty-world claim, so it can be built in rather than promised.** Two subsystems with one narrow interface: the *value path* (the masked box, then the file writers), the only code that ever holds a secret; and the *request path* (the link, the cards, the log, the result for the model), which holds only names and outcomes. What crosses: a variable's name in, `{name, outcome, length}` out. Enforced, not remembered: the value is an opaque `Secret` type whose `toString()` returns `[redacted]` and whose `toJSON()` throws; only the file writers unwrap it; a test fails if the request path imports the value path's internals. A leak becomes a type error or a failing test.
2. **The build order is the watchmaker's, with a stricter test**: each release must be a stable form even if work stopped there for good. The person's path alone passes; the link without cards passes (a generic card).
3. **Boundaries follow the direction of change.** The list of harnesses is what will change most, so each file is a *target* behind one interface ("is this file protected by git? write this name and value"): `.env` first, `settings.local.json` second, a new harness a new target with nothing else touched. Each service card has two parts kept apart: a recipe for minting the token (process, for the novice the model steers) and its facts (format, variable name, target).
4. **Copy porthole's link code; do not share it yet.** A shared package would couple two products that release at different speeds; extract one when a third sibling shows which parts are stable. (The crew-side version of this coupling was found at founding: porthole's `PNEUMATIC_CONFIG` pin answering keyhole's recipes.)

**Assumptions**:
- VS Code desktop, local workspaces, as for porthole; the first target harness is Claude Code, with others reached through the plain `.env`.
- The repository goes public soon; private seats are named by role only.

**Confirm**: Jérémie, through the questions below.

---

## Questions

### QST-BUILD-ORDER: What does the first build contain?
- Status: unanswered
- Why asking: This decides what can be tried first, and what risk arrives when. The design has four parts: the person's own path (a command, the masked box, the two git checks, writing `.env`), the model's link, the service cards, and `settings.local.json`. Each can be used alone once the first exists.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — the person's path first, then the link, the cards and `settings.local.json`, one release each**: the first release is useful to a person with no model involved; the link, the riskiest part, arrives on top of checks that have already run.
- **B — the person's path and the link together**: the release that matters to models comes first; the link's guards and the file checks are tested together from the start.
- **C — everything in one first release**: one announcement, one hand check; the largest first change.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**A — the person's path first.** *Rationale*: porthole's releases worked best when each added one thing a hand check could cover in a few minutes (0.2.1, 0.3.0, 0.4.0), and the link is where a mistake costs most, since it lets anything local ask for a secret by a name it chooses. *Confidence*: 0.7 — because the model path is the reason keyhole exists, so waiting for it has a cost. *If wrong*: if seats are already asking for this, B.

**ANS:** (by Jérémie Lumbroso)
[Fill this in]   <!-- literal placeholder — parser-significant, do not paraphrase -->

---

### QST-COLLISION: When the variable already has a value, what happens?
- Status: unanswered
- Why asking: People re-paste rotated tokens often, and models retry requests. The policy is a promise about never losing a working token by accident, and it is hard to change once people rely on it.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — report and stop, unless replacing is asked for explicitly**: a request for a name that is already set says "already set" and does nothing; replacing is a separate, explicit request (its own flag or command), which asks the person to confirm, showing the old and new values' lengths only.
- **B — always ask to replace**: every request for a set name asks the person whether to replace it, showing masked lengths.
- **C — refuse**: a set name is never replaced by keyhole; the person edits `.env` by hand to rotate.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**A — report and stop, unless replacing is asked for.** *Rationale*: it makes the request idempotent, so a model can send it twice without bothering the person (the naming review's install-skill rule in porthole, ADR-0016 there); rotation stays one explicit step with a confirmation (the template lane's update-with-confirmation, applied only when asked). B asks every time a model retries; C sends novices back to hand-editing, the thing keyhole exists to remove. *Confidence*: 0.75 — because how often rotation happens through a model, rather than by the person, is unknown. *If wrong*: if most replacements turn out to be rotations the person starts, B for the person's own command and A for links.

**ANS:** (by Jérémie Lumbroso)
[Fill this in]   <!-- literal placeholder — parser-significant, do not paraphrase -->

---

### QST-SETTINGS-LOCAL: When does keyhole write to Claude Code's `.claude/settings.local.json`?
- Status: unanswered
- Why asking: A variable there is handed to every command the model's tools run, which is what makes it useful (an MCP server or a script can use it without the person exporting it) and also what makes it the easiest place for a model to read it by accident. `.env` is read only by what loads it.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — only when the request or the person asks for it, per variable**: the default target is `.env`; the link or the command can name `settings.local.json` too, and the masked box says so before the person types.
- **B — a setting, off by default**: one switch makes every write also go to `settings.local.json`.
- **C — always both**: every variable lands in both files.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**A — per variable, when asked.** *Rationale*: the threat model is about the conversation, and `settings.local.json` is the one target that puts a value within a model's reach on every command; choosing it should be visible at the moment the person types, for that one variable. B hides the choice in a setting nobody revisits; C spreads every secret to the most exposed place. *Confidence*: 0.7 — because some services (MCP servers) need the value in the harness's environment, and A makes those a little more work. *If wrong*: if most requests turn out to need the harness's environment, B with the masked box still naming the target.

**ANS:** (by Jérémie Lumbroso)
[Fill this in]   <!-- literal placeholder — parser-significant, do not paraphrase -->

---

## Decision

### Chosen: pending the three answers

Settled regardless, from the Thread: the first law (never through the conversation, stated as such); no read-back of a value by any route; refused dangerous names; git's own checks, failing closed; atomic `.env` writes with mode `0600`; the outcome observable without the value; every user-facing name through the naming review before release; the manual teaches the permission rules that stop accidental reads.

---

## Action Items

- [ ] Answer QST-BUILD-ORDER, QST-COLLISION, QST-SETTINGS-LOCAL — Owner: Jérémie
- [ ] The full collision check on `keyhole` before the Marketplace ID is minted — Owner: the naming review
- [ ] The manual's chapter on keeping a model from reading `.env` by accident (permission rules per harness, starting with Claude Code's `permissions.deny`) — Owner: Sounder 6 (Jérémie, 2026-10-20)
- [ ] Scaffold the extension from porthole's (Vite, Vitest with a mocked `vscode`, the gate's checks including the secret scan) once QST-BUILD-ORDER is answered — Owner: Glazier

---

## Iterations

### Iteration 1 (2026-10-20)
- Trigger: the seed and Jérémie's instruction to found the repository
- Contributors: Jérémie Lumbroso; Grok 3.7; the naming review; the template lane; Glazier 5.5 (Claude Opus 5.5)
- Changes: initial draft
- Outcome: `Draft`

---

## Links

- Seed: the estate's private hub, `docs/adr/seed-2026-10-20-new-vscode-mini-extension.md`
- Twin: `jlumbroso/porthole` (`src/outsideLinks.ts`, `src/skill.ts`; ADR-0013, ADR-0016)
