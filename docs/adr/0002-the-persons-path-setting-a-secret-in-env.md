<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs-for-ai
  plugin: adr@adrs4ai
-->

# The person's path: setting a secret in `.env`

- **Date**: 2026-10-20
- **Iteration**: 3
- **Status**: Partially Implemented
- **Deciders**: Jérémie Lumbroso; Glazier 5.5 (Claude Opus 5.5); Surveyor 5.1 (the git route); the naming review (every word)

**TL;DR**: The first feature, built and tested against a mocked VS Code and installed locally: a command takes a variable's name, checks with git that `.env` stays out of commits, takes the value in a masked box, appends it after a comment, and verifies it; git is asked through VS Code's own Git extension, so keyhole starts no process; its words are the naming review's (approved 2026-10-20), and Jérémie's hand check passed in a real VS Code; before the first release, every question says what it recommends and why, and the keyprint becomes legible.

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
4. Probes `.env` for the name: if it is set, shows its keyprint and length and asks before setting a new value; the old line stays (QST-COLLISION, A: an explicit ask, never silent).
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
- Status: answered
- Why asking: **What this finds out.** The path passes 30 tests against a mocked VS Code, but four links have never run: that VS Code's Git extension answers "not ignored" and then "protected" for a real repository through the API; that the masked box stays open while you switch to another app; that the file lands as designed (a comment line, then the value, readable by you only); and that a second run finds the value and asks before setting a new one. Only a real VS Code shows these. **Safe**: it runs in a throwaway repository staged for this check, with a value that is not a secret; **never paste a real token in a check.** Keyhole 0.0.1 is installed in your VS Code, not published.
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
6. **Run it again, same name.** Repeat step 1 with `KEYHOLE_CHECK_VALUE`. A question should say it **is already set** (with a marker like `<keyprint:…#1a2b3c4d/>` and "20 characters") and ask **"Set a new value?"**, offering **Set New Value**. Click **Cancel**. `.env` should be unchanged. *(Step updated 2026-10-20 for the naming review's words, now in the installed build; reload any VS Code window opened before 6:12 PM, or open the window fresh.)*
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
Option A.

Remarks:
- The question modal (and our modals in general) should follow an ORRCF-like flavor. Imagine that the audience may not know about `.gitignore` or may not know why you would add `.env` in `.gitignore`, or if they do, they may know you wouldn't want to commit it, but they may not know why. So we need to use every opportunity at our disposal to provide agency to our user. Let's follow moral contractualism. So here, the message should, (a) say what is recommended, and (b) why.
- I wonder if there's a way for the password ask to have a toggle for visible or not visible — this is better, for accessibility reasons.
- Thinking about accessibility, since entry of these is *all* we do, I wonder if we should research accessibility compliance so we are comprehensive, and to start, I think we should create a mode where instead of palette entry, we do a full tab that allows for entry, and maybe has some bells and whistles, like mass entry, for instance from copy-paste, et.c
- Sorry for thinking out loud, but this testing is generative!
- The keyprint thing is not very legible, I want something a bit more useful and closer to the original value such that if the person knew original value, they'd be like "ah, yes, this is obviously derived from my value"

Screenshots:
- See: `docs/adr/attachments/screenshots/2026-10-20-testing/Screenshot 2026-10-20 at 6.53.26 PM.png`
- See: `docs/adr/attachments/screenshots/2026-10-20-testing/Screenshot 2026-10-20 at 6.53.42 PM.png`
- See: `docs/adr/attachments/screenshots/2026-10-20-testing/Screenshot 2026-10-20 at 6.53.52 PM.png`
- See: `docs/adr/attachments/screenshots/2026-10-20-testing/Screenshot 2026-10-20 at 6.54.03 PM.png`
- See: `docs/adr/attachments/screenshots/2026-10-20-testing/Screenshot 2026-10-20 at 6.54.46 PM.png`
- See: `docs/adr/attachments/screenshots/2026-10-20-testing/Screenshot 2026-10-20 at 6.58.59 PM.png`
- See: `docs/adr/attachments/screenshots/2026-10-20-testing/Screenshot 2026-10-20 at 6.59.15 PM.png`
- See: `docs/adr/attachments/screenshots/2026-10-20-testing/Screenshot 2026-10-20 at 6.59.47 PM.png`
- See: `docs/adr/attachments/screenshots/2026-10-20-testing/Screenshot 2026-10-20 at 6.59.54 PM.png`
- See: `docs/adr/attachments/screenshots/2026-10-20-testing/Screenshot 2026-10-20 at 7.02.06 PM.png`
- See: `docs/adr/attachments/screenshots/2026-10-20-testing/Screenshot 2026-10-20 at 7.02.22 PM.png`
- See: `docs/adr/attachments/screenshots/2026-10-20-testing/Screenshot 2026-10-20 at 7.02.32 PM.png`

---

### QST-MODALS-WHY: What does each of Keyhole's questions and refusals say it recommends, and why?
- Status: unanswered — routed to the naming review, then Jérémie; blocks the first release
- Why asking: Jérémie, answering QST-CHECK-PERSON-PATH (2026-10-20): *"The question modal (and our modals in general) should follow an ORRCF-like flavor. Imagine that the audience may not know about `.gitignore` or may not know why you would add `.env` in `.gitignore`, or if they do, they may know you wouldn't want to commit it, but they may not know why. So we need to use every opportunity at our disposal to provide agency to our user. Let's follow moral contractualism. So here, the message should, (a) say what is recommended, and (b) why."* That is decided; what is open is the words. A VS Code modal shows a bold **message** and a plainer **detail** under it, so the drafts put the recommendation in the message and the why in the detail. Drafts, by Glazier, for the review to rule line by line (`{folder}` is the folder's name, `{NAME}` the variable's):
  1. **Not ignored** (a question; buttons **Add to .gitignore**, **Cancel**). Now: "{folder}/.env is not ignored by git, so a "git add ." would put your secrets in the next commit. Add it to .gitignore?" Draft message: "Add .env to .gitignore first (recommended)". Draft detail: "Git does not ignore {folder}/.env yet, so a "git add ." would copy your secrets into the next commit. A commit keeps them in the project's history, where anyone who can read the repository, or any copy of it, can find them, even after the file is deleted. Keyhole adds one line to .gitignore, checks with git again, and writes nothing until .env is ignored."
  2. **Tracked** (a refusal). Now: "Keyhole did not write {folder}/.env: git tracks it, so a secret written there would go into the next commit. Stop tracking it first (git rm --cached .env), then add it to .gitignore." Draft message: "Keyhole did not write {folder}/.env: git tracks it. Recommended: stop tracking it, then ignore it." Draft detail: "Anything written to a tracked file goes into the next commit and stays in the history. "git rm --cached .env" stops tracking the file without deleting it; then add .env to .gitignore. If .env was ever committed with a real secret in it, that secret is still in the history: replace it at its service."
  3. **Already set** (a question; buttons **Set New Value**, **Cancel**; no option is recommended over the other, so the detail says when each fits). Now: message "{NAME} is already set in {folder}/.env ({keyprint}, N characters). Set a new value?", detail "The old line stays in the file (loaders use the last); Keyhole marks it superseded." Draft detail, added after the current one: "Set a new value when you have a new one, for example after replacing a token at its service. Cancel keeps the value that is there. Once the new value works, you can delete the old line yourself."
  4. **Set** (the notice). Now: "Keyhole set {NAME} in {folder}/.env (N characters)." Draft, added: "Programs read .env when they start: restart the one that needs {NAME}."
  5. **Refused names** (the dangerous-variable refusal and the format refusal): blessed as built by the review, which already gives mechanism and consequence; listed so the review can say whether either needs a "recommended" clause.
- Need: pick a letter (or override — any shape answers), or rule each line

Options:
- **A — the drafts**: every line above ships as drafted.
- **B — the review's words**: the review rules line by line, as it did for QST-NAME-PERSON-PATH.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**B — the review's words.** *Rationale*: the drafts are longer than VS Code's modal is comfortable with (its detail wraps in a narrow box, as screenshot 4 of the check shows at four lines for one sentence), and the review's last ruling showed that a better word is often the truer description of the mechanism, which is exactly what a "why" is. *Confidence*: 0.8 — because Jérémie asked for the review here. *If wrong*: A, if the review finds the drafts right as they are.

**ANS:** (by Jérémie Lumbroso)
[Fill this in]   <!-- literal placeholder — parser-significant, do not paraphrase -->

---

### QST-KEYPRINT-LEGIBLE: How should a keyprint show a value so the person recognizes it, and how much of the value may the conversation see?
- Status: unanswered
- Why asking: Jérémie, after the check (2026-10-20): *"The keyprint thing is not very legible, I want something a bit more useful and closer to the original value such that if the person knew original value, they'd be like 'ah, yes, this is obviously derived from my value'."* The keyprint the check showed was `<keyprint:…#06c47309/>`: the first eight hex digits of a SHA-256, chosen under QST-FINGERPRINT (ADR-0001, B) because it reveals none of the value. Anything a person can recognize *by eye* is made of the value's own characters, and the log is what a model reads, so this is a question about the first law, not only about words: how many characters of a secret may enter the conversation. What the services do: many dashboards show a key as its prefix and last four characters (`sk-…3f9c`), and the card industry's rules let receipts print a card's last four digits; both treat the last four of a long value as not secret. For a 40-character random token, four characters leave about 216 of its 240 bits unknown; for a 12-character password, they are a third of it.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — the hash only, as now**: `<keyprint:ghp_…#06c47309/>`. Reveals nothing. Recognizing a value needs Keyhole: a later command, "Check a value", takes a pasted value in the masked box and says whether it matches the keyprint.
- **B — the last four characters, always**: `<keyprint:ghp_…f9c2/>`. Recognizable at a glance against the service's page. Four characters of every secret enter the conversation, including short passwords.
- **C — the last four only for long values**: the last four characters when the value has at least 32 characters, so four are at most an eighth of it (most API tokens: GitHub's are 40, Neon's 64), and the hash otherwise: `<keyprint:ghp_…f9c2/>` for a token, `<keyprint:…#06c47309/>` for a short password. The log says which form it used.
- **D — the first and last characters**, the seed's first idea: `<keyprint:a…4/>`. Two characters of every value; the first is often the public prefix's, so it says little.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**C — the last four only for long values.** *Rationale*: it gives Jérémie's "ah, yes" where the person can actually compare, because the service's own page shows the same last four, and it spends only what the industry already treats as not secret (a small fraction of a long, random value), while a short password, where four characters are a real share of it, keeps the hash. *Confidence*: 0.55 — because this trades a strict reading of the first law ("none of the secret") for legibility, and that trade is Jérémie's to make, not mine. *If wrong*: A, if the first law means not one character ever, and then "Check a value" becomes the legible route; B, if a single rule matters more than the short-value case. The marker's exact form (`…f9c2`, `…f9c2#06c4`) goes to the naming review once the amount is chosen.

**Recommendation**: (by the naming review, 2026-10-20 — hub ledger №110; the AMOUNT remains the rights-holder's trade, exactly as Glazier framed it; this explains the trade and rules the form)

**C — and in the hybrid form: the hash is the constant, the last four are the conditional.**

*The trade, explained plainly.* Your "ah, yes" is a **by-eye** recognition task, and only the value's own characters can serve it — no hash ever will, because a hash is recognizable only to a machine. So the question is purely: *when is showing four of a secret's characters not a disclosure?* The honest answer is entropy, not sentiment: four characters of a 40-character random token leave ~216 of its 240 bits unknown — the services' own dashboards and the card industry's receipts already treat that as public, which is why you can *compare* those four against the service's page at all. Four characters of a 12-character password are a third of it — a real bite. **C's threshold is not a compromise of the first law; it is the first law applied with a ruler**: by-eye recognition exactly where it costs nothing, refused exactly where it would cost something. (B spends the password's third for uniformity's sake; D's two characters are the worst of both worlds — too little to recognize, and still a withdrawal; A is perfectly safe and perfectly illegible, making every recognition a round-trip through a command.)

*The form, ruled (this part is the review's lane):* **every keyprint ends in its hash; long values additionally show their last four** —

- long value (≥ 32 chars): `<keyprint:ghp_…f9c2#06c47309/>`
- short value: `<keyprint:…#06c47309/>`

Keeping the hash in *both* shapes buys the invariant that makes two shapes one contract: **a keyprint always verifies** — the future "Check a value" command works uniformly on every marker ever logged, and a reader learns one sentence: *a keyprint always ends in its hash; it shows your last four only when they are a sliver of the whole.* Dropping the hash from the long form (as C's example did) would make verifiability depend on the value's length, which is the kind of conditional contract that becomes a bug report. The prefix (`ghp_`, `sk-`) stays as-is in both — it is the service's published, deliberately public tag, and it does half the "ah, yes" work for free.

*Confidence*: 0.8 on the form; the amount is yours — if your ANS is A, the form collapses to the short shape everywhere and "Check a value" is promoted from convenience to the legibility route, which should then ship in the same release as the marker, not after it. *If wrong about the threshold*: 32 is a proxy for entropy, not a measurement — if a real service ships 32-character low-entropy tokens, the floor rises, and the log's which-form-was-used line (Glazier's, kept) is what makes that correction auditable.

**ANS:** (by Jérémie Lumbroso)
[Fill this in]   <!-- literal placeholder — parser-significant, do not paraphrase -->

---

## Decision

### Chosen: as built, in the naming review's words, proven by hand

The git route is decided (above): VS Code's Git extension API, no process of keyhole's own.

**The words (QST-NAME-PERSON-PATH, B; Jérémie, 2026-10-20)**: the naming review's ruling, line by line, built in `d7291b0`. `keyhole.setSecret` and "Set" stay. A value already set asks "Set a new value?" with **Set New Value**, and the detail "The old line stays in the file (loaders use the last); Keyhole marks it superseded.", because Keyhole destroys nothing and "Replace It" claimed it did. The `.env` comment ends "(supersedes line L)". The log names a value by its **keyprint**, `<keyprint:{prefix}…#{hash}/>` (after the SSH key fingerprint: identifies, reveals nothing); `OBKEY` retires. "Keyhole" is capitalized in prose. Blessed as built, to keep verbatim: "It is written to {folder}/.env and nowhere else."

His first use, with the installed pilot before the new words, wrote `.env` as designed: a comment line `# Keyhole 0.0.1 · {time} · set NEON_API_KEY`, then the value. That is one run of a first set, not the check (no git question, no leaving the box, no second run), so QST-CHECK-PERSON-PATH stays open.

**The hand check (QST-CHECK-PERSON-PATH, A; Jérémie, 2026-10-20, VS Code 1.141.0, twelve screenshots in `attachments/screenshots/2026-10-20-testing/`)**: all as described, and more: he also set a second value, which the check had not asked for. Keyhole's own log of that window, read by Glazier, agrees line for line: git said `not-ignored`; after **Add to .gitignore**, git said `protected` one millisecond later (18:54:20.160 → .161), which settles the prediction's one doubt: VS Code's Git extension does not cache ignore rules, so Keyhole need not wait for its repository state to change. The value was written to line 2 of a new owner-only file; the second run found it, asked, and wrote line 4 "(supersedes line 2)" with a different keyprint; a third run stopped at the masked box with no value. No log line carries a value. The person's path is proven in a real VS Code, with git.

**What the check opened**, from his remarks: the words of every question and refusal say what Keyhole recommends and why (QST-MODALS-WHY, for the naming review); a keyprint the person can recognize (QST-KEYPRINT-LEGIBLE, a first-law question); and accessible entry: a show-the-value toggle, research into accessibility conformance, and a full tab for entry with mass entry from a paste (ADR-0003). In his words: *"Sorry for thinking out loud, but this testing is generative!"*

---

## Action Items

- [x] Build the person's path, with tests — Owner: Glazier (2026-10-20, `1c6f528`, `a89cec5`)
- [x] Read the git route in source — Owner: Surveyor 5.1 (2026-10-20)
- [x] CI — Owner: Purser 5.5 (2026-10-20, `a57ba55`)
- [x] Rule on the words (QST-NAME-PERSON-PATH) — Owner: the naming review, then Jérémie (2026-10-20: B)
- [x] Build the ruled words, reinstall locally, bring the check's step 6 to them — Owner: Glazier (2026-10-20, `d7291b0`)
- [x] Run the check (QST-CHECK-PERSON-PATH) — Owner: Jérémie (2026-10-20: A)
- [x] Read Keyhole's log of the check against the answer — Owner: Glazier (2026-10-20: agrees line for line)
- [x] Delete the throwaway check folder afterwards — Owner: Glazier (2026-10-20)
- [ ] Rule on the recommend-and-why words (QST-MODALS-WHY) — Owner: the naming review, then Jérémie
- [ ] Choose how much of a value a keyprint shows (QST-KEYPRINT-LEGIBLE) — Owner: Jérémie; then its form — Owner: the naming review

---

## Iterations

### Iteration 1 (2026-10-20)
- Trigger: ADR-0001's build order; the crew's assignments
- Contributors: Glazier 5.5 (Claude Opus 5.5), Surveyor 5.1, Purser 5.5
- Changes: built, tested, installed locally
- Outcome: `Partially Implemented`

### Iteration 2 (2026-10-20)
- Trigger: the naming review's ruling and Jérémie's answer to QST-NAME-PERSON-PATH (B)
- Contributors: the naming review, Jérémie Lumbroso, Glazier 5.5 (Claude Opus 5.5)
- Changes: the ruled words in the code and tests (the three tests that pin them failed first, then were updated); `keyprint` named in ADR-0001; the check's step 6 updated; reinstalled locally
- Outcome: `Partially Implemented` (the hand check remains)

### Iteration 3 (2026-10-20)
- Trigger: Jérémie's hand check (QST-CHECK-PERSON-PATH, A) and his five remarks
- Contributors: Jérémie Lumbroso, Glazier 5.5 (Claude Opus 5.5)
- Changes: the check's result and Keyhole's log recorded; two questions opened (QST-MODALS-WHY, QST-KEYPRINT-LEGIBLE); accessible entry moved to ADR-0003; the throwaway folder deleted
- Outcome: `Partially Implemented` (proven by hand; the words and the keyprint's amount are open before the first release)

---

## Links

- Founding design: [ADR-0001](0001-keyhole-founding-design-from-the-seed.md)
- Code: `src/setSecret.ts`, `src/targets/dotenv.ts`, `src/gitApi.ts`, `src/names.ts`, `src/secret.ts`
