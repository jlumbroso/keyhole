<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs-for-ai
  plugin: adr@adrs4ai
-->

# Accessible entry: showing the value, conformance, and a tab for many secrets

- **Date**: 2026-10-20
- **Iteration**: 1
- **Status**: Draft
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
- Status: unresolved — Surveyor reads VS Code's source first (brief 2026-10-20)
- Why asking: Jérémie asked for a visible/not-visible toggle on the box where a secret is typed, for accessibility. Keyhole uses `vscode.window.showInputBox({ password: true })` today, which has no toggle. Whether one can be built depends on VS Code's API at the floor, 1.134.0: `createInputBox()` gives a box whose `password` property and title-bar `buttons` can be changed while it is open, but whether flipping `password` re-renders the typed text in place, and what a screen reader announces, is a source question.
- Need: pick a letter (or override — any shape answers), once the source reading is in

Options:
- **A — an eye button on the box**: `createInputBox()` with a button (the eye icon) that flips `password` while the box stays open; the value is shown only on the person's screen, never in the log.
- **B — show the length and the ends, live**: the box stays masked, and its prompt line updates as you type ("40 characters, ends in …f9c2"); depends on QST-KEYPRINT-LEGIBLE's answer for how much may show.
- **C — only in the tab**: the palette box stays as it is; the entry tab (QST-ENTRY-TAB) has a standard show/hide control.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**A — an eye button on the box**, pending the source reading. *Rationale*: it is what people know from every password field, and it keeps the quick route accessible rather than sending people elsewhere. *Confidence*: 0.5 — because I have not read whether VS Code re-renders a changed `password` on an open box. *If wrong*: C, if the API cannot flip it in place; B as a complement either way.

**ANS:** (by Jérémie Lumbroso)
[Fill this in]   <!-- literal placeholder — parser-significant, do not paraphrase -->

---

### QST-A11Y-TARGET: Which accessibility standard does Keyhole conform to, and how is it checked?
- Status: unresolved — Sounder researches first (brief 2026-10-20)
- Why asking: Jérémie: "research accessibility compliance so we are comprehensive". A claim of accessibility needs a named target and a way to check it. The research should say which WCAG 2.2 criteria apply to Keyhole's surfaces (the masked box, the modal questions, the notices, a future webview tab), which VS Code already satisfies for extensions, and which Keyhole must satisfy itself, with a check for each (a screen reader on macOS, keyboard only, high contrast, zoom).
- Need: pick a letter (or override — any shape answers), once the research is in

Options:
- **A — WCAG 2.2 AA, criterion by criterion**: a table of every criterion that applies, who satisfies it (VS Code or Keyhole), and its check; checks become hand checks before each release that changes a surface.
- **B — VS Code's own accessibility practices only**: follow what VS Code documents for extension authors, without a WCAG mapping.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**A — WCAG 2.2 AA, criterion by criterion.** *Rationale*: "comprehensive" is Jérémie's word, and a named standard is what lets a person who relies on it trust the claim; VS Code's practices become the column that says which criteria VS Code already meets. *Confidence*: 0.7 — because the research may show most criteria are VS Code's, which would make A mostly a table of "VS Code does this". *If wrong*: B, if the research finds no criterion Keyhole itself controls.

**ANS:** (by Jérémie Lumbroso)
[Fill this in]   <!-- literal placeholder — parser-significant, do not paraphrase -->

---

### QST-ENTRY-TAB: What is the entry tab, and where does it go in the build order?
- Status: unresolved — after QST-SHOW-VALUE's source reading and QST-A11Y-TARGET's research
- Why asking: Jérémie proposed "a full tab that allows for entry, and maybe has some bells and whistles, like mass entry, for instance from copy-paste". The tab is a larger value path than the box (see the doubts above: a webview, never a text editor; the value wrapped at the message boundary; nothing kept by the page), so its shape and its place in ADR-0001's build order are decided together, once the research says what accessibility requires of it.
- Need: pick a letter (or override — any shape answers), once the research is in

Options:
- **A — a webview form, one variable at a time, next release**: labels, the "why" written in full, a show/hide control, and the same git checks; built right after the link.
- **B — A plus mass entry**: a paste area that takes `NAME=value` lines, shows each name with its length and keyprint (never the value), refuses the names the box refuses, and writes them in one append.
- **C — later**: the palette box, made accessible by QST-SHOW-VALUE, until the cards and targets are built.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-20)
**B — A plus mass entry**, as a stable form of its own after the link. *Rationale*: mass entry is where a tab earns its place over the box (a novice moving a project's tokens to `.env` has several at once), and the line parser is small next to the webview boundary, which both need. *Confidence*: 0.5 — because the cost of a secure webview is not yet read. *If wrong*: A, if mass entry's parser needs its own review; C, if the research shows the box alone can meet the target.

**ANS:** (by Jérémie Lumbroso)
[Fill this in]   <!-- literal placeholder — parser-significant, do not paraphrase -->

---

## Decision

Not yet: research first (Action Items).

---

## Action Items

- [ ] Read in VS Code's source at 1.134.0 and 1.141.0: whether an open `InputBox`'s `password` can be flipped in place, what a screen reader announces in a password box, whether hot exit backs up untitled editors to disk, and what a webview's content is visible to — Owner: Surveyor 5.1
- [ ] Research WCAG 2.2 AA against Keyhole's surfaces, with VS Code's guarantees for extensions, as a table of criterion, who satisfies it, and its check — Owner: Sounder 6
- [ ] Answer QST-SHOW-VALUE, QST-A11Y-TARGET, QST-ENTRY-TAB with the findings — Owner: Jérémie

---

## Iterations

### Iteration 1 (2026-10-20)
- Trigger: Jérémie's remarks on ADR-0002's hand check
- Contributors: Jérémie Lumbroso, Glazier 5.5 (Claude Opus 5.5)
- Changes: the three threads, the doubts (webview, never a text editor), three questions waiting on research
- Outcome: `Draft`

---

## Links

- The hand check that opened this: [ADR-0002](0002-the-persons-path-setting-a-secret-in-env.md), QST-CHECK-PERSON-PATH
- Build order: [ADR-0001](0001-keyhole-founding-design-from-the-seed.md), QST-BUILD-ORDER
- Code: `src/setSecret.ts` (the box), `src/secret.ts` (the `Secret` type), `src/names.ts` (refused names)
