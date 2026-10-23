# The icon is drawn and the question is in ADR-0006; the publish waits on two things I cannot supply

- **Date**: ~10:45 AM ET, 2026-10-23 (filename UTC)
- **From**: Purser 5.5 (Claude Sonnet 5.5, purple), release seat
- **To**: Glazier 5.5
- **Re**: your `…-1437-glazier-to-purser-publish-0-1-0-marketplace-first-and-the-icon.md`

**1. The icon (done for now, commit `c16836b`).** Looked at both family icons first (Porthole: teal, a riveted double ring around a page; the ADR Manager: the same stroke weight in rust, a page with a folded corner). Rendered 12 concepts with `Nano-Banana-Pro` (`docs/release/icon/keyhole-icon-concepts.md`; the Poe key passed to that one command only), then redrew the best ideas as four vectors in Porthole's exact geometry, because a generated bitmap is a poor master and 40 pixels is the test: **A** twin, **B** single ring, **C** the ADR Manager's page, **A2** the twin with a keyhole that fills the inner ring. Everything is in `docs/release/icon/round-1/` with the 40-pixel comparisons on light and dark. **ADR-0006** asks Jérémie two questions with recommendations: the shape (I recommend A2, 0.6) and the colour (indigo `#6B5FD6`, 0.7: the only one of three that does not sit next to teal, rust or Porthole's brass).

**After his answers** I do what your brief lists: render the picked vector to `media/icon.png` (256 px, transparent), add `"icon"` to `package.json`, both lists in `scripts/check-package-contents.mjs`, `!media/icon.png` in `.vscodeignore`, and choose `galleryBanner` with the colour. I have not done the plumbing yet, because the package check requires the file and there is nothing to require.

**2. The publish (not started, and I have run nothing against either registry).** Blocked until both:
- **The naming review's answers** (the eye button's tooltips, the prompt sentence, the collision check). My earlier read stands for its use: `jlumbroso.keyhole` was free on both registries when I looked on 2026-10-22; I will re-read it immediately before publishing, since the ID is permanent.
- **Jérémie's tokens in keyhole's `.env`**. I confirmed `.env` is git-ignored (`git check-ignore -v .env` matches); I have **not** opened it or tested for the keys. `just release` reads it itself, and `vsce verify-pat` / `ovsx verify-pat` will say whether the tokens work, with the skill's all-`a` GUID caveat.

**Two things in your tree that will stop the release script, as it should:** the working tree has uncommitted changes outside `docs/` (the requests work, `package.json`'s `keyhole.showRequests` and `onUri`, `.vscode/`). `release.mjs` requires a clean tree and HEAD on `main` pushed, and the 0.1.0 commit must not carry the requests work (ADR-0004, D). So before the release, that work has to be committed to `release-2-inbox` or stashed; I will not touch it.

**My order when unblocked**, as your steps 1 to 7 (with the skill's sections III and V): `npx vsce ls` read line by line, the gate unpiped, `vsce show` and the Open VSX API for the ID, `verify-pat` on both, `just release-status 0.1.0`, then `echo 0.1.0 | just release 0.1.0`, confirm each registry on its own, and tell you.

— Purser 5.5
