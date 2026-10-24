# The README has two real screenshots now; one of them depends on wording the naming review has not ruled, and what a retake would add

- **Date**: ~6:55 PM ET, 2026-10-24 (filename UTC)
- **From**: Purser 5.5 (Claude Sonnet 5.5, purple), release seat
- **To**: Glazier 5.5
- **Re**: Jérémie, 2026-10-24: "The README.md will need to be updated though — and also I wonder if we can have any screenshot at all."

**Answer to the second question: yes, two, from your hand checks** (`docs/adr/attachments/screenshots/2026-10-20-testing/` and `2026-10-22-voice-over-test/`; 21 images looked at, each at full size). Commit `3f89197`. Both are cropped to the extension, with no desktop, no menu bar, no ADR text, no VoiceOver caption, and both show a made-up value in a throwaway folder (`keyhole-check-2`), which the README says. No real secret or home path is visible in either.
1. `docs/images/keyhole-masked-box.png`: the masked box with its prompt and the eye button focused.
2. `docs/images/keyhole-already-set.png`: the "already set" question with the keyprint and the buttons. Its words match `src/setSecret.ts` line 148 today.

**Wording dependency, yours to watch**: the masked box's screenshot shows the **prompt sentence and the eye button's focus ring**, which are exactly what the naming review has not ruled on (your brief: tooltips and the prompt). **If the review changes the prompt, that image is stale and needs a retake before 0.1.0**; the README caption does not quote the prompt, but the alt text does, so change both. The "already set" question is the review's already.

**What I did not use, and why**
- The "Add to .gitignore" dialog (`2026-10-20 6.54.03 PM`): its words are the old ones ("is not ignored by git, so a `git add .` would put your secrets…"); the code now says "Add .env to .gitignore first (recommended)" with a detail line. **A retake would make a good third picture**, since it shows the check that is the extension's point.
- The `.env` file after a write: its comment line reads "Keyhole 0.0.1" and the value is plain text, which in a README looks like the promise broken. A retake could show the file with the comment line and the keyprint, but I would not show a plain value even a fake one.
- Every full-desktop frame: crew ADR text on the left and a path in the window.

**A retake list, if Jérémie wants more** (each a screen he can capture in about a minute; the extension must be the installed build): (a) the not-ignored question, current words; (b) the refusal when `.env` is tracked ("Keyhole did not write … git tracks it"), the other half of the point; (c) the command in the palette, "Keyhole: Set a Secret in .env…". Same throwaway folder, made-up value, crop to the extension.

**README, the rest of the update**: removed "The first release is in preparation" (it would be false the day 0.1.0 ships, and a README never states a status); the product page and manual links someone had added stay. Images are not in the package (the allowlist is unchanged at seven files), so on the Marketplace they load from the repository and **show as broken until the repository is public**, as I said for the links.

— Purser 5.5
