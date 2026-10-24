<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs-for-ai
  plugin: adr@adrs4ai
-->

# Keyhole's icon: which concept carries forward

- **Date**: 2026-10-23
- **Iteration**: 2
- **Status**: Implemented
- **Deciders**: Jérémie Lumbroso (picks); Purser 5.5 (Claude Sonnet 5.5) drew the concepts

**TL;DR**: Keyhole's icon should be Porthole's twin (the same double ring and eight rivets, a keyhole where Porthole's page is) in indigo, redrawn as a vector so it holds up at 40 pixels; Jérémie picks the shape and the colour.

---

## Originating Context

**Source**: Jérémie, 2026-10-23, through Glazier's brief `docs/inbox/2026-10-23-1437-glazier-to-purser-publish-0-1-0-marketplace-first-and-the-icon.md`: *"I'd like the icon, etc. — it would be nice if the icon sort of borrowed the Porthole (and ADRs4AI) aesthetic."* Keyhole has no icon yet, and a Marketplace listing without one looks unfinished. An icon needs a new package build to change, so the first release's icon is worth getting right.

**What the family looks like** (read from the two files): Porthole's icon is one mid-tone teal, a thick rounded stroke, a riveted double ring around a page, flat on a transparent background. The ADR Manager's is the same stroke weight in rust: a page with a folded corner and a small seal.

---

## Explicitation

**What I understand**:

1. The icon should read as a sibling of those two, and be its own: same line weight and rounded ends, a **keyhole** as the aperture, and a colour that is neither teal nor rust.
2. It must hold up at the size of an extension-list row (about 40 pixels) on light and dark themes, and carry no text.
3. As with Porthole's icon, a model-generated bitmap is a poor master for a line drawing, so the strongest ideas are redrawn as vectors with stroke weights chosen for 40 pixels; the vector is also exactly transparent at any size.

**What was done** (all in `docs/release/icon/round-1/`): 12 concepts rendered with `Nano-Banana-Pro` from `docs/release/icon/keyhole-icon-concepts.md` (`generated-contact-sheet.jpg`, the individual files in `generated/`), then four vectors: **A** (twin, small keyhole), **B** (one heavy ring, four rivets, large keyhole), **C** (the ADR Manager's page with a keyhole where its seal is), and **A2** (A with a keyhole that fills the inner ring). `vectors-a-b-c-at-300-128-40px.jpg` shows A, B and C at three sizes on light and dark; `vector-a2-colours-at-220-128-40px.jpg` shows A2 in indigo, green and gold.

**Assumptions**: I judged from rendered previews on my screen, not in a real extension list; the picture is a taste call that is Jérémie's.

---

## Questions

### QST-ICON-SHAPE: Which shape should Keyhole's icon take?
- Status: answered
- Why asking: the icon is the first thing a stranger sees on the Marketplace card, and a taste call only you can make. All four vector candidates are in `docs/release/icon/round-1/` (`vec-*.svg`, with the 40-pixel comparisons as `.jpg` files); each is one colour, thick rounded strokes, no text, and transparent as SVG. The colour is a separate question below.
- Need: pick a letter (or override: any shape answers, such as "A2 with six rivets")

Options:
- **A — the twin (vector A)**: Porthole's exact ring geometry, two concentric rings and eight rivets, with a small solid keyhole in the middle. The closest sibling to Porthole; at 40 pixels the keyhole becomes a small mark inside a busy ring.
- **B — the single ring (vector B)**: one heavy ring, four rivets at the compass points and a large solid keyhole. Strongest at 40 pixels; it looks less like Porthole, and the four dots can read as compass points.
- **C — the page (vector C)**: the ADR Manager's page with a folded corner and two rule lines, a keyhole where its seal is. Joins the ADR Manager's family, not Porthole's; reads as "a document with a lock".
- **D — the twin with a bigger keyhole (vector A2)**: A with a keyhole that fills the inner ring, so it survives 40 pixels. Same family look as Porthole, and a clear keyhole.
- **E — another round**: none of these; I run a second round with what you say to change.

**Recommendation**: (by Purser 5.5, Claude Sonnet 5.5, 2026-10-23)

**D — the twin with a bigger keyhole (A2).** *Rationale*: Jérémie asked for Porthole's aesthetic first; A2 keeps the ring and the eight rivets exactly, so the two read as a pair in the Extensions list, and its keyhole is large enough to stay recognizable at 40 pixels, which A's is not (`vectors-a-b-c-at-300-128-40px.jpg`). *Confidence*: 0.6 — because I judged from previews and not in a real list, and B is stronger at the smallest size. *If wrong*: if you value legibility over family resemblance, this flips to B; if you want Keyhole closer to the ADR Manager, to C.

**ANS:** (by Jérémie Lumbroso)
OK, agreed, Option D (A2) is excellent. The only thing is that the keyhole in the center is a bit too close vertically to the circle. It is not vertically centered. I would move it up about 10-20px, it doesn't have to be centered but just a bit off from how close it is to the edge. The options are fantastic, and your ultimate choice is perfect — a faithful reification of my intent. Thank you for skillfully doing so!

---

### QST-ICON-COLOR: Which colour?
- Status: answered
- Why asking: Porthole is teal (`#2AA3AE`) and the ADR Manager is rust; Keyhole should be neither, and visible on both a white and a dark editor. A banner colour for the Marketplace page is chosen with it. `vector-a2-colours-at-220-128-40px.jpg` shows the same shape in three colours on light and dark.
- Need: pick a letter (or override: a hex value or a description answers)

Options:
- **A — indigo (`#6B5FD6`)**: clearly different from teal and rust; reads well on light and dark. Suggested banner: a deep indigo with light text.
- **B — emerald (`#35A27A`)**: visible on both; close enough to Porthole's teal that the two can be confused at small sizes.
- **C — antique gold (`#C99A2E`)**: thematic for a key; it sits near the ADR Manager's rust and Porthole's brass banner, so it separates the family less.

**Recommendation**: (by Purser 5.5, Claude Sonnet 5.5, 2026-10-23)

**A — indigo.** *Rationale*: of the three it is the only one that does not sit next to a sibling's colour (teal, rust, brass), checked on the same preview sheet on light and dark. *Confidence*: 0.7 — because the separation from the siblings is a fact of the colour wheel, but whether it feels right for a secrets tool is taste. *If wrong*: if you want the warmth of a key, gold is C.

**ANS:** (by Jérémie Lumbroso)
Option A as recommended sounds perfect.

---

## Decision

### Chosen (Jérémie, 2026-10-24): the twin with a bigger keyhole, in indigo, the keyhole moved up

- **Shape: D, vector A2**, with one change from Jérémie: *"the keyhole in the center is a bit too close vertically to the circle … I would move it up about 10-20px, it doesn't have to be centered but just a bit off from how close it is to the edge."*
- **Colour: A, indigo `#6B5FD6`.**
- **How the change was made.** His pixels were not tied to a canvas, so I took the previews he looked at (the A2 sheet's 220 px panel, and the 256 px icon size) as his reference: **the keyhole moved up 20 units of the SVG's 512-unit canvas**, which is about 9 px at 220 px and 10 px at 256 px, the low end of his range, so it stays clear of the ring at the top. A2 had its keyhole's head 42 units from the inner ring's edge and its slot 26 from it at the bottom; now it is about 22 above and 46 below. It is deliberately not centered, as he said. The result is `docs/release/icon/round-1/vec-a2-final-keyhole-up-20.svg`, compared with A2 at 300, 128, 40 and 32 px on light and dark in `a2-vs-final-at-300-128-40-32px.jpg`. If he meant more, the number is one edit in the SVG.
- **Done (2026-10-24):** `media/icon.png` is that SVG at 256 px, transparent (corner pixel fully transparent); `"icon": "media/icon.png"` and `galleryBanner` in `package.json`; `media/icon.png` in both lists of `scripts/check-package-contents.mjs` and `!media/icon.png` in `.vscodeignore`. The gate lists the icon in the package, and with the icon hidden the package check fails (`required files are missing from the package: media/icon.png`).
- **`galleryBanner` was my choice, not asked**: `#2E2A72` (a deep indigo) with theme `dark`, so the Marketplace page header shows light text on it. It is one line in `package.json` if he wants another.
- **Not yet checked by a person**: how the icon looks in a real Extensions list and on the Marketplace card; the 40-pixel previews are my screen.

### Action Items

- [x] Concepts drawn and rendered, vectors redrawn, previews made - Owner: Purser (done 2026-10-23)
- [x] Jérémie picks shape and colour - Owner: Jérémie (done 2026-10-24)
- [x] Move the keyhole up; render `media/icon.png`; wire it into the manifest, the package check and `.vscodeignore`; choose `galleryBanner` - Owner: Purser (done 2026-10-24)
- [ ] Look at the icon in a real Extensions list once the package is installed locally - Owner: Jérémie, whenever convenient

---

## Iterations

### Iteration 2 (2026-10-24)
- Trigger: Jérémie answered both questions (shape D with the keyhole moved up; indigo).
- Contributors: Purser 5.5 (Claude Sonnet 5.5); Jérémie Lumbroso.
- Changes: Decision written; the keyhole moved up 20 units; the icon and its plumbing done.
- Outcome: `Draft → Implemented`.

### Iteration 1 (2026-10-23)
- Trigger: Glazier's brief carrying Jérémie's request for an icon in Porthole's aesthetic.
- Contributors: Purser 5.5 (Claude Sonnet 5.5).
- Changes: first draft; two questions opened.
- Outcome: Draft.

---

## Links

- Related: Porthole's icon work, `jlumbroso/porthole`, `docs/release/icon/` (round 1 and round 2; the method, the transparency script and the 40-pixel checks are there).
