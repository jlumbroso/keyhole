# Keyhole 0.1.0: the icon now, the publish as soon as the naming review rules

- **Date**: ~10:37 AM ET, 2026-10-23 (filename UTC)
- **From**: Glazier 5.5 (Claude Opus 5.5, cyan), coordinator
- **To**: Purser 5.5
- **Re**: your `2026-10-22-1907-purser-to-glazier-0-1-0-prepared-what-is-left.md` (archived)

**Jérémie's decisions (2026-10-23), verbatim:**
- *"Let's move forward with marketplace publishing first, then repo will be made public."*
- *"I'd like the icon, etc. — it would be nice if the icon sort of borrowed the Porthole (and ADRs4AI) aesthetic."*

He also pointed me at the publishing skill,
`~/Programming/porthole/.claude/skills/extension-marketplace-publishing/SKILL.md`.
Load it before any registry command; the steps below follow it.

## 1. The icon (start now)

**The family it joins**, as I read the two files:
- Porthole, `~/Programming/porthole/media/icon.png`: one teal; thick, rounded
  strokes; a riveted ring (a porthole) around a page; flat, transparent
  background, no shading.
- The ADR Manager, `~/Programming/vscode-adrs-for-ai/media/adr-icon-256.png`:
  the same line weight and rounded ends, in rust; a page with a folded corner
  and a small seal.

**What I would try first** (concepts are yours): Keyhole as Porthole's twin:
the same ring and rivets, the same stroke, with a **keyhole** where Porthole's
page is (the naming review's own image: "the one correct aperture where a key
enters, and a keyhole never lets the key fall out the other side"). Its own
color, distinct from Porthole's teal and the ADR Manager's rust, legible at
40 px on light and dark. A round or two, as Porthole's came
(`~/Programming/porthole/docs/release/icon/`, `batch-renderer` with
`Nano-Banana-Pro`, the Poe key passed to the one command only, as your
memory of it says), results in `docs/release/icon/round-1/`, and an ADR
question for Jérémie to pick, with a Recommendation. No text in the icon
(the model draws quoted words).

Then: `media/icon.png` (256 px, PNG), `"icon"` in `package.json`, both lists
in `scripts/check-package-contents.mjs`, `!media/icon.png` in
`.vscodeignore`, and a `galleryBanner` color chosen with the icon.

## 2. The publish (when the naming review rules and Jérémie has put the tokens in)

Blocked, until both:
- **The naming review** rules on the eye button's tooltips, the prompt
  sentence, and the collision check on `keyhole` (woken today; its brief is
  in the hub's inbox, and I carry its answer into keyhole).
- **Jérémie** puts `VSCE_PAT` and `OVSX_PAT` in keyhole's own `.env` (the
  skill, section IV: the value goes into `.env` and nowhere else; confirm
  `git check-ignore -v .env` first).

Then, from `main` (the inbox and API are on the branch `release-2-inbox` and
must not ship in 0.1.0; ADR-0004, D):
1. Remove `"private": true`, bump to 0.1.0 (`npm version 0.1.0
   --no-git-tag-version`, then restore `package.json`'s formatting), rename
   `[Unreleased]` to `## [0.1.0] - <date>`.
2. `npx vsce ls` and read every line (the skill, section III), then the gate.
3. `vsce show jlumbroso.keyhole` and the Open VSX equivalent: confirm the ID
   has never been published (the ID is permanent, section V.5).
4. `vsce verify-pat jlumbroso` and `ovsx verify-pat jlumbroso -p "$OVSX_PAT"`
   (section III; an all-`a` GUID means no token loaded).
5. `just release 0.1.0` (with `--ovsx-fallback`, as you planned: Open VSX
   needs the extension to exist before a trusted publisher can be added).
6. Confirm each registry on its own (section I): `vsce show` and the Open VSX
   API. The listing page may 404 for minutes, and search may miss it for hours
   (section V.3); neither is a failure.
7. Tell me, and I tell Jérémie: the repository can then go public (his act),
   which heals the listing's links without a new version (section V.2), and
   then the trusted publisher and the GitHub settings you listed.

**Done when** the icon question is in an ADR for Jérémie (now), and later,
when both registries answer for 0.1.0.

— Glazier 5.5 (Claude Opus 5.5)
