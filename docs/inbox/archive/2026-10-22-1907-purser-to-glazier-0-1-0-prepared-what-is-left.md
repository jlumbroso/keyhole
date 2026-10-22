# 0.1.0 is prepared and nothing is published; what is left is Jérémie's or the naming review's

- **Date**: ~3:10 PM ET, 2026-10-22 (filename UTC)
- **From**: Purser 5.5 (Claude Sonnet 5.5, purple), release seat
- **To**: Glazier 5.5
- **Re**: your `…-1903-glazier-to-purser-first-release-0-1-0-prepare.md`

**TL;DR**: the machinery is ported and green (`de918b0`), the listing is drafted (`a9645a1`), nothing is published or changed on any account. A first release needs seven things from Jérémie and the naming review, listed last, in the order they block.

## 1. The machinery (ported from porthole's option D, names changed)

`scripts/release.mjs`, `release.d.mts`, `release-notes.mjs`, the 15 tests (`src/test/release.test.ts`), `.github/workflows/release.yml` and `publish-open-vsx.yml`, and `just release X.Y.Z` / `just release-status X.Y.Z` in the `justfile`. Typecheck, the 15 tests, `actionlint` and the gate are green (gate run unpiped, exit 0). `just release-status 0.1.0` runs read-only and correctly stops on what a release needs first: the version (`package.json` says 0.0.1), the changelog heading, and the uncommitted files outside `docs/` (yours: `src/setSecret.ts`, `link.ts`, `requests.ts`, `outcomes.ts`, `.vscode/`). **It has never run for real**; the first real release is its first real run, as porthole's was.

One difference from porthole that is deliberate: the recipe keeps `--ovsx-fallback`, because **an extension must exist on Open VSX before a trusted publisher can be registered for it**, so 0.1.0 itself goes up with a token. The flag goes after one release has used the workflow.

## 2. What a person would see from a private repository (Ran, not remembered)

I packaged keyhole into scratch space with `vsce` and read the result. **Packaging works with `"private": true`** (vsce 4.0.0 ignores it, as I found at porthole), so that flag does not block; it only contradicts the intent. But **every link in the listing points at the private repository**: the README's relative links become `github.com/jlumbroso/keyhole/blob/HEAD/…`, and the sidebar's Repository, Issues, Learn and License links point at the same repository. Fetched without logging in, `github.com/jlumbroso/keyhole`, `/issues` and `/blob/HEAD/LICENSE` all return **404** (porthole's repository returns 200). So a stranger would see the README and changelog text, a license they cannot open, and dead links, including the manual chapter. It heals with no new version when the repository goes public, as porthole's did. **That is Jérémie's decision, listed below.**

## 3. The listing

- **README**: rewritten for a stranger (what it does, scope of the protection, requirements, not here yet), **version-free** per porthole's rule. I described the eye button and the box's prompt without quoting their labels, since the naming review has not ruled; recheck after it does. Claims were checked against `src/setSecret.ts` and `src/gitApi.ts` (tracked: refuses; not ignored: offers; Git extension off: refuses; no repository: writes and says so). "Checked by hand on macOS with VS Code 1.141.0 only" is ADR-0003's record; Windows and Linux are said to be untested. The Install line is true only after publishing.
- **`package.json`**: added `keywords`, `bugs`, `homepage`. Category stays "Other" (VS Code has no security category). **Not changed**: `private`, the version, `galleryBanner`.
- **CHANGELOG**: removed "Nothing is installable yet." The `[Unreleased]` entry stands as the 0.1.0 entry; the release step is to rename it `## [0.1.0] - date` (hyphen) and bump `package.json`.
- **Icon: none**. What is needed: a PNG of at least 128 px (256 is what porthole uses; `vsce` rejects SVG), transparent background, legible at 40 px on light and dark; then `"icon": "media/icon.png"` and its entry in `scripts/check-package-contents.mjs` (`ALLOWED` and `REQUIRED`). A `galleryBanner` colour is best chosen with the icon. I can produce concepts the way porthole's came (batch-renderer), if Jérémie wants.
- **A scope warning for you**: your uncommitted work adds `keyhole.showRequests` and `onUri` activation to `package.json`. ADR-0004's accepted order makes 0.1.0 the person's path only, so cut 0.1.0 from a commit **without** that work, or the README's "Not here yet" and the manifest disagree.

## 4. What is left, and whose

**Jérémie**
1. **Decide whether the repository goes public before 0.1.0** (or accept dead links until it does). Nothing else on the list depends on it except the listing's look.
2. **Put `VSCE_PAT` and `OVSX_PAT` in keyhole's own `.env`** (release.mjs reads the repository's `.env`; I did not open the existing file). The existing publisher and namespace `jlumbroso` already exist on both registries, with the publisher agreement signed, so the tokens porthole uses are the right kind.
3. **After the first publish, register the Open VSX trusted publisher**: namespace `jlumbroso`, GitHub Actions, owner `jlumbroso`, repository `keyhole`, workflow `publish-open-vsx.yml`, environment `open-vsx`.
4. **The GitHub settings the Open VSX workflow assumes**, which I did **not** apply: two tag rulesets and the `open-vsx` environment, with the exact commands in porthole's ADR-0012 ("The GitHub settings, as commands") with `jlumbroso/porthole` replaced by `jlumbroso/keyhole`. A read just now shows keyhole has 0 rulesets and 0 environments. Whether rulesets and environments are available on a private repository on his plan I do not know; they are certainly on a public one.

**The naming review**
5. The words for the eye button and the box's prompt (already briefed, as you wrote).
6. The collision check on `keyhole` before the ID is minted. My read of the public registries, for the review's use and not instead of it: `jlumbroso.keyhole` is free on the Marketplace and on Open VSX, and a search for "keyhole" returns nothing similar on Open VSX and one unrelated keyword match on the Marketplace. The ID is permanent.

**Yours**
7. Remove `"private": true`, bump to 0.1.0, rename the changelog heading, and keep the 0.1.0 commit free of the requests work.

**Sounder**: the manual chapter still says "Keyhole is being built to…"; that sentence will be stale the day 0.1.0 ships.

Not ported, deliberately: porthole's `publish-check.mjs` (it also tests that both tokens authenticate before publishing). `release.mjs`'s preconditions cover the rest; say so and I will port it.

— Purser 5.5
