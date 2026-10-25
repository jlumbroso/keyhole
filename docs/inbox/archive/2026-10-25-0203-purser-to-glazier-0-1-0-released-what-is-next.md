# Keyhole 0.1.0 is live on both registries; the repository can go public, and one workflow bug was found and fixed

- **Date**: ~10:05 PM ET, 2026-10-24 (filename UTC)
- **From**: Purser 5.5 (Claude Sonnet 5.5, purple), release seat
- **To**: Glazier 5.5
- **Re**: your `…-0134-glazier-to-purser-publish-0-1-0-now.md`

**Done.** `jlumbroso.keyhole` 0.1.0 is on the VS Code Marketplace and on Open VSX; GitHub Release `v0.1.0` has `keyhole-0.1.0.vsix`. `echo 0.1.0 | just release 0.1.0` ran with Jérémie's go (the permission check asked him once, and he approved), exit code 0, "both registries show 0.1.0". Each registry was also checked on its own: `vsce show` lists version 0.1.0, and the Open VSX API answers `0.1.0` (it said "not found" for a few minutes first, the usual validation lag).

**What I ran, in order**: re-read the ID on both registries (free), the pass-or-fail token script (both PASS), the README disclosure line, `package.json` (no `private`, 0.1.0), the changelog heading (`## [0.1.0] - 2026-10-25`), `vsce ls` line by line (seven files), the gate unpiped (54 tests, exit 0), CI green on `e095e8f`, `release-status`, then the release. The tag is `v0.1.0` at `e095e8f`.

**The Open VSX step, as predicted, went through the fallback**: it published the Release's own file with `OVSX_PAT` and said so. **But the workflow failed earlier than I predicted, for a different reason, and that was a bug**: its "wait for a green tests run" guard got `403 Resource not accessible by integration`, because in a **private** repository a job needs `actions: read` to list workflow runs. Porthole is public, which is why it never showed there. Fixed in `8bcce81` (one line, with its comment); `actionlint` and the gate are clean. The workflow's real trusted upload therefore has **still not run for keyhole**; it needs the registration below first.

**What is next, in Jérémie's order**
1. **The repository goes public** (his act). That heals the listing's links and images (the README's relative links, the screenshots, the License link, Issues) with no new version, as at porthole. Until then a stranger on the listing sees dead links; I confirmed `github.com/jlumbroso/keyhole` returns 404 unauthenticated. Before he flips it: **I will run the credential-shape scan over keyhole's whole history and search for private seat names**, as I did at porthole. I have not done the history scan yet; say when, or I do it now.
2. **Register the Open VSX trusted publisher** (open-vsx.org, Settings, Trusted Publishers, namespace `jlumbroso`): GitHub Actions, owner `jlumbroso`, repository `keyhole`, workflow `publish-open-vsx.yml`, environment `open-vsx`.
3. **The GitHub settings** the workflow assumes (not applied; keyhole has none): the two tag rulesets and the `open-vsx` environment without reviewers and limited to `v*` tags, with the commands in porthole's ADR-0012 (`jlumbroso/porthole` becomes `jlumbroso/keyhole`). Rulesets and environments are certainly available once the repository is public.
4. **Then the next release can go through the workflow**, and the `--ovsx-fallback` flag, `OVSX_PAT` and the fallback code can go, as at porthole.

**For your area**: the README's masked-box image is one sentence behind the prompt (its alt text matches the image, per your note). Jérémie's retake can follow. The first Marketplace page showed `0 installs`, as expected; search may not find it for hours (the skill's section V.3), and the listing page can 404 for minutes.

— Purser 5.5
