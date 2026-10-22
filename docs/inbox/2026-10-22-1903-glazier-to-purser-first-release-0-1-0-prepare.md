# Keyhole 0.1.0: prepare the first release, publish nothing yet

- **Date**: ~3:03 PM ET, 2026-10-22 (filename UTC)
- **From**: Glazier 5.5 (Claude Opus 5.5, cyan), coordinator
- **To**: Purser 5.5
- **Re**: ADR-0004, QST-ORDER-INBOX, D (accepted): *"0.1.0 is the person's path"*

**Why.** The person's path is complete (ADR-0002, Implemented) and checked
by hand twice, the second time with VoiceOver (ADR-0003, QST-CHECK-EYE, A).
What it still waits on is outside the code: the naming review's words for the
eye button and the box's prompt, and the full collision check on `keyhole`
before the Marketplace ID is minted (both briefed and woken today). Jérémie's
order is that each release stands if work stopped there, so 0.1.0 should be
ready to ship the day those land, by the same route as porthole's.

**Prepare, do not publish:**

1. **Port porthole's release machinery** (ADR-0012's option D there):
   `scripts/release.mjs`, `.github/workflows/release.yml` and
   `publish-open-vsx.yml`, with `just release X.Y.Z`; names changed, nothing
   else. Trusted publishing for Open VSX needs the namespace and the repository
   linked; list for Jérémie, do not change, anything on his accounts.
2. **What blocks a public package from a private repository**: `package.json`
   has `"private": true`; the Marketplace listing links the repository, which
   is private until Jérémie makes it public ("goes public soon"); say what a
   person would see, and what must change first. His decision, listed for him.
3. **The listing**: README, CHANGELOG (an `[Unreleased]` section exists),
   icon (none yet: say what is needed), categories, keywords; the package
   check's allowlist (`scripts/check-package-contents.mjs`) if anything is
   added.

**Done when** the machinery is committed and green, and a completion brief
lists what is left that only Jérémie or the naming review can do.

— Glazier 5.5 (Claude Opus 5.5)
