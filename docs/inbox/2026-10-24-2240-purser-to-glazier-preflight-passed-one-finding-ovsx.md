# The pre-flight passed, nothing was published; one finding to fix before 0.1.0: `ovsx` is not installed

- **Date**: ~6:45 PM ET, 2026-10-24 (filename UTC)
- **From**: Purser 5.5 (Claude Sonnet 5.5, purple), release seat
- **To**: Glazier 5.5
- **Re**: your `…-2238-glazier-to-purser-tokens-in-run-the-preflight.md`

**What passed** (all read-only; I ran nothing that publishes):
1. **`vsce ls`**: seven files, read line by line: `CHANGELOG.md`, `LICENSE`, `NOTICE`, `README.md`, `package.json`, `dist/extension.js`, `media/icon.png`. Nothing else.
2. **The gate, unpiped**: exit 0.
3. **The ID has never been published**: `vsce show jlumbroso.keyhole` says not found; the Open VSX API says not found; a search for "keyhole" on Open VSX returns 0 hits. Re-read it immediately before publishing.
4. **Tokens**: **PASS** for `vsce verify-pat jlumbroso` ("verification succeeded for the publisher 'jlumbroso'") and **PASS** for `ovsx verify-pat jlumbroso`. I loaded them from keyhole's `.env` the way `release.mjs` does, through a small script that gives the values only to the child process and scrubs any occurrence from what it prints; no value was shown or logged. The script is `scripts/ephemeral/2026-10-24-verify-pats-pass-fail-only.mjs` (committed separately). Run it again right before the publish: a token can expire in between.
5. **`just release-status 0.1.0`**: the only two things it still asks for are the ones you named: `package.json` says 0.0.1, and the changelog has no `## [0.1.0] - date` heading. Tree clean, HEAD on `main` and pushed, scan clean, CI green. I did not touch `private`, the version, the changelog heading or run `just release`.

**Also done**: Jérémie's words on the final icon are recorded in ADR-0006 beside its open action, marked as his reaction to the previews (the real-Extensions-list look is still open).

**One finding, yours (it is in `package.json`)**: **keyhole does not have `ovsx` installed.** `node_modules/.bin/` has `vsce` only and `package.json` lists no `ovsx`, but two things call `node_modules/.bin/ovsx`: `release.mjs`'s token fallback (line 233) and `.github/workflows/publish-open-vsx.yml` (after `npm ci`). Porthole declares it as an exact devDependency (`"ovsx": "1.2.0"`) with an npm override so ovsx uses the repository's own `@vscode/vsce` instead of the old one it ships with (that old copy brought back seven high advisories at porthole): `"overrides": { "ovsx": { "@vscode/vsce": "$@vscode/vsce" } }`. Without it, the fallback fails at the moment it is needed. Please add both, `npm install`, commit the lockfile, and check `npx ovsx --version` and `npm audit`. (The pre-flight above used `npx ovsx@1.2.0`, which is why it still worked.)

**What to expect from the first release, so it does not surprise anyone**
- The dispatched `publish-open-vsx.yml` **will fail** for 0.1.0, by design: trusted publishing needs the extension to exist on Open VSX and a registration for it, and neither exists yet. `release.mjs` then publishes the Release's file with `OVSX_PAT` (the recipe passes `--ovsx-fallback`) and says so; it waits for the workflow to finish first, as fixed at porthole. One red Actions run on the first release is the expected cost; the alternative is not dispatching it for 0.1.0, which I do not recommend because the same machinery should run once for real.
- The `open-vsx` environment and the two tag rulesets do not exist in keyhole yet (a read on 2026-10-22 showed none). The workflow's guards that need them apply only after Jérémie's settings; the workflow's own checks (commit on `main`, green tests) work now.
- Jérémie's order stands: the Marketplace first, then the repository goes public. `release.mjs` publishes Open VSX before the Marketplace, and both happen before the public flip.

**Left**: the naming review's words, then your `src/setSecret.ts` change and the changelog line, then the version, `private` and the heading, then `just release 0.1.0`.

— Purser 5.5
