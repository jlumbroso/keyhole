<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs-for-ai
  plugin: adr@adrs4ai
-->

# The request record and the link that creates it

- **Date**: 2026-10-21
- **Iteration**: 2
- **Status**: Accepted
- **Deciders**: Jérémie Lumbroso; Glazier 5.5 (Claude Opus 5.5); the naming review (every name); Surveyor 5.1 (Porthole's link, read)

**TL;DR**: Keyhole's second release (ADR-0004, D): a model asks for a secret by name with a `vscode://jlumbroso.keyhole/v1/…` link that never carries a value; Keyhole records the request (names, the assistant's reasons, never a value) and lists waiting requests in a Quick Pick, each opening the masked box already built; a model may also write the record directly, reads the outcome through Keyhole's API (which answers from a cache and never opens `.env`), and the record keeps `.env.example` in step.

---

## Originating Context

**Source**: ADR-0004 (accepted 2026-10-21), its decision on the order (QST-ORDER-INBOX, D: *"with the inbox as a stable form"*) and on where records live (QST-RECORD-HOME, C: the project's requests committed in the project; the person's drafts and progress private, in VS Code's storage); ADR-0001's link (*"the model's request is a `vscode://jlumbroso.keyhole/v1/…` link, porthole's proven genre"*; *"No path, link, log or reply ever carries the value"*; *"What crosses: a variable's name in, `{name, outcome, length}` out"*); Porthole's link handler, `jlumbroso/porthole` `src/outsideLinks.ts` (versioned paths, a strict query reader, a refusal that says why, and an allowlist decided on real paths).

**Agency Grant**: design the contract; build after the answers and the naming review.

---

## Explicitation

**What I understand**:

1. **The link.** `vscode://jlumbroso.keyhole/v1/request?name=NEON_API_KEY&why=…&where=…&repo=<folder>`, written by a model and opened by any terminal (`open` on macOS), as Porthole's are. `name` may repeat, in order, for a sequence (SMTP host, user, password). `why` and `where` are the assistant's words (ADR-0004, QST-MODEL-TEXT, A: shown labeled as the assistant's, any address as text, never a link). `repo` picks the workspace folder, as in Porthole.
2. **What the link refuses**, each with a reason the person reads (Porthole's rule): an unknown version or verb; any query key not on the list (so `value=`, `token=`, `secret=` and every other way of carrying a value are refused, and the refusal says why: a link passes through the conversation and the shell's history); a name `checkName` refuses (`src/names.ts`); text over a length limit; control characters.
3. **The record.** Per request: the names, in order; the assistant's `why` and `where`, as plain text; when it was made; the service, once instructions exist. Never a value, in any field; a test reads every field of every record a test run produces and fails on any value it was given.
4. **The list.** A command (provisionally **Keyhole: Show Requests**) opens a Quick Pick of the waiting requests: each item the name, and as its detail, *"Your assistant says: {why}"*. Choosing one runs today's path with the name already given: git's checks, the masked box with its eye button, the append, the verification. A request whose names are all set leaves the list. When a link arrives, a notice says a request is waiting, with a button that opens the list; nothing opens a box by itself, so nothing is now-or-never.
5. **The outcome for the model**: `{name, outcome, length, keyprint}`, never the value (ADR-0001's crossing, with the keyprint ADR-0002 made legible).

**Doubts** (the questions below):

- **The record holds nothing secret, so a model could write it directly.** If the project's requests are a file in the project, a model with file access can add a request by editing the file, with no link at all. Keyhole can watch the file. Then the file is the contract and the link is only a doorbell, which is simpler and works for models that cannot open links. But a model editing Keyhole's file is a second way in, and its text is model text all the same (QST-REQUEST-ROUTE).
- **The outcome needs a place a model can read.** ADR-0004 put the person's progress in VS Code's storage, which a model cannot read; but the model must learn that `NEON_API_KEY` is now set to "iterate with the record". A local file, ignored by git, holding only outcomes, would be readable and private to the machine (QST-OUTCOME-ROUTE).
- **Projects already have a file for this**: `.env.example`, committed, names only, read by people (Sounder's chapter recommends it). Keyhole's requests could live there, in comments, or in Keyhole's own structured file, kept in step with it (QST-REQUEST-FILE).

**Confirm**: Jérémie, the three questions; the naming review, every name above (the link's verb, its keys, the command, the files).

---

## Questions

### QST-REQUEST-ROUTE: How does a model make a request: by the link, by writing the project's request file, or both?
- Status: answered
- Why asking: In Keyhole's second release, a model asks for a secret by name (never a value). The project's requests are kept in a file in the project (ADR-0004, QST-RECORD-HOME, C), and that file holds nothing secret, so a model with file access could add a request by editing the file instead of opening Keyhole's `vscode://` link. Either way the request's reasons are the assistant's words, shown labeled as such (ADR-0004, QST-MODEL-TEXT, A).
- Need: pick a letter (or override — any shape answers)

Options:
- **A — the link only**: the file is Keyhole's to write; a model's edit to it is ignored (Keyhole notices and says so). One way in, checked in one place.
- **B — the file only, watched**: a model adds a request by editing the file; Keyhole watches it, checks each new entry as it would a link, and shows the notice. No link needed, so it works for any model that can edit files, including ones that cannot run `open`.
- **C — both: the file is the record, the link is a doorbell**: the link writes the entry for the model (so a model needs no knowledge of the format) and rings; a model that edits the file directly is also heard. Every entry is checked the same way, whichever route wrote it.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-21)
**C — both: the file is the record, the link is a doorbell.** *Rationale*: by Simon's empty world, the record is the one contract and both routes reduce to it; the check lives at the record, not at the route, so a second route adds no second check. The link keeps Porthole's genre and the skill's one-line instruction; the file keeps Keyhole usable by models and harnesses that cannot open links. *Confidence*: 0.6 — because a watched file is a new surface that can be edited by anything, though what it can hold is only names and text that is shown labeled. *If wrong*: A, if a hand check shows a model's direct edits confuse people about who asked.

**ANS:** (by Jérémie Lumbroso)
Yes, agreed with Option C. The structure is near-decomposable: Links are the doorbell that produce a record, and the file edits the record directly, is also admissible.

---

### QST-OUTCOME-ROUTE: Where does a model read whether the secret it asked for is now set?
- Status: answered
- Why asking: A model that asked for `NEON_API_KEY` must learn that it is set, its length and its keyprint, to go on with the task (ADR-0001: `{name, outcome, length}` out; never the value). ADR-0004 keeps the person's progress private, in VS Code's storage for the workspace, which a model cannot read, and the project's committed request file is shared with everyone who clones it, so a person's "set on Tuesday" does not belong there.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — a local outcomes file, ignored by git**: for example `.keyhole/outcomes.local.json`, one entry per variable (`set`, length, keyprint, when), never a value; Keyhole adds it to `.gitignore` with the same question it asks for `.env`. Readable by the model, private to the machine.
- **B — Keyhole's log only**: the model reads the log line ("wrote NEON_API_KEY … <keyprint:…>"); models reach VS Code's output panel only through the person or a log file path that changes per session.
- **C — the committed request file**: the request's entry says "set" once it is; simplest, but it publishes each person's progress to everyone who clones the project, and differs per machine.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-21)
**A — a local outcomes file, ignored by git.** *Rationale*: it is the only option both readable by the model and private to the person, which is ADR-0004's split applied to outcomes; it holds what ADR-0001 already lets cross (name, outcome, length) plus the keyprint ADR-0002 made legible, and the `.gitignore` check is code that exists and was checked by hand. *Confidence*: 0.7 — because a second ignored file is one more thing to explain to a newcomer. *If wrong*: B, if Jérémie prefers nothing new in the project beyond the request file.

**ANS:** (by Jérémie Lumbroso)
For abstraction reasons, it makes more sense for keyhole to always provide the interface for this check. Keyhole is an automated system that can open the `.env` files and check it. It can do so at any time. The idea of an outcomes file makes sense as a local cache that is maintained by Keyhole, but having models read from that file itself doesn't necessarily make sense, as the format could change, be extended, contain keys not pertaining to a specific seat, etc.. So I would say something like "Option D, an 'API' provided by Keyhole, possibly through an MCP server, and possibly using Option A as a local implementation to reduce checks in the actual files".

---

### QST-REQUEST-FILE: Which file holds a project's requests: Keyhole's own, `.env.example`, or both?
- Status: answered
- Why asking: ADR-0004 decided that the project's requests are committed in the project, as a map of the secrets it needs. Many projects already keep exactly such a map: `.env.example`, committed, names with empty or fake values, read by people and some tools; Keyhole's manual recommends one. Keyhole's records also need structure a comment line holds badly: a sequence of names, the assistant's reasons, the service.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — Keyhole's own file**: for example `.keyhole/requests.json`, structured, written and checked by Keyhole; `.env.example` untouched.
- **B — `.env.example`**: requests as names in `.env.example`, with Keyhole's reasons in comment lines above each; one file, the convention people know; Keyhole parses comments other people and tools also edit.
- **C — both, kept in step**: Keyhole's own file is the record; Keyhole offers to add each requested name to `.env.example` (the name and an empty value, with a one-line comment), so the familiar file stays right without being the record.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-21)
**C — both, kept in step.** *Rationale*: the record needs structure and one owner (A's strength, and the boundary Simon asks for), while the newcomer and every other tool already look at `.env.example` (B's strength); offering, not forcing, the `.env.example` line keeps the convention without making Keyhole parse a file it does not own. *Confidence*: 0.55 — because keeping two files in step is a known source of drift. *If wrong*: A, if the offer to edit `.env.example` reads as Keyhole overreaching; B, if one file matters more than structure.

**ANS:** (by Jérémie Lumbroso)
Agreed with Option C, and allowing useful `.env.example` would be a nice side-benefit, right now that feature is under-utilized.

---

## Decision

### Chosen: the record is the contract (link or file), an API for the outcome, and `.env.example` kept in step

**Two routes to one record (QST-REQUEST-ROUTE, C; Jérémie, 2026-10-22)**: *"The structure is near-decomposable: Links are the doorbell that produce a record, and the file edits the record directly, is also admissible."* Every entry is checked the same way at the record, whichever route wrote it: names by `checkName`, text length and control characters, and no field that could carry a value.

**The outcome through an API, not a file (QST-OUTCOME-ROUTE, D, his own option)**: *"For abstraction reasons, it makes more sense for keyhole to always provide the interface for this check. […] The idea of an outcomes file makes sense as a local cache that is maintained by Keyhole, but having models read from that file itself doesn't necessarily make sense, as the format could change, be extended, contain keys not pertaining to a specific seat, etc.. So I would say something like 'Option D, an 'API' provided by Keyhole, possibly through an MCP server, and possibly using Option A as a local implementation to reduce checks in the actual files'."* The design that follows, by Glazier:

- **Keyhole's extension keeps the cache**: a local file ignored by git (provisionally `.keyhole/outcomes.local.json`), one entry per variable Keyhole has set or been asked for: set or not, length, keyprint, when, and a schema version. It is written after every write Keyhole makes and refreshed when `.env` changes on disk (a file watcher re-probes the requested names), so a value edited by hand is seen too. It never holds a value; a test reads it after every test run that writes and fails on any value it was given.
- **The API reads only the cache, never `.env`.** A model reaches Keyhole through a small MCP server shipped inside the extension, which the model's harness starts. That process belongs to the model's side, so it must never open `.env`: it answers from the cache alone (`is NEON_API_KEY set? → {name, set, length, keyprint}`), and the only code that ever reads a value stays inside VS Code's extension host. This is Simon's empty world applied to processes: the value path does not reach the process a model launches. The cache's format can then change freely, as Jérémie wants, because models see the API, never the file.
- **Open, for Surveyor**: how each harness (Claude Code, Codex, Gemini CLI, Grok Build) registers an MCP server that lives inside a VS Code extension, whose folder carries the version in its name (the same versioned-path problem Porthole has, ADR-0004); and VS Code's own API for an extension to offer an MCP server to VS Code's chat.

**Keyhole's own file, with `.env.example` kept in step (QST-REQUEST-FILE, C)**: provisionally `.keyhole/requests.json` is the record; Keyhole offers to add each requested name to `.env.example` (the name, an empty value, a one-line comment). His note: *"allowing useful `.env.example` would be a nice side-benefit, right now that feature is under-utilized."*

**The API, as built (2026-10-22, after Surveyor's reading)**, by Glazier: one tool, provisionally `check_secret` (`name`, and an optional absolute `project` path; otherwise `CLAUDE_PROJECT_DIR`, then the server's working directory, since the protocol's current revision deprecates "roots"), answering `{name, set, length, keyprint, checked}` from the cache, and refusing any other argument with "it never takes a value". **Written by hand, without the MCP SDK**: the SDK's stdio path brings zod, ajv and their dependencies, and this server needs four JSON-RPC methods; a process on the model's side of a secrets tool should carry no code nobody here has read. **The wall is checked twice**: a test walks the server's imports and fails if they reach the value side, and the package check refuses a `dist/mcp-server.js` holding value-side code (each broken once on purpose and caught). **Reaching it**: Keyhole copies the server, once per version, to VS Code's storage folder for the extension, a path without a version in it, and **Keyhole: Connect an Assistant…** copies the user-scope line for Claude Code, Codex, Gemini CLI or Grok Build, for the person to run once (Keyhole runs nothing itself); VS Code's own chat gets it through `vscode.lm.registerMcpServerDefinitionProvider`, started from the extension folder with VS Code's own Node. **A doubt, for a hand check**: the harness lines start the server with `node`, which a person who installed their assistant with its native installer may not have on their PATH; VS Code's own Node (`process.execPath` with `ELECTRON_RUN_AS_NODE=1`) would avoid that, but its path changes with VS Code's install location.

**What is built first** (this ADR's release, ADR-0004's D): the record and its checks, the link, the list, the `.env.example` offer, and the cache; then the MCP server once Surveyor's reading says how harnesses can find it. Names are provisional until the naming review rules.

---

## Action Items

- [x] Answer QST-REQUEST-ROUTE, QST-OUTCOME-ROUTE, QST-REQUEST-FILE — Owner: Jérémie (2026-10-22: C; D, an API; C)
- [ ] Name the link's verb and keys, the list's command, the record and cache files, the MCP server and its tool — Owner: the naming review (briefed 2026-10-22)
- [x] Build the link (copied from Porthole's `outsideLinks.ts`, not shared), the record, the list, the `.env.example` offer and the cache, with tests: a link carrying any value-like key is refused; no record field ever holds a value given in a test; the list opens the built masked box with the name given — Owner: Glazier (2026-10-22, `f52ae25` on the branch `release-2-inbox`, which merges after 0.1.0 ships so that 0.1.0 stays the person's path; names provisional; 65 tests, the three new guards each broken once and caught)
- [ ] Teach models the link in Keyhole's own skill, as Porthole's skill does — Owner: Glazier, with Sounder for the manual's chapter
- [x] Read how each harness registers an MCP server shipped inside a VS Code extension (a stable path across versions), and VS Code's API for offering one to its own chat — Owner: Surveyor 5.1 (2026-10-22: `docs/reviews/2026-10-22-mcp-server-inside-an-extension.md`; user-scope stdio in all four, the project by tool parameter then `CLAUDE_PROJECT_DIR` then the working directory, a stable copy in VS Code's storage for the extension, VS Code's provider API at the floor)
- [x] Build the MCP server that answers from the cache alone, never `.env`, with a test that it opens no file but the cache — Owner: Glazier (2026-10-22, `0f5921e` on `release-2-inbox`: written by hand, no SDK; the wall checked on the sources and on the bundle; Keyhole: Connect an Assistant; VS Code's chat by its provider API; 80 tests)

---

## Iterations

### Iteration 1 (2026-10-21)
- Trigger: ADR-0004 accepted (the second release, D)
- Contributors: Glazier 5.5 (Claude Opus 5.5)
- Changes: the link, the record, the list and the outcome described; three doubts as questions
- Outcome: `Draft`

### Iteration 2 (2026-10-22)
- Trigger: Jérémie's answers (C; D, his own: an API; C)
- Contributors: Jérémie Lumbroso, Glazier 5.5 (Claude Opus 5.5)
- Changes: the decision written; the API designed to read only Keyhole's cache, so the process a model launches never opens `.env`; the MCP registration question sent to Surveyor; the names to the naming review
- Outcome: `Draft → Accepted`

---

## Links

- The inbox, its homes and its order: [ADR-0004](0004-requests-and-drafts-an-inbox-for-secrets-and-instructions-shown-in-porthole.md)
- The first law's crossing, and the link: [ADR-0001](0001-keyhole-founding-design-from-the-seed.md)
- The path a request opens: [ADR-0002](0002-the-persons-path-setting-a-secret-in-env.md); the eye button: [ADR-0003](0003-accessible-entry-showing-the-value-conformance-and-a-tab-for-many-secrets.md)
- Porthole's link, the code to copy: `jlumbroso/porthole`, `src/outsideLinks.ts`, its ADR-0013
