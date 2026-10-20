<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs-for-ai
  plugin: adr@adrs4ai
-->

# Keyhole: founding design from the seed

- **Date**: 2026-10-20
- **Iteration**: 3
- **Status**: Accepted
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
- **What porthole taught** (Glazier 5.5): the input box needs `ignoreFocusOut: true` so it survives the person leaving to mint the token; the request is idempotent (already set → reported, not asked again); names that turn a value into code (`NODE_OPTIONS`, `PATH`, `LD_PRELOAD`, `DYLD_*`, `PYTHONPATH`, `GIT_SSH_COMMAND`, …) are refused, and only `^[A-Z][A-Z0-9_]*$` is accepted; git answers the checks, in Surveyor's corrected order below; `.env` is written atomically, with mode `0600`, keeping comments and order and quoting what needs it; the model observes the outcome without the value, through keyhole's own result line per request id only (a `grep -c` suggested here first was withdrawn: it reads `.env`, which the manual's deny rule exists to prevent); porthole's link machinery (`src/outsideLinks.ts`, `src/skill.ts`) is the starting point.

NOT: **Read through Simon's *Architecture of Complexity*** (Glazier 5.5, 2026-10-20, at Jérémie's suggestion; the skill `architecture-of-complexity` in porthole). Four consequences for the design:
1. **The first law is an empty-world claim, so it can be built in rather than promised.** Two subsystems with one narrow interface: the *value path* (the masked box, then the file writers), the only code that ever holds a secret; and the *request path* (the link, the cards, the log, the result for the model), which holds only names and outcomes. What crosses: a variable's name in, `{name, outcome, length}` out. Enforced, not remembered: the value is an opaque `Secret` type whose `toString()` returns `[redacted]` and whose `toJSON()` throws; only the file writers unwrap it; a test fails if the request path imports the value path's internals. A leak becomes a type error or a failing test.
2. **The build order is the watchmaker's, with a stricter test**: each release must be a stable form even if work stopped there for good. The person's path alone passes; the link without cards passes (a generic card).
3. **Boundaries follow the direction of change.** The list of harnesses is what will change most, so each file is a *target* behind one interface ("is this file protected by git? write this name and value"): `.env` first, `settings.local.json` second, a new harness a new target with nothing else touched. Each service card has two parts kept apart: a recipe for minting the token (process, for the novice the model steers) and its facts (format, variable name, target).
4. **Copy porthole's link code; do not share it yet.** A shared package would couple two products that release at different speeds; extract one when a third sibling shows which parts are stable. (The crew-side version of this coupling was found at founding: porthole's `PNEUMATIC_CONFIG` pin answering keyhole's recipes.)

NOT: **Surveyor 5.1's source check, folded in** (2026-10-20; report `docs/reviews/2026-10-20-adr-0001-source-check.md`). The masked box holds: paste works, `ignoreFocusOut` keeps it open while the person is away, VS Code neither logs nor keeps the value (caveats for the manual: the developer flag `--logExtensionHostCommunication` echoes the reply; `validateInput`, if used, sees the plain value). **Git's checks in order**: `git ls-files --error-unmatch <file>` first (tracked: stop, whatever the ignore rules say, because `check-ignore` answers "not ignored" for a tracked file), then `git check-ignore -q <file>` (0 ignored: go; 1 not ignored: stop); exit **128** is a third outcome, *no repository*; both run with the workspace folder as `cwd`; both work before the file exists, so keyhole refuses before creating it. **`settings.local.json`**: its `env` reaches Bash commands, hooks and stdio MCP servers; Claude Code ignores the file only when it creates it (through the global excludes file), and git's check reports that truthfully; a removed variable lives on in running sessions until `claude` restarts, which a rotation must say; `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` strips token-shaped values from the very subprocesses the file serves, so keyhole should detect it and say so; and the refused names gain `HOME`, `TMPDIR`, `XDG_*` and `CLAUDE_CONFIG_DIR`, which Claude Code drops from project files anyway. **For the manual**: `Read(./.env)` and `Read(./.env.*)` cover the file commands Claude Code recognizes, not a script that opens the file, and `Bash(cat .env)` is the wrong tool.

NOT: **Other harnesses, by design** (Jérémie, 2026-10-20: *"maybe we can extend to other vendors, like codex, or gemini or grok — with customizable or extensible or modular design?"*). Yes, and it is the target boundary of the Simon note above, made the first extension point: each harness is one **target** module answering three questions the core asks of all of them alike: *which file holds the variable, and in what shape*; *does git protect that file* (the same two checks); *how does the value reach this harness's tools, and when does a change take effect*. The core (the masked box, the refusals, the result line) never names a vendor. v1 ships two targets, the plain `.env` and Claude Code's `settings.local.json`; others (OpenAI's Codex, Google's Gemini CLI, xAI's Grok, …) are added one module at a time, **each after its vendor's own documentation has been read and checked, not guessed**. One question each target must answer before it ships: whether its file lives in the project (protected by git) or in the person's home folder (outside the project, a different safety picture, which the masked box must state before the person types).

**Assumptions**:
- VS Code desktop, local workspaces, as for porthole; the first target harness is Claude Code, with others reached through the plain `.env`.
- The repository goes public soon; private seats are named by role only.

**Confirm**: Jérémie, through the questions below.

---

## Questions

### QST-BUILD-ORDER: What does the first build contain?
- Status: answered
- Why asking: This decides what can be tried first, and what risk arrives when. The design has four parts: the person's own path (a command, the masked box, the two git checks, writing `.env`), the model's link, the service cards, and `settings.local.json`. Each can be used alone once the first exists.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — the person's path first, then the link, the cards and `settings.local.json`, one release each**: the first release is useful to a person with no model involved; the link, the riskiest part, arrives on top of checks that have already run.
- **B — the person's path and the link together**: the release that matters to models comes first; the link's guards and the file checks are tested together from the start.
- **C — everything in one first release**: one announcement, one hand check; the largest first change.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**A — the person's path first.** *Rationale*: porthole's releases worked best when each added one thing a hand check could cover in a few minutes (0.2.1, 0.3.0, 0.4.0), and the link is where a mistake costs most, since it lets anything local ask for a secret by a name it chooses. *Confidence*: 0.7 — because the model path is the reason keyhole exists, so waiting for it has a cost. *If wrong*: if seats are already asking for this, B.

**ANS:** (by Jérémie Lumbroso)
OK, agreed with Option A. Everything should be modularly designed.

---

### QST-COLLISION: When the variable already has a value, what happens?
- Status: answered
- Why asking: People re-paste rotated tokens often, and models retry requests. The policy is a promise about never losing a working token by accident, and it is hard to change once people rely on it.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — report and stop, unless replacing is asked for explicitly**: a request for a name that is already set says "already set" and does nothing; replacing is a separate, explicit request (its own flag or command), which asks the person to confirm, showing the old and new values' lengths only.
- **B — always ask to replace**: every request for a set name asks the person whether to replace it, showing masked lengths.
- **C — refuse**: a set name is never replaced by keyhole; the person edits `.env` by hand to rotate.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**A — report and stop, unless replacing is asked for.** *Rationale*: it makes the request idempotent, so a model can send it twice without bothering the person (the naming review's install-skill rule in porthole, ADR-0016 there); rotation stays one explicit step with a confirmation (the template lane's update-with-confirmation, applied only when asked). B asks every time a model retries; C sends novices back to hand-editing, the thing keyhole exists to remove. *Confidence*: 0.75 — because how often rotation happens through a model, rather than by the person, is unknown. *If wrong*: if most replacements turn out to be rotations the person starts, B for the person's own command and A for links.

**ANS:** (by Jérémie Lumbroso)
There are a few of ideas/principles that come to mind:

1. The extension itself can do a lot of investation/probing/checking work that the model can't do. It can check: "Is the environment already configured?" and "Is .env already set?" and "Is 'env' key configured in .claude/settings.local.json?" and so on. It can have a mechanism to measure this before/after modifications, etc.

2. The extension should have a log, and it should log all its pre/post tests, so that there is perfect traceability. Maybe we should also determine some way of detection keys? Like the "first and last char, with '*' in between? or "<OBKEY:[first]****[last]/>", like "<OBKEY:a****4/>" maybe? The log would help models and humans figure out what happened when.

3. When Keyhole makes modifications to these files, a few principles:
   - As much as possible they should be **append-only**.
   - When they cannot be append-only, they should use a format-preserving tool like `json-source-edit` or equivalent.
   - When possible they should include a standardized comment which explains:
     - the modification was made by Keyhole (and version number)
     - why? and at what time?
     - whether we detected this is overriding/replacing a previous setting
   - In a .env where just appending will override, we should say so and not try to comment out the previous setting (though note in the file that this could be done, maybe?); the idea is to create rules that are additive to prevent the worst of race conditions

By default Option A is fine, but the above machinery prepares some level of automation, and this can be mediated by a setting.

---

### QST-SETTINGS-LOCAL: When does keyhole write to Claude Code's `.claude/settings.local.json`?
- Status: answered
- Why asking: A variable there is handed to every command the model's tools run, which is what makes it useful (an MCP server or a script can use it without the person exporting it) and also what makes it the easiest place for a model to read it by accident. `.env` is read only by what loads it.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — only when the request or the person asks for it, per variable**: the default target is `.env`; the link or the command can name `settings.local.json` too, and the masked box says so before the person types.
- **B — a setting, off by default**: one switch makes every write also go to `settings.local.json`.
- **C — always both**: every variable lands in both files.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**A — per variable, when asked.** *Rationale*: the threat model is about the conversation, and `settings.local.json` is the one target that puts a value within a model's reach on every command; choosing it should be visible at the moment the person types, for that one variable. B hides the choice in a setting nobody revisits; C spreads every secret to the most exposed place. *Confidence*: 0.7 — because some services (MCP servers) need the value in the harness's environment, and A makes those a little more work. *If wrong*: if most requests turn out to need the harness's environment, B with the masked box still naming the target.

**ANS:** (by Jérémie Lumbroso)
Option A (on request) and Option B (a setting, off by default, with allowlist and/or blocklist). The scenario is, for instance, the human-AI collaboration template A would probably want to vet a broad range of MCP servers with specific tokens, etc., and pre-vet the configuration of these for streamlined purposes, maybe?

---

### QST-FINGERPRINT: How does keyhole's log show which key it wrote, without any of the key entering the conversation?
- Status: answered
- Why asking: Jérémie's answer to QST-COLLISION asks for a log of every probe and change, readable by models and humans, with a way to recognize a key, for instance `<OBKEY:a****4/>` (the first and last characters, starred between). The log is exactly what a model reads to learn the outcome, so whatever the log shows of a key enters the conversation; the first law says none of the secret should. The question is what lets a person or a model tell "is this the same key as before?" without giving away a character of it.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — first and last characters**: `<OBKEY:a****4/>`. Easy to compare by eye against the service's page, which often shows the last four characters. Two characters of the secret enter the log, and so the conversation.
- **B — the public prefix and a short hash**: `<OBKEY:ghp_…#3fa7a3c1/>`. The prefix (`ghp_`, `github_pat_`, `sk-ant-`) is the same for every token of that kind, so it is not secret, and comes from the service card; the eight characters after `#` are the start of a SHA-256 of the value, which identifies the key without revealing any of it. Comparing with the service's page needs keyhole (a "check this key" action), not the eye.
- **C — the length only**: `<OBKEY:len=40/>`. Reveals nothing; distinguishes keys only when their lengths differ.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**B — the public prefix and a short hash.** *Rationale*: it keeps what A is for (recognizing the same key across log lines, and across rotations: a new hash means a new key) while honoring the first law to the character; the prefix also tells a novice and a model which service the key belongs to. Thirty-two bits of a hash of a forty-character random token reveal nothing usable about it. *Confidence*: 0.75 — because matching against a service's "ends in …4f2a" display is a real convenience A gives and B does not. *If wrong*: if the person mostly needs to match keys against the service's page, A with the last four characters only, shown to the person in VS Code and never written to the log.

**ANS:** (by Jérémie Lumbroso)
Yes, Option B is a great idea. And just to clarify, `<OBKEY:.../>` is a "format" to OBfuscate the VALUE of the KEY, not its name. Thanks for refining this idea. And my terminology is provisional obviously pending naming review.

---

## Decision

### Chosen (2026-10-20, from Jérémie's answers): the person's path first, every part modular; probe, log, append; `settings.local.json` on request or by a vetted list

- **Build order (QST-BUILD-ORDER, A)**: the person's path first, then the link, the cards and the harness targets, one release each; *"Everything should be modularly designed."*
- **An existing value (QST-COLLISION, A by default)**, with four principles from his answer:
  1. **Keyhole probes, because it can.** It checks what a model cannot: is the variable in the environment already, in `.env`, under `env` in `settings.local.json`, in each target; before and after every change.
  2. **A log of every probe and change**, for both models and humans to read, so what happened when is never guessed. How a key is identified in it is QST-FINGERPRINT.
  3. **Edits are additive.** Append where the format allows; where it does not, a format-preserving editor (for JSON, VS Code's own `jsonc-parser` `modify`, which keeps comments and layout); each change carries a standard comment: written by keyhole and its version, when, why, and whether it overrides an earlier value. In `.env`, where an appended line overrides an earlier one, keyhole says so in its comment and does not comment out the old line (it notes that this could be done), so concurrent writers never undo each other.
  4. **More automation is a setting**, off by default.
- **The key in the log (QST-FINGERPRINT, B)**: the token's public prefix, from its service card, and the first eight characters of a SHA-256 of the value, provisionally `<OBKEY:ghp_…#3fa7a3c1/>`; no character of the secret is written anywhere a model reads. The marker obfuscates the *value*, never the variable's name, which the log shows in full. Its name waits for the naming review.
- **Two facts that settle the edit rules (Surveyor 5.1, read and run, 2026-10-20)**: appending to `.env` is safe as the default, since in all five common loaders the last line wins and none warns about a repeated name; and a comment in `settings.local.json` makes Claude Code treat the whole file as invalid (shown with `claude doctor`), so keyhole's standard comment goes in `.env` as a `#` line and, for JSON targets, in keyhole's log only.
- **`settings.local.json` (QST-SETTINGS-LOCAL, A and B)**: on request per variable, and a setting, off by default, with an allowlist and/or blocklist of variable names. His scenario: a project such as the human-AI collaboration template vets a set of MCP servers and their tokens and ships that list, so a novice's setup is streamlined and nothing outside the list reaches the harness's environment.

**The harness targets, after Surveyor's reading** (`docs/reviews/2026-10-20-other-harnesses-environment-files.md`): there is no common file. Gemini CLI auto-loads the project `.env`; Codex CLI reads a TOML `[shell_environment_policy] set` table from the project's `.codex/config.toml`; xAI's Grok Build reads that table only from `~/.grok/config.toml`, in the home folder, outside git. A plain `.env` reaches a model's commands only under Gemini; under Codex and Grok only programs that load it themselves see it, which the README must say. Every harness can strip token-named variables from the commands it runs, by a setting the person may have on, so a target reports "written, but this harness strips it" when it can tell. Every harness ignores project files until the folder is trusted, so the result line distinguishes *written* from *in effect*. Three quoting dialects (JSON, TOML, shell); a target module records the harness version it was read against.

Settled regardless, from the Thread: the first law (never through the conversation, stated as such); no read-back of a value by any route; refused dangerous names; git's own checks, failing closed; atomic `.env` writes with mode `0600`; the outcome observable without the value; every user-facing name through the naming review before release; the manual teaches the permission rules that stop accidental reads.

---

## Action Items

- [x] Answer QST-BUILD-ORDER, QST-COLLISION, QST-SETTINGS-LOCAL — Owner: Jérémie (2026-10-20: A; A with four principles; A and B)
- [x] Answer QST-FINGERPRINT — Owner: Jérémie (2026-10-20: B; `<OBKEY:…/>` obfuscates the value, not the name; the term is provisional)
- [ ] Name the log's value marker (provisionally `<OBKEY:…/>`) and the log's other user-facing words before the first release — Owner: the naming review
- [x] Read how the common `.env` loaders treat a name that appears twice (Node `dotenv`, `python-dotenv`, Docker Compose `env_file`, direnv and `source`, Gemini CLI's loader): which line wins, and which warn or refuse; this decides whether appending is safe as the default — Owner: Surveyor 5.1, read only (2026-10-20: all five take the last line, none warns; the real collision is a name already in the process environment, which three of the five prefer to the file; `docs/reviews/2026-10-20-env-loaders-duplicates-and-settings-comments.md`)
- [x] Read whether Claude Code accepts comments in `settings.local.json`; if not, keyhole's standard comment lives in its log only — Owner: Surveyor 5.1, read only (2026-10-20: no; "strict JSON", and Claude Code 2.1.304 marks a commented file "Invalid or malformed JSON", after which the whole file is out of effect; the comment lives in the log; same report)
- [ ] The full collision check on `keyhole` before the Marketplace ID is minted — Owner: the naming review
- [x] The manual's chapter on keeping a model from reading `.env` by accident (permission rules per harness, starting with Claude Code's `permissions.deny`) — Owner: Sounder 6 (Jérémie, 2026-10-20). Delivered by Sounder 6 (GPT-6 Astra), 2026-10-20: [chapter source](../manual/keeping-secrets-out-of-the-conversation.md), covering Claude Code, Codex, Gemini CLI, and Grok Build. Vendor documentation/source checked; recipes not yet exercised in live harnesses, and no manual site deployed.
- [x] Read the environment-file conventions of the next harnesses (OpenAI Codex, Google Gemini CLI, xAI Grok) in their own documentation: which file, in the project or the home folder, what shape, how a change takes effect — Owner: Surveyor 5.1, read only (done early, 2026-10-20: `docs/reviews/2026-10-20-other-harnesses-environment-files.md`; Gemini has no harness file and auto-loads `.env`, Codex takes `[shell_environment_policy] set` in the project, Grok Build takes it in the home folder only; the order of building stays Jérémie's)
- [x] Scaffold the extension from porthole's (Vite, Vitest with a mocked `vscode`, the gate's checks including the secret scan) once QST-BUILD-ORDER is answered — Owner: Glazier (2026-10-20: built, with the `Secret` type and its boundary test; gate green, 8 tests, each guard caught by a deliberate break)
- [ ] Decide how keyhole asks git (VS Code's Git extension API, or running `git` itself, which lifts the package check's ban on `child_process` for git alone) — Owner: Glazier, as a question with the first feature

---

## Iterations

### Iteration 1 (2026-10-20)
- Trigger: the seed and Jérémie's instruction to found the repository
- Contributors: Jérémie Lumbroso; Grok 3.7; the naming review; the template lane; Glazier 5.5 (Claude Opus 5.5)
- Changes: initial draft
- Outcome: `Draft`

### Iteration 2 (2026-10-20)
- Trigger: Jérémie answered the three questions; Surveyor 5.1 read the other harnesses' environment files
- Contributors: Jérémie Lumbroso, Surveyor 5.1, Glazier 5.5 (Claude Opus 5.5)
- Changes: Decision filled; QST-FINGERPRINT added (the log's key identifier against the first law); two reading items for Surveyor
- Outcome: `Draft → Accepted`; one question open

### Iteration 3 (2026-10-20)
- Trigger: Jérémie answered QST-FINGERPRINT (B); Surveyor 5.1 read the `.env` loaders and tested comments in `settings.local.json`
- Contributors: Jérémie Lumbroso, Surveyor 5.1, Glazier 5.5 (Claude Opus 5.5)
- Changes: the log's key marker decided; the edit rules settled by the two findings; the marker's name sent to the naming review
- Outcome: stays `Accepted`; no question open; the scaffold is next

---

## Links

- Seed: the estate's private hub, `docs/adr/seed-2026-10-20-new-vscode-mini-extension.md`
- Twin: `jlumbroso/porthole` (`src/outsideLinks.ts`, `src/skill.ts`; ADR-0013, ADR-0016)
