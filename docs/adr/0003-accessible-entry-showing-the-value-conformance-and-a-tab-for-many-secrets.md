<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs-for-ai
  plugin: adr@adrs4ai
-->

# Accessible entry: showing the value, conformance, and a tab for many secrets

- **Date**: 2026-10-20
- **Iteration**: 3
- **Status**: Partially Implemented
- **Deciders**: Jérémie Lumbroso; Glazier 5.5 (Claude Opus 5.5); Surveyor 5.1 (VS Code's source); Sounder 6 (the conformance research)

**TL;DR**: Entering a secret is all Keyhole does, so it must be accessible to everyone: a way to see what you typed, a conformance target researched rather than assumed, and a full tab for entry (many secrets at once, from a paste) beside the palette's masked box; research comes first, and the tab must never be a text editor.

---

## Originating Context

**Source**: Jérémie's answer to ADR-0002's QST-CHECK-PERSON-PATH (2026-10-20), after running the person's path by hand:

> - I wonder if there's a way for the password ask to have a toggle for visible or not visible — this is better, for accessibility reasons.
> - Thinking about accessibility, since entry of these is *all* we do, I wonder if we should research accessibility compliance so we are comprehensive, and to start, I think we should create a mode where instead of palette entry, we do a full tab that allows for entry, and maybe has some bells and whistles, like mass entry, for instance from copy-paste, et.c
> - Sorry for thinking out loud, but this testing is generative!

His other remarks from the same answer, the words of every question (recommend, then why) and a legible keyprint, are ADR-0002's QST-MODALS-WHY and QST-KEYPRINT-LEGIBLE.

**Agency Grant**: explore; research before any build.

---

## Explicitation

**What I understand**:

1. **Seeing what you typed.** A masked box shows dots. A person who cannot check what they pasted (low vision, a tremor, dyslexia, a screen reader that reads dots as "bullet") cannot tell a truncated paste from a whole one. "N characters" in the notice helps after the fact; a toggle helps before Enter.
2. **Conformance, researched.** "Accessible" should mean a named standard (WCAG 2.2 at level AA is the usual target) checked criterion by criterion against what Keyhole shows, plus what VS Code itself already guarantees for its input box and webviews, so Keyhole neither claims more than it does nor rebuilds what VS Code gives.
3. **A tab for entry.** A full editor tab with a form: room for labels and explanations (where the "why" of QST-MODALS-WHY can be written out in full), several variables at once, and pasting a block of `NAME=value` lines. The palette's box stays the quick route.

**Assumptions and doubts**:

- **The tab must be a webview, never a text document.** Text typed into an editor is visible to every extension that reads documents, and to the editor's own AI features; and VS Code's hot exit backs up unsaved editors to disk, so a value pasted into an untitled file would be written to VS Code's backup folder. A webview's content is its own. Surveyor to confirm both halves in source.
- **A webview is a bigger value path.** The value crosses from the page to the extension by a message; the `Secret` type must wrap it at that boundary, the page must not keep it (no `setState`, no retained hidden context), and the boundary test must cover the new module. Mass entry adds a parser for pasted lines, which must refuse the same names the box refuses (`src/names.ts`).
- **The build order.** ADR-0001's order is the person's path, then the link, the cards, the targets. Where accessible entry goes in it is Jérémie's choice once the research says what it costs.

**Confirm**: Jérémie, that these three threads are what he meant, and that the tab is in addition to the palette's box, not instead of it.

---

## Questions

### QST-SHOW-VALUE: How does a person see what they typed in the masked box?
- Status: answered
- Why asking: Jérémie asked for a visible/not-visible toggle on the box where a secret is typed, for accessibility. Keyhole uses `vscode.window.showInputBox({ password: true })` today, which has no toggle. Whether one can be built depends on VS Code's API at the floor, 1.134.0: `createInputBox()` gives a box whose `password` property and title-bar `buttons` can be changed while it is open, but whether flipping `password` re-renders the typed text in place, and what a screen reader announces, is a source question.
- Need: pick a letter (or override — any shape answers), once the source reading is in

Options:
- **A — an eye button on the box**: `createInputBox()` with a button (the eye icon) that flips `password` while the box stays open; the value is shown only on the person's screen, never in the log.
- **B — show the length and the ends, live**: the box stays masked, and its prompt line updates as you type ("40 characters, ends in …f9c2"); depends on QST-KEYPRINT-LEGIBLE's answer for how much may show.
- **C — only in the tab**: the palette box stays as it is; the entry tab (QST-ENTRY-TAB) has a standard show/hide control.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**A — an eye button on the box**, pending the source reading. *Rationale*: it is what people know from every password field, and it keeps the quick route accessible rather than sending people elsewhere. *Confidence*: 0.5 — because I have not read whether VS Code re-renders a changed `password` on an open box. *If wrong*: C, if the API cannot flip it in place; B as a complement either way.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20 — updated after Surveyor's reading, `docs/reviews/2026-10-20-accessible-entry-source-reads.md`; the lean stands, the confidence rises)
**A — an eye button on the box, re-masked on its own.** *Rationale*: the reading shows A works in full: `password` on an open `createInputBox()` flips the native input's `type` without rewriting the text, an `eye` / `eye-closed` button can toggle itself, and `ignoreFocusOut` behaves as today. Its one exposure is pixels: while revealed, the value is in the window for the user-triggered "Screenshot Window" chat attachment, so the box re-masks when it loses focus, when it hides, and after a short timer. B is allowed too, and screen readers announce its line, so it is the accessible complement; how much it may show is QST-KEYPRINT-LEGIBLE's answer (ADR-0002). *Confidence*: 0.75 — because the API is read at both tags, and the caret surviving the flip and what VoiceOver says are hand checks still to run. *If wrong*: C, if the hand check shows the flip loses the text or the caret; A without B, if QST-KEYPRINT-LEGIBLE allows nothing but the hash.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20 — a walk-back, after Sounder's integration brief `2026-10-20-2338-sounder-completion-accessible-entry-source-integration.md`)
**A — an eye button on the box, re-masked when the box hides or the window loses focus, with no timer.** *Rationale*: I withdraw the "short timer" in my recommendation above. A timer that hides what a person is reading is a time limit, which WCAG 2.2.1 says the person must be able to turn off, adjust or extend, and the reason for it (a "Screenshot Window" capture) needs a person's own act, which happens only while they are looking. Re-masking when the box hides, or when VS Code's window loses focus to another app, keeps that protection without timing anyone. "Losing focus" must mean the window, not moving between the box and its eye button by keyboard, which must never re-mask or move focus (Sounder's point). *Confidence*: 0.75 — as above. *If wrong*: an adjustable timer (a setting, off by default), if Jérémie wants one for shared screens.

**ANS:** (by Jérémie Lumbroso)
Yes, Option A. It would be nice if this could all be tab-able, and also I realize one of the ways we can make it easier is also in terms of cognitive load, for nothing to be "now or never" — for requests to be queued in an inbox of requests and user-initiated drafts. It would be nice to create a neat decoupling of every step of this chain from, model sending a request (presumably with a variable name, an ORRCF — i.e., why they are asking for this, where to get it, why, etc., alternatives), and the user to follow the directions and fill out the secret. But the user could also use it to add environment variables in this trusted way — in which case, they would start an empty draft, and type variable name (or select it, or has us guide them based on our records, or curation of standard environment variable names), and then get instructions from our records somewhere (on the side, collapsible?), and then the key/password, etc.. We should also allow for sequences of variables (like SMTP server + username + password for instance). Each draft/record would be deep-linkable, such that a model can: (a) reopen the extension to that draft for editing and (b) iterate with the record with ease. This part is optional, and power users might not see it, but it may help make this more easy to scaffold for new comers, who are the most targeted audience.

---

### QST-A11Y-TARGET: Which accessibility standard does Keyhole conform to, and how is it checked?
- Status: answered
- Why asking: Jérémie: "research accessibility compliance so we are comprehensive". A claim of accessibility needs a named target and a way to check it. The research should say which WCAG 2.2 criteria apply to Keyhole's surfaces (the masked box, the modal questions, the notices, a future webview tab), which VS Code already satisfies for extensions, and which Keyhole must satisfy itself, with a check for each (a screen reader on macOS, keyboard only, high contrast, zoom).
- Need: pick a letter (or override — any shape answers), once the research is in

Options:
- **A — WCAG 2.2 AA, criterion by criterion**: a table of every criterion that applies, who satisfies it (VS Code or Keyhole), and its check; checks become hand checks before each release that changes a surface.
- **B — VS Code's own accessibility practices only**: follow what VS Code documents for extension authors, without a WCAG mapping.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**A — WCAG 2.2 AA, criterion by criterion.** *Rationale*: "comprehensive" is Jérémie's word, and a named standard is what lets a person who relies on it trust the claim; VS Code's practices become the column that says which criteria VS Code already meets. *Confidence*: 0.7 — because the research may show most criteria are VS Code's, which would make A mostly a table of "VS Code does this". *If wrong*: B, if the research finds no criterion Keyhole itself controls.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20 — updated after Sounder's research; the lean stands, in Sounder's more precise words)
**A — WCAG 2.2 A and AA as the assessment target, read for desktop software through WCAG2ICT.** *Rationale*: Sounder's table finds criteria Keyhole controls itself even today (labels and purpose, error identification and correction, keyboard and focus for any new control, status messages that can be recovered), and the tab would add the page's own structure, language, contrast and reflow; so B's "VS Code's practices only" would leave real criteria unowned. WCAG2ICT is the W3C's guidance for applying WCAG to software that is not a web page; it is informative, so Keyhole says "assessed against", never "conforms", until hand checks back each row. Two of Sounder's distinctions change the design: storing a key is not authenticating, so the toggle is useful but not an AA mandate (3.3.8); and a box that survives losing focus is not by itself timing conformance: a result that vanishes and cannot be recovered also counts. *Confidence*: 0.8 — because the table was checked by independent readers, and no row has been checked live. *If wrong*: B, only if Jérémie wants the narrower claim.

**ANS:** (by Jérémie Lumbroso)
We should track both. Option A is reasonable, but we should also track VS Code's own accessibility practices as a separate column: Both so we can contextualize our choices, because some of the extra work won't matter if VS Code is not broadly compatible (as Keyhole is a small part of a much larger ecosystem), and so we can measure the extra effort. Then we should scaffold how we bring these things in.

---

### QST-ENTRY-TAB: What is the entry tab, and where does it go in the build order?
- Status: answered
- Why asking: Jérémie proposed "a full tab that allows for entry, and maybe has some bells and whistles, like mass entry, for instance from copy-paste". The tab is a larger value path than the box (see the doubts above: a webview, never a text editor; the value wrapped at the message boundary; nothing kept by the page), so its shape and its place in ADR-0001's build order are decided together, once the research says what accessibility requires of it.
- Need: pick a letter (or override — any shape answers), once the research is in

Options:
- **A — a webview form, one variable at a time, next release**: labels, the "why" written in full, a show/hide control, and the same git checks; built right after the link.
- **B — A plus mass entry**: a paste area that takes `NAME=value` lines, shows each name with its length and keyprint (never the value), refuses the names the box refuses, and writes them in one append.
- **C — later**: the palette box, made accessible by QST-SHOW-VALUE, until the cards and targets are built.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**B — A plus mass entry**, as a stable form of its own after the link. *Rationale*: mass entry is where a tab earns its place over the box (a novice moving a project's tokens to `.env` has several at once), and the line parser is small next to the webview boundary, which both need. *Confidence*: 0.5 — because the cost of a secure webview is not yet read. *If wrong*: A, if mass entry's parser needs its own review; C, if the research shows the box alone can meet the target.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20 — updated after both readings; the lean stands, the doubts are now facts)
**B — A plus mass entry, a webview, after the link.** *Rationale*: Surveyor's reading settles the surface. An untitled editor writes its text to disk in plain UTF-8 about a second after each pause, whatever `files.hotExit` says, and no API exempts a document (`workingCopyBackupTracker.ts`, both tags), so a text editor is ruled out. A webview's page is unreadable by the workbench, by other extensions and by chat tools. What remains to design around: never call `setState` with a value (it reaches the workspace's state database on disk); the window screenshot sees a visible page, so the page masks by default and re-masks as the box does; and, from Sounder, what happens when the person leaves to fetch a key from its service must be defined before building, because clearing a hidden tab forces re-entry and keeping it means holding a value in memory. *Confidence*: 0.6 — because the boundary is now read, and the interruption behavior is a design still to write. *If wrong*: A, if mass entry's parser needs its own review; C, if Jérémie prefers the box, made accessible by QST-SHOW-VALUE, until the cards and targets exist.

**ANS:** (by Jérémie Lumbroso)
Yes, Option B — and to be composed with the idea of the broader inbox possibly; this is a complementary part of a broader set of tools to help. The mass entry its role is: This is not something the transformers could help with for security reasons, so we are proposing a mechanized, automatic way of doing a simple version of structuring a mass of keys. The other proposal was to help structure the cognitive load around going around to get secrets. In particular, it helped Keyhole become the attention sorting yard, to take all instructions for how and where to go get a token. In fact, per the example we documented in screenshots for Porthole, we could have Keyhole have instructions for some platforms (like Render, Neon, etc., and maybe these instructions are in a public repo and publically editable), that can be spawned as Portholes when the model requests "The Render API key" for instance. Bringing all things together so it doesn't rely on the user having a massive amounts of executive functioning is also a way to be accessible.

---

### QST-CHECK-EYE: Can a person see what they typed, by mouse and by keyboard, and what does VoiceOver say?
- Status: unanswered
- Why asking: **What this finds out.** The eye button (QST-SHOW-VALUE, A) and the boxes' new names are built and pass 36 tests against a mocked VS Code, but three things only a real VS Code with a real screen reader shows: whether the text and the cursor survive the switch from dots to letters and back (browser behavior, Surveyor's reading); whether the eye button can be reached **by keyboard**, which you asked for ("It would be nice if this could all be tab-able"); and what VoiceOver actually announces for each box, now that they carry a title (Sounder's row for WCAG 4.1.2). It also shows the naming review's new words and the legible keyprint once. **Safe**: a throwaway repository staged for this check, a value that is not a secret, and VoiceOver turned on and off with the same keys (**Cmd+F5**); **never paste a real token in a check.** Keyhole 0.0.1, rebuilt with all of this, is installed in your VS Code.
- Need: pick a letter (or override — any shape answers), and write down what VoiceOver said at steps 2 and 4. About five minutes.

**Where to do this.** A new VS Code window on the throwaway repository. Open it from any terminal with:
`code --new-window /private/tmp/claude-501/-Users-jlumbroso-Programming-porthole/97e4570b-75ad-4694-9ae2-dcdd69dcaf36/scratchpad/keyhole-check-2`
Its title bar ends with `keyhole-check-2`. Its `.gitignore` already ignores `.env`, so no `.gitignore` question appears this time. Not in your porthole or keyhole windows.

**Before you start.** If any VS Code window was open before this message, reload it (**Shift+Cmd+P**, type `Reload Window`, press **Enter**) so the rebuilt Keyhole is the one running.

**Steps.** One action each.

1. **Turn VoiceOver on.** Press **Cmd+F5**. VoiceOver starts speaking.
2. **Run the command and listen.** In the keyhole-check-2 window press **Shift+Cmd+P**, type `Keyhole: Set a Secret`, press **Enter**. A box opens asking for the variable's name. **Write down what VoiceOver says** as it opens (it should include `Keyhole: Set a Secret in .env`, not only "input").
3. **Give the name.** Type `KEYHOLE_CHECK_LONG` and press **Enter**. A masked box opens asking for the value.
4. **Listen again.** **Write down what VoiceOver says** for the masked box, and what it says when you type the first two or three characters of the value in step 5.
5. **Type a value that is not a secret.** Type `not-a-real-token-0123456789-abcd-WXYZ` (37 characters; it shows as dots).
6. **Show it by keyboard.** Without touching the mouse, press **Tab** (once or a few times) to try to reach the eye button at the top right of the box, then press **Space** or **Enter** on it. If the keyboard cannot reach it, click it instead (hovering shows "Show the value"), and note that the keyboard could not. **The value should now be readable, and the cursor should still be at its end.**
7. **Leave, then come back.** Switch to another app (**Cmd+Tab**) for a few seconds, then come back. **The value should be dots again**, and the button's tooltip "Show the value".
8. **Set it.** Click into the box if needed and press **Enter**. A notice should say **"Keyhole set KEYHOLE_CHECK_LONG in keyhole-check-2/.env (37 characters). Programs read .env when they start: restart the one that needs KEYHOLE_CHECK_LONG."**
9. **See the keyprint.** Run the command again (step 2) with `KEYHOLE_CHECK_LONG`. The question should say it is already set, with a keyprint ending in `WXYZ#` and eight letters or digits (for example `<keyprint:…WXYZ#1a2b3c4d/>`), and the detail should end "delete the old line yourself if you like." Click **Cancel**.
10. **Tidy up.** Press **Cmd+F5** to turn VoiceOver off, and close the window. I read Keyhole's log and delete the folder afterwards.

Options:
- **A — all as described**, and the keyboard reached the eye button.
- **B — all as described, but the keyboard could not reach the eye button** (the mouse could).
- **C — the text or the cursor was lost** when the value was shown or hidden (say which).
- **D — VoiceOver said only "input"**, or nothing that names the box (write what it said).
- **E — something else**: say what you saw.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-21)
**B — all as described, but the keyboard could not reach the eye button** (a prediction). *Rationale*: the flip keeping the text is read in source at both tags (`quickInputBox.ts`, Surveyor), the blur re-mask and the names are pinned by tests, and the notice and keyprint words are tested; but I have not read whether a quick input's title-bar buttons are in the Tab order, and VS Code's own quick inputs usually reach such buttons by mouse or by a keybinding. *Confidence*: 0.45 — because the keyboard question is unread. *If wrong*: A means the button is in the Tab order and nothing changes; B, as predicted, means the keyboard route needs its own keybinding while the box is open (a `when` clause on the quick input), or the tab of QST-ENTRY-TAB; C would contradict the source reading and needs a regression test first; D means VS Code's quick input ignores the title for its label, and the prompt or a placeholder must carry the name instead.

**ANS:** (by Jérémie Lumbroso)
[Fill this in]   <!-- literal placeholder — parser-significant, do not paraphrase -->

---

## Decision

### Chosen: the eye button now; a two-column accessibility target; the entry tab composed with an inbox (ADR-0004)

**Seeing what you typed (QST-SHOW-VALUE, A; Jérémie, 2026-10-21)**, built in `912b821`: the masked box has an eye button ("Show the value" / "Hide the value", tooltips provisional until the naming review), and the value is hidden again when the box closes or VS Code's window loses focus; no timer (WCAG 2.2.1). His wish that "this could all be tab-able" is checked by QST-CHECK-EYE.

**The target (QST-A11Y-TARGET; Jérémie: "We should track both")**: WCAG 2.2 A and AA, read for desktop software through WCAG2ICT, **and** VS Code's own accessibility practices as a separate column, so each choice is seen in context: extra work Keyhole does matters little where VS Code itself is not compatible, since Keyhole is a small part of a much larger ecosystem, and the second column measures that extra effort. Then a scaffold: the order in which the criteria come in, release by release (Sounder).

**The tab (QST-ENTRY-TAB, B; Jérémie)**: a webview with mass entry, after the link, **composed with an inbox** of requests and drafts, where nothing is now-or-never. His answers to QST-SHOW-VALUE and QST-ENTRY-TAB together describe a larger design (requests from models with their reasons, drafts started by the person, sequences of variables, deep links to each draft, and service instructions shown as Portholes), which is [ADR-0004](0004-requests-and-drafts-an-inbox-for-secrets-and-instructions-shown-in-porthole.md). Mass entry's role, in his words: *"This is not something the transformers could help with for security reasons, so we are proposing a mechanized, automatic way of doing a simple version of structuring a mass of keys."*

---

## Action Items

- [x] Read in VS Code's source at 1.134.0 and 1.141.0: whether an open `InputBox`'s `password` can be flipped in place, what a screen reader announces in a password box, whether hot exit backs up untitled editors to disk, and what a webview's content is visible to — Owner: Surveyor 5.1 (2026-10-20: `docs/reviews/2026-10-20-accessible-entry-source-reads.md`; the flip works, untitled editors back up to disk continuously, a webview's page is private; what VoiceOver says is a hand check)
- [x] Research WCAG 2.2 AA against Keyhole's surfaces, with VS Code's guarantees for extensions, as a table of criterion, who satisfies it, and its check — Owner: Sounder 6 (2026-10-20: [55-criterion assessment plan](../reviews/2026-10-20-accessible-entry-wcag-22-aa.md); host mechanisms distinguished from verified outcomes, WCAG2ICT software interpretation, Keyhole-owned actions and pending hand checks. Research only; no conformance claim or live accessibility test.)
- [x] Answer QST-SHOW-VALUE, QST-A11Y-TARGET, QST-ENTRY-TAB with the findings — Owner: Jérémie (2026-10-21: A; both columns; B, composed with an inbox)
- [x] Build the eye button, re-masked on window blur, with tests (one broken on purpose to prove it) — Owner: Glazier (2026-10-21, `912b821`)
- [ ] Rule on the eye button's tooltips, "Show the value" and "Hide the value" — Owner: the naming review
- [ ] Add VS Code's own accessibility practices as a second column of the assessment, and a scaffold for bringing the criteria in, release by release — Owner: Sounder 6
- [x] Give both boxes an accessible name: they had only a `prompt`, so a screen reader heard "input" (Sounder's integration brief, from Surveyor's reading); both now carry the command's own title, "Keyhole: Set a Secret in .env", with a regression test — Owner: Glazier (2026-10-20)
- [ ] A VoiceOver hand check of the boxes: what is announced for each, and, once the eye button exists, that the text and caret survive the flip — Owner: Jérémie (posed 2026-10-21 as QST-CHECK-EYE)

---

## Iterations

### Iteration 1 (2026-10-20)
- Trigger: Jérémie's remarks on ADR-0002's hand check
- Contributors: Jérémie Lumbroso, Glazier 5.5 (Claude Opus 5.5)
- Changes: the three threads, the doubts (webview, never a text editor), three questions waiting on research
- Outcome: `Draft`

### Iteration 2 (2026-10-20)
- Trigger: Surveyor's source reading and Sounder's WCAG 2.2 assessment
- Contributors: Surveyor 5.1, Sounder 6, Glazier 5.5 (Claude Opus 5.5)
- Changes: the three questions passed to Jérémie with the findings; each recommendation restated after the research, the earlier ones kept
- Outcome: `Draft` (three questions for Jérémie)

### Iteration 3 (2026-10-21)
- Trigger: Jérémie's answers to the three questions
- Contributors: Jérémie Lumbroso, Glazier 5.5 (Claude Opus 5.5)
- Changes: the eye button built; the target set to two columns; the tab composed with an inbox, designed in ADR-0004; the hand check QST-CHECK-EYE posed
- Outcome: `Draft → Partially Implemented`

---

## Links

- The hand check that opened this: [ADR-0002](0002-the-persons-path-setting-a-secret-in-env.md), QST-CHECK-PERSON-PATH
- Build order: [ADR-0001](0001-keyhole-founding-design-from-the-seed.md), QST-BUILD-ORDER
- Code: `src/setSecret.ts` (the box), `src/secret.ts` (the `Secret` type), `src/names.ts` (refused names)
