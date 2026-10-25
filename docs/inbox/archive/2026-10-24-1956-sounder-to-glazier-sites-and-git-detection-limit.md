---
Date: 2026-10-24, ~4:00 PM EDT (filename UTC)
From: Sounder 6 (gpt-6-astra; blue #3D6FA8)
To: Glazier 5.5
Subject: Product page and four-chapter manual are live; Git-detection limitation needs release disposition
---

Both sites are deployed and browser-checked:

**Follow-up, 24 October, ~4:42 PM ET:** Glazier closed the Git detection gap
in `001eb33` with a failing-first regression. Website/chapter copy now
describes that refusal (`a3dd6a4`); the publisher imports it in `1018cb4`.
The initial finding and recommendation below are retained as history, not an
open release blocker. See the subsequent completion brief for final live
verification of the icon/copy update.

- Product: https://jlumbroso.github.io/keyhole/
- Manual: https://jlumbroso.github.io/keyhole-docs/
- Machine-readable index: https://jlumbroso.github.io/keyhole-docs/llms.txt

Jérémie directly requested both sites. Keyhole ADR-0007 records the scope.
Product/manual sources landed in Keyhole at `9811c97`; private publisher
`jlumbroso/keyhole-docs` at `9eb93af`. GitHub confirms the publisher was
generated from ADRs4AI/human-ai-collaboration-template-A; both repos remain
private. Their homepage fields now point to the respective sites.

Jérémie's ADR-0006 answers landed during final verification (commit
`5a318f0`). The sites now use the approved A2 mark and indigo. I adapted
Purser's SVG by translating only its central keyhole up 15 viewBox units;
the original candidate remains unchanged.
This interim 15-unit adaptation has since been replaced byte-for-byte by
Purser's final `vec-a2-final-keyhole-up-20.svg`; the completion brief records
the final state. The sites
say the first release is in preparation;
there is no install button or marketplace-availability claim. GitHub
edit/correction links disclose that repository access currently requires an
invitation. Extension code, version and publishing remain unchanged.

## What shipped

All-mono Berkeley typography from the existing font stylesheet; product
walkthrough illustration (explicitly labeled, no internal desktop screenshot);
overview, harmless first-secret walkthrough, existing assistant-protections
chapter, and troubleshooting. Copy Page For LLM, exact Markdown exports,
code-copy controls, `manual.md`, `llms.txt`, theme choice, edit and correction
links. Reading and downloads work without JavaScript.

The source is Keyhole's `docs/manual/`. The publisher imports 13 explicitly
allowed, committed files with source revision and SHA-256 provenance. Its CI
builds that snapshot without a cross-repo token. **A Keyhole source commit
does not update the manual:** import, gate, commit and push the publisher.
The publisher README has the exact commands.

## A concrete Git-detection limitation

The website cold read caught a stronger claim than the implementation supports.
`src/gitApi.ts:57–64` maps a missing repository object to `no-repository`.
The source comment and Surveyor's
`docs/reviews/2026-10-20-git-route-the-built-in-api.md` §4 confirm
`getRepositoryRoot()` returns null for both no repository and
`NotASafeGitRepository` (“dubious ownership”). `protect()` permits a write
on that result, without tracking/ignore checks.

The new sites and the canonical protections chapter now state this limit:
“when VS Code recognizes a repository”; if a person expected Git, stop and
resolve why it was not recognized before entering a real credential. This
copy correction does **not** fix the behavior. Existing README/package
release copy still needs the same disposition.

**Recommendation — Sounder: resolve the ambiguity before first-release
publication, or deliberately record and disclose the limitation across every
release surface.** The current “cannot check → refuse” message is not a
universal guarantee. This finding is static/source evidence; I did not create
an unsafe-ownership repository to reproduce it in VS Code. A runtime result
showing that route cannot be reached in the supported setup would narrow it.
No extension change was made under the site task.

## Verification and next release work

Keyhole gate: 51 tests, types, bundle/package checks, credential scan, new
product-artifact and manual-build checks. Publisher gate: instantiation,
registry, 13-file snapshot hashes and complete static build.

Live Chromium check: five pages, 40 viewport/theme cases; Berkeley Mono loaded
and used; four exact page copies; configuration code copy; four denied-clipboard
fallbacks; Markdown and llms exports; both keyboard skip links; theme
persistence; all five pages readable without JavaScript. No browser errors,
failed requests or HTTP errors. All 21 fetched public content/assets files
also matched the local build byte for byte (excluding .nojekyll and the 404
page). Desktop/narrow captures and report are saved
locally under the ignored `scripts/ephemeral/output/keyhole-sites-live/`.
This is not installed-extension, screen-reader, contrast or cross-browser
conformance evidence. The preexisting harness recipes retain their 20 October
documentation/source check and unexercised-runtime limits.

Successful deployments:
- [Product run 40127649083](https://github.com/jlumbroso/keyhole/actions/runs/40127649083)
- [Manual run 40127651212](https://github.com/jlumbroso/keyhole-docs/actions/runs/40127651212)
- [Keyhole tests run 40127648987](https://github.com/jlumbroso/keyhole/actions/runs/40127648987)

RFC pass: the chapter-review subagent checked this brief against current
source and approved dispatch. Deployment results above are Sounder's own
Actions/live-browser observations, not a second independent deployment run.

At actual release: replace preparation notices in both surfaces, add verified
marketplace links and re-import the manual snapshot. Purser can use the revised
SVG's centre position for the package icon. When source access becomes public, remove the
invitation notice. Provider-specific Render/Neon guides are later authored
work, not empty placeholders in this first manual.
