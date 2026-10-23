# Keyhole VS Code Extension Icon: round 1, Porthole's twin

**Format:** Batch Renderer Canonical Specification
**Target Model:** Nano-Banana-Pro
**Purpose:** Concept inventory for Keyhole's Marketplace icon (Jérémie, 2026-10-23: "it would be nice if the icon sort of borrowed the Porthole (and ADRs4AI) aesthetic"). The family: Porthole's icon is one teal, thick rounded strokes, a riveted double ring around a page, flat, transparent; the ADR Manager's is the same line weight in rust, a page with a folded corner. Keyhole should read as their sibling and be its own: the same ring and rivets or the same page idiom, with a **keyhole** as the aperture, in a colour that is neither teal nor rust.
**Style contract:** one colour only; one even, thick stroke weight with round caps; no fills except solid rivets and where a concept says; centered, the subject filling about 90 percent of the frame; legible at 40 pixels on light and dark; plain pure white background so it can be turned into real transparency afterwards; no text of any kind.
**Author:** Purser 5.5 (Claude Sonnet 5.5). **Date:** 2026-10-23

---

## TAG LIBRARY

[MONO_BASE]: a single flat vector line icon on a plain pure white background, square 1:1 composition, centered, one single color only, a perfectly even thick stroke weight with rounded line caps and rounded corners, crisp geometric shapes, no gradients, no shadows, no texture, legible at forty pixels

[INDIGO]: the one color is a mid-tone indigo violet, saturated, clearly visible on both white and dark backgrounds

[GREEN]: the one color is a mid-tone emerald green, clearly visible on both white and dark backgrounds

[GOLD]: the one color is a warm antique gold, clearly visible on both white and dark backgrounds

[KEYHOLE]: a classic keyhole shape: a solid round hole above a short tapered slot, drawn as one solid filled silhouette

[RIVETS8]: eight small solid round dots evenly spaced between the two circles, like rivets

[NO_EXTRAS]: letters, words, numbers, watermark, second color, gradient, shadow, 3D, photographic texture, padlock, key, chain, shield

---

## 1. Porthole's twin: the ring and the rivets

### Concept 1.1: Twin, Indigo
- aspect: 1:1
- no: [NO_EXTRAS]

[MONO_BASE] [INDIGO] A ship's porthole drawn as two concentric thick circles with [RIVETS8], and inside the inner circle one large [KEYHOLE] filling about half of the inner circle.

### Concept 1.2: Twin, Green
- aspect: 1:1
- no: [NO_EXTRAS]

[MONO_BASE] [GREEN] A ship's porthole drawn as two concentric thick circles with [RIVETS8], and inside the inner circle one large [KEYHOLE] filling about half of the inner circle.

### Concept 1.3: Twin, Gold
- aspect: 1:1
- no: [NO_EXTRAS]

[MONO_BASE] [GOLD] A ship's porthole drawn as two concentric thick circles with [RIVETS8], and inside the inner circle one large [KEYHOLE] filling about half of the inner circle.

### Concept 1.4: Single Ring, Four Rivets
- aspect: 1:1
- no: [NO_EXTRAS]

[MONO_BASE] [INDIGO] One thick circle with four small solid rivet dots at the top, bottom, left and right just inside the ring, and in the center one large [KEYHOLE] filling about half of the circle.

### Concept 1.5: Ring Around a Keyhole, Nothing Else
- aspect: 1:1
- no: [NO_EXTRAS]

[MONO_BASE] [INDIGO] One very thick circle and, inside it, a very large [KEYHOLE] filling most of the circle. No rivets, no inner circle. The most reduced version.

## 2. The ADR Manager's idiom: the page

### Concept 2.1: Page With a Keyhole
- aspect: 1:1
- no: [NO_EXTRAS]

[MONO_BASE] [INDIGO] A portrait page outline with rounded corners and its top-right corner folded down as a clean triangular dog-ear, drawn with the same thick stroke, and in the lower middle of the page one [KEYHOLE]. Two short horizontal rule lines above the keyhole.

### Concept 2.2: Keyhole Cut Into a Page
- aspect: 1:1
- no: [NO_EXTRAS]

[MONO_BASE] [INDIGO] A portrait page outline with rounded corners and a folded top-right corner, with one large [KEYHOLE] in the middle of the page and no rule lines. The page is the frame, the keyhole is the feature.

## 3. The story of the value that never enters the conversation

### Concept 3.1: Masked Box and Keyhole
- aspect: 1:1
- no: [NO_EXTRAS]

[MONO_BASE] [INDIGO] A ship's porthole as one thick circle. Inside it, in the upper half, one [KEYHOLE], and below it a row of five solid round dots of equal size, like the dots of a masked password field.

### Concept 3.2: Page Pointing to a Keyhole
- aspect: 1:1
- no: [NO_EXTRAS]

[MONO_BASE] [INDIGO] A ship's porthole drawn as two concentric thick circles with [RIVETS8]. Inside the inner circle, a [KEYHOLE] whose round hole is a thick ring instead of a solid dot, so the keyhole looks like the porthole in miniature.

### Concept 3.3: Keyhole as the Inner Window
- aspect: 1:1
- no: [NO_EXTRAS]

[MONO_BASE] [INDIGO] One thick circle with [RIVETS8] placed on the circle itself, and inside it a single large keyhole drawn in outline only, with the same thick stroke, not filled, so the inside of the keyhole is white.

## 4. Weight

### Concept 4.1: Boldest
- aspect: 1:1
- no: [NO_EXTRAS]

[MONO_BASE] [INDIGO] The boldest possible mark: one extremely thick circle and inside it one very large [KEYHOLE]. Every shape clearly thicker than a normal icon, so it holds up at thirty-two pixels.

### Concept 4.2: Twin, Lighter Stroke
- aspect: 1:1
- no: [NO_EXTRAS]

[MONO_BASE] [INDIGO] A ship's porthole drawn as two concentric circles with [RIVETS8], at a medium stroke weight (thinner than the others), and inside the inner circle a smaller [KEYHOLE] with generous space around it.
