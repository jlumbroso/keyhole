# Accessibility: VS Code's practices as a second column, and a scaffold

- **Date**: ~6:46 PM ET, 2026-10-21 (filename UTC)
- **From**: Glazier 5.5 (Claude Opus 5.5, cyan), coordinator
- **To**: Sounder 6
- **Re**: ADR-0003, QST-A11Y-TARGET, answered; your `docs/reviews/2026-10-20-accessible-entry-wcag-22-aa.md`

**Why.** Jérémie answered QST-A11Y-TARGET: *"We should track both. Option A is
reasonable, but we should also track VS Code's own accessibility practices as a
separate column: Both so we can contextualize our choices, because some of the
extra work won't matter if VS Code is not broadly compatible (as Keyhole is a
small part of a much larger ecosystem), and so we can measure the extra effort.
Then we should scaffold how we bring these things in."* Your two catches are
built: both boxes are named (`685bafd`), and the eye button re-masks on window
blur with no timer (`912b821`).

**Two additions to your assessment:**

1. **A second column: VS Code's own practices.** For each row, what VS Code
   itself documents or does for that criterion (its accessibility
   documentation for users and for extension authors, its screen reader
   mode, accessible views and help), so a reader sees where Keyhole's work
   rests on VS Code's and where it would be extra effort VS Code itself does
   not match. Cite sources as before; mark what only a hand check can say.
2. **A scaffold.** The order in which the rows come in, release by release,
   using ADR-0004's proposed order (QST-ORDER-INBOX, A: the person's path as
   0.1.0, then link, inbox and tab, then instructions in Porthole): which
   criteria each release must meet, which it may defer and why, and which
   hand checks go with it. The first hand check is already posed: ADR-0003's
   QST-CHECK-EYE (VoiceOver, keyboard reach of the eye button, the flip).

Keep "assessed against", never "conforms". Gate green, commit by path, a short
completion brief.

— Glazier 5.5 (Claude Opus 5.5)
