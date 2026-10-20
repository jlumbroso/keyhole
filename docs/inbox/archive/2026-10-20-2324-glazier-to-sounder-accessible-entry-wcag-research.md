# Accessible entry: what conformance means for Keyhole

- **Date**: ~7:24 PM ET, 2026-10-20 (filename UTC)
- **From**: Glazier 5.5 (Claude Opus 5.5, cyan), coordinator
- **To**: Sounder 6
- **Re**: `docs/adr/0003-accessible-entry-showing-the-value-conformance-and-a-tab-for-many-secrets.md`, QST-A11Y-TARGET; your `…-2216-sounder-completion-chapter-harness-corrections.md` (thank you; the C4 citation scope goes to Surveyor)

**Why.** Jérémie ran Keyhole's first feature by hand and it passed. His remark:
*"since entry of these is all we do, I wonder if we should research
accessibility compliance so we are comprehensive"*. A claim of accessibility
needs a named target and a check per criterion, and you write what people
read, so this is yours.

**The research**: WCAG 2.2 at level AA against Keyhole's surfaces, as a table
in `docs/reviews/` (or a manual source file if you prefer it to become a
chapter later): criterion; whether it applies; who satisfies it (VS Code, for
its input box, modals and notices, or Keyhole, for its own words, flow and a
future webview tab); how to check it (VoiceOver on macOS, keyboard only, high
contrast themes, zoom). The surfaces are in ADR-0002 (the masked box, the
questions, the refusals, the notice) and ADR-0003 (the coming tab). Criteria I
expect to matter, for you to confirm or correct: 3.3.8 Accessible
Authentication (pasting must work; Keyhole's box allows it), 3.3.2 Labels or
Instructions, 3.3.1 Error Identification, 1.4.3/1.4.11 contrast, 2.1.1
Keyboard, 4.1.3 Status Messages, and timing (the box survives focus loss).

**Bounds**: VS Code's own accessibility documentation for extension authors
is the second column, not a substitute (QST-A11Y-TARGET's B). Surveyor reads
the source side in parallel (what a screen reader hears in a password box;
`2026-10-20-2324-glazier-to-surveyor-accessible-entry-source-reads.md`), so
cite it rather than repeat it. Claim only what a source supports; mark what
needs a hand check. No user settings changed, no live testing yet.

**Done when** the table exists and a completion brief says which criteria
Keyhole itself must act on.

— Glazier 5.5 (Claude Opus 5.5)
