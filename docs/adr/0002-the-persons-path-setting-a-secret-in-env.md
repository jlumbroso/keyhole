<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs-for-ai
  plugin: adr@adrs4ai
-->

# The person's path: setting a secret in `.env`

- **Date**: 2026-10-20
- **Iteration**: 1
- **Status**: Partially Implemented
- **Deciders**: Jérémie Lumbroso; Glazier 5.5 (Claude Opus 5.5); Surveyor 5.1 (the git route); the naming review (every word)

**TL;DR**: The first feature, built and tested against a mocked VS Code and installed locally: a command takes a variable's name, checks with git that `.env` stays out of commits, takes the value in a masked box, appends it after a comment, and verifies it; git is asked through VS Code's own Git extension, so keyhole starts no process; it waits on the naming review's words and a hand check.

---

## Originating Context

**Source**: ADR-0001's build order (QST-BUILD-ORDER, A: the person's path first, everything modular), and the crew's assignments of 2026-10-20 (`docs/inbox/2026-10-20-1636-glazier-to-crew-keyhole-work-forward-assignments.md`).

**Agency Grant**: build it; route the words; check it by hand before any release.

---

## Explicitation

**What the command does, in order** (`src/setSecret.ts`):
1. Picks the workspace folder (asks which, when there are several).
2. Asks for the variable's name, refusing names that would run code or that harnesses drop (`src/names.ts`: `NODE_OPTIONS`, `PATH`, `LD_PRELOAD`, `DYLD_*`, `HOME`, `XDG_*`, …).
3. Asks git about `.env`: tracked → refuses and says how to stop tracking it; not ignored → offers to add `.env` to `.gitignore`, then asks git again; no repository → writes, and says so in the log; git cannot be asked → refuses, naming why.
4. Probes `.env` for the name: if it is set, shows its fingerprint and length and asks before replacing it (QST-COLLISION, A: an explicit ask, never silent).
5. Takes the value in a **masked box that stays open while the person is away** minting the token (`password: true`, `ignoreFocusOut: true`).
6. Quotes it so every common loader reads it back unchanged, or refuses (a value on several lines; one that cannot be written safely on one line).
7. **Appends** it after a `#` comment (keyhole's version, the time, what it replaces), atomically, in a new file readable by its owner only (`src/targets/dotenv.ts`).
8. Probes again, compares fingerprints, and tells the person "Keyhole set NAME in folder/.env (N characters)", or that the read-back did not match.

Every step is logged; no log line, notice or question carries the value (a test plays the whole path and looks for any eight characters of it, and a deliberate leak is caught). The value's only route is the masked box to the file, and only `src/targets/dotenv.ts` may unwrap it (the boundary test).

**The git route, decided (Surveyor 5.1, `docs/reviews/2026-10-20-git-route-the-built-in-api.md`)**: VS Code's built-in Git extension API, present unchanged from the 1.134.0 floor to 1.141.0: *tracked* from the index (`getObjectDetails('', path)`, which rejects with `UnknownPath` for an untracked path), *ignored* from `checkIgnore`, in that order, since git reports a tracked file as not ignored. A repository VS Code has not opened is opened (it then appears in Source Control); a disabled Git extension, `git.enabled: false`, an unreadable index, or an extension that never finishes starting are refused with the reason (`src/gitApi.ts`). **Keyhole starts no process of its own**, so the package check's ban on `child_process` stays whole: the decision ADR-0001's action item asked for, without lifting anything. The undocumented part (the empty treeish reads the index) is pinned by the tests.

**Built**: 30 tests, gate green, CI green (Purser 5.5, `.github/workflows/ci.yml`); installed locally as `jlumbroso.keyhole@0.0.1`, unpublished.

**Confirm**: the naming review, then Jérémie, through the questions below.

---

## Questions

### QST-NAME-PERSON-PATH: Are the words of the person's path right?
- Status: answered
- Why asking: Every word below is something a person reads, and the command's id is permanent once published. As built, all provisional:
  - the command: **Keyhole: Set a Secret in .env…** (`keyhole.setSecret`)
  - the name box: "Name of the variable to set (for example NEON_API_KEY)"; its refusals: "use capital letters, digits and underscores, starting with a letter (for example NEON_API_KEY)" and "{NAME} changes how programs run, so a value for it could run code in every later session; keyhole does not write it"
  - the value box: "Paste the value of {NAME}. It is written to {folder}/.env and nowhere else."
  - tracked: "Keyhole did not write {folder}/.env: git tracks it, so a secret written there would go into the next commit. Stop tracking it first (git rm --cached .env), then add it to .gitignore."
  - not ignored (a question): "{folder}/.env is not ignored by git, so a "git add ." would put your secrets in the next commit. Add it to .gitignore?", button **Add to .gitignore**; the line it adds: `# Secrets stay out of git (added by Keyhole {version})`
  - already set (a question): "{NAME} is already set in {folder}/.env ({marker}, N characters). Replace it?", detail "The new value is added after the old one, which stays in the file; loaders use the last.", button **Replace It**
  - done: "Keyhole set {NAME} in {folder}/.env (N characters)."
  - the comment line in `.env`: `# Keyhole {version} · {time} · set {NAME} (replaces the value on line L)`
  - the value marker in the log: `<OBKEY:{prefix}…#{hash}/>` (QST-FINGERPRINT's form; its name was left to this review)
- Need: pick a letter (or override — any shape answers), or rule each line

Options:
- **A — as built**: every line ships as it is.
- **B — the review's words**: the review rules line by line.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**B — the review's words.** *Rationale*: by the house's rule that a key or a verb asserts states, "Set" may be right (the command ensures a value is set), but "Replace It" over a value the person already has names an act on their property, the review's own concern in porthole's "has local edits" ruling; and `OBKEY` was always a placeholder. *Confidence*: 0.7 — because these are words. *If wrong*: A, if the review finds them right.

**Recommendation**: (by the naming review, 2026-10-20 — hub ledger №109)

**B — with one real catch, one strike, and the rest blessed as built.**

1. **"Set" is CONFIRMED — Glazier's doubt resolves in its favor.** It is the env-var register's own verb (`export`/`set`), it asserts a destination, and the command's second-run behavior (find, ask, never silently overwrite) is exactly what a careful "set" means. `keyhole.setSecret` ships.
2. **The catch: "Replace It" borrowed the wrong sibling's verb.** Porthole's Replace It *discards* an edited file — there, the verb is true and the cost line was the fix. Keyhole's mechanics are the opposite: *the old value stays in the file; loaders use the last* — nothing is destroyed. So the detail line refuses the button's own verb, which is the betrayal pattern on a two-line surface. Ruled wording — question: *"{NAME} is already set in {folder}/.env ({marker}, N characters). **Set a new value?** The old line stays in the file (loaders use the last); Keyhole marks it superseded."* Button: **Set New Value** — it repeats the command's own verb, names the act truly, and dissolves the property concern at the root: nothing of the person's is removed, and now the words say so. The `.env` comment follows: "…set {NAME} **(supersedes line L)**" — *supersede* is the precise verb for shadow-without-removal; *replaces* claims a deletion that never happens.
3. **The marker is struck: `keyprint`** — form `<keyprint:{prefix}…#{hash}/>`, lowercase (an inline tag, not a shout). The register already owns the concept: an SSH *key fingerprint* is exactly a prefix-plus-hash non-revealing identifier, and `keyprint` compounds the product and the register in one self-evident word — a stranger in a log reads "a fingerprint of a key" on sight. `OBKEY` retires as the placeholder it was.
4. **Blessed as built, by name**: *"It is written to {folder}/.env and nowhere else"* — the whole product in three words; keep it verbatim forever. The dangerous-variable refusal (mechanism + consequence + the tool's firm "does not write it") is the best-worded guard in either sibling. The tracked-file refusal teaches its exact remedy (`git rm --cached`), porthole's zero-teaching-debt standard upheld. The done notice's "(N characters)" confirms without echoing — quietly excellent.
5. One consistency grain: "keyhole does not write it" → **"Keyhole does not write it"** — the product capitalizes in prose everywhere else.

*Confidence*: 0.8. *If wrong*: all words here are release-mutable except `keyhole.setSecret` (confirmed) and the marker form in logs people may parse — and `keyprint` is the one to get right now, which is why it got the full race.

**ANS:** (by Jérémie Lumbroso)
Approving Option B with the naming review's recommendation and explicit catch, gratefully — thank you to the naming review! Also confirming the deployed pilot works as described, and I made my first test, with led to the following in the `.env`:
```
# Keyhole 0.0.1 · 2026-10-20T16:56:07.269Z · set NEON_API_KEY
NEON_API_KEY=test_neon_api_key
```

---

### QST-CHECK-PERSON-PATH: Does setting a secret work in a real VS Code, with git, and does the box survive you leaving it?
- Status: unanswered
- Why asking: **What this finds out.** The path passes 30 tests against a mocked VS Code, but four links have never run: that VS Code's Git extension answers "not ignored" and then "protected" for a real repository through the API; that the masked box stays open while you switch to another app; that the file lands as designed (a comment line, then the value, readable by you only); and that a second run finds the value and asks before replacing it. Only a real VS Code shows these. **Safe**: it runs in a throwaway repository staged for this check, with a value that is not a secret; **never paste a real token in a check.** Keyhole 0.0.1 is installed in your VS Code, not published.
- Need: pick a letter (or override — any shape answers). About four minutes.

**Where to do this.** A new VS Code window on the throwaway repository. Open it from any terminal with:
`code --new-window /private/tmp/claude-501/-Users-jlumbroso-Programming-porthole/97e4570b-75ad-4694-9ae2-dcdd69dcaf36/scratchpad/keyhole-check`
Its title bar ends with `keyhole-check`. It holds a `README.md` and a `.gitignore` that does **not** ignore `.env`, on purpose. Not in your porthole or keyhole windows.

**Steps.** One action each.

1. **Run the command.** In the keyhole-check window press **Shift+Cmd+P**, type `Keyhole: Set a Secret`, press **Enter**. A box asks for the variable's name. Type `KEYHOLE_CHECK_VALUE` and press **Enter**.
2. **Answer the .gitignore question.** A question says `keyhole-check/.env` is not ignored by git and offers **Add to .gitignore**. Click it.
3. **Leave, then come back.** A masked box asks for the value of `KEYHOLE_CHECK_VALUE`. Before typing, switch to another app (Cmd+Tab) for a few seconds, then come back. **The box should still be open.**
4. **Type a value that is not a secret.** Type `not-a-real-token-123` (it shows as dots) and press **Enter**. A notice should say **"Keyhole set KEYHOLE_CHECK_VALUE in keyhole-check/.env (20 characters)."**
5. **Look at the files.** In the Explorer (**Shift+Cmd+E**), open `.gitignore`: its last lines should be a comment `# Secrets stay out of git (added by Keyhole 0.0.1)` and `.env`. Open `.env`: a comment line beginning `# Keyhole 0.0.1 ·` and then `KEYHOLE_CHECK_VALUE=not-a-real-token-123`. Its icon or name in the Explorer should look dimmed (git ignores it).
6. **Run it again, same name.** Repeat step 1 with `KEYHOLE_CHECK_VALUE`. A question should say it **is already set** (with a marker like `<OBKEY:…#1a2b3c4d/>` and "20 characters") and offer **Replace It**. Click **Cancel**. `.env` should be unchanged.
7. **Tidy up.** Close the window. I delete the folder afterwards, and read Keyhole's log myself.

Options:
- **A — all as described.**
- **B — step 2 did not appear**, or a notice said git could not be asked (give its words).
- **C — the box closed in step 3.**
- **D — the file in step 5 differs** (say how: no comment line, the value missing, or not dimmed).
- **E — something else**: say what you saw.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**A** (a prediction). *Rationale*: the Git extension's members are read in source at both tags, and the order and failure codes are pinned by tests; `ignoreFocusOut` is read in VS Code's source as the only thing the box's blur handler consults (Surveyor, ADR-0001); the file format is tested on real folders. *Confidence*: 0.65 — because the Git extension has never been driven by keyhole in a real window, and step 2's "ask git again" depends on the extension seeing the new `.gitignore` line at once. *If wrong*: B means the API is reached differently in a real install (the log will say which step); C would contradict the source reading of `ignoreFocusOut`; D means the target writes differently from its tests (a regression test first); a "still not ignored" after step 2 means the Git extension caches ignore rules, and keyhole should wait for its repository state to change before asking again.

**ANS:** (by Jérémie Lumbroso)
[Fill this in]   <!-- literal placeholder — parser-significant, do not paraphrase -->

---

## Decision

### Chosen: as built, pending the two questions

The git route is decided (above): VS Code's Git extension API, no process of keyhole's own.

---

## Action Items

- [x] Build the person's path, with tests — Owner: Glazier (2026-10-20, `1c6f528`, `a89cec5`)
- [x] Read the git route in source — Owner: Surveyor 5.1 (2026-10-20)
- [x] CI — Owner: Purser 5.5 (2026-10-20, `a57ba55`)
- [ ] Rule on the words (QST-NAME-PERSON-PATH) — Owner: the naming review, then Jérémie
- [ ] Run the check (QST-CHECK-PERSON-PATH) — Owner: Jérémie
- [ ] Delete the throwaway check folder afterwards — Owner: Glazier

---

## Iterations

### Iteration 1 (2026-10-20)
- Trigger: ADR-0001's build order; the crew's assignments
- Contributors: Glazier 5.5 (Claude Opus 5.5), Surveyor 5.1, Purser 5.5
- Changes: built, tested, installed locally
- Outcome: `Partially Implemented`

---

## Links

- Founding design: [ADR-0001](0001-keyhole-founding-design-from-the-seed.md)
- Code: `src/setSecret.ts`, `src/targets/dotenv.ts`, `src/gitApi.ts`, `src/names.ts`, `src/secret.ts`
