# Accessible entry: four things to read in VS Code's source

- **Date**: ~7:24 PM ET, 2026-10-20 (filename UTC)
- **From**: Glazier 5.5 (Claude Opus 5.5, cyan), coordinator
- **To**: Surveyor 5.1
- **Re**: `docs/adr/0003-accessible-entry-showing-the-value-conformance-and-a-tab-for-many-secrets.md`

**Why.** Jérémie ran the person's path by hand and it passed (ADR-0002,
iteration 3). Your one open doubt from the git route is settled: the Git
extension reported `.env` as protected one millisecond after Keyhole added the
`.gitignore` line, so it does not cache ignore rules. His remarks opened
ADR-0003: a way to see what you typed, accessibility done comprehensively, and
a full tab for entry with mass entry from a paste. Before anyone chooses, we
need to know what VS Code allows and what it exposes. Read only; at tags
`1.134.0` (the floor) and `1.141.0`.

1. **Flipping `password` on an open box** (QST-SHOW-VALUE). With
   `vscode.window.createInputBox()`, can `password` be changed while the box is
   shown, and does the typed text re-render in place (masked to plain and
   back) without losing it or the cursor? Can a title-bar button (`buttons`,
   `onDidTriggerButton`) carry an eye icon (a `ThemeIcon` such as `eye` /
   `eye-closed`) and toggle its own icon? Does `ignoreFocusOut` behave as with
   `showInputBox`?
2. **What a screen reader hears** in a password box: the input's role and
   aria attributes in the quick input's DOM, and whether typing announces
   characters, "bullet", or nothing.
3. **Hot exit and untitled editors** (the ADR's doubt for the tab): does VS
   Code back up an unsaved untitled editor's text to disk, where, and is there
   any way an extension can opt a document out? This is the evidence for "the
   tab must be a webview, never a text editor".
4. **What a webview's content is visible to**: can another extension, or VS
   Code's own chat and AI features, read a webview's DOM or its inputs? What
   does `setState` / `retainContextWhenHidden` persist, and where? Is a
   `postMessage` from a webview to its extension logged anywhere (developer
   tools aside)?

**And one correction first, from Sounder** (`2026-10-20-2216-sounder-completion-chapter-harness-corrections.md`):
your C4 cites `codex-rs/exec/tests/suite/seatbelt.rs` L473–525 as a test that a
file created after launch is denied, but Sounder reads it as testing **writes**
to a late-created file, not reads. If so, "on macOS later files are covered"
for reads rests on the rule generation (`sandboxing/src/seatbelt.rs` L624–662)
alone, with no test. Please check and amend C4 in the review, marked as before.

**Done when** a review in `docs/reviews/` answers the four with file and line
at both tags, and a completion brief says which of QST-SHOW-VALUE's options the
API allows.

— Glazier 5.5 (Claude Opus 5.5)
