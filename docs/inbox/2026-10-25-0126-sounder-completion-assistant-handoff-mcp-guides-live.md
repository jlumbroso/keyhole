# Assistant handoff and Render/Neon MCP guides are live

From: Sounder 6 (GPT-6 Astra)
Date: 24 October 2026 ET / 25 October UTC
Re: Jérémie's model-first correction and initial service demos; ADR-0009

## Delivered

* Product: https://jlumbroso.github.io/keyhole/ — assistant-initiated handoff, Porthole instructions and four visible guide/reference links; implemented-preview status beside the lead.
* Model reference: https://jlumbroso.github.io/keyhole-docs/for-assistants.html — exact request URI, inbox JSON, connection commands and `secret_status`; Porthole download/read/open steps; pinned preview and cache limitations.
* Render: https://jlumbroso.github.io/keyhole-docs/render-mcp.html
* Neon: https://jlumbroso.github.io/keyhole-docs/neon-mcp.html
* Destinations: https://jlumbroso.github.io/keyhole-docs/assistant-settings.html — Claude Code's requested `settings.local.json` shape and the different Codex, Gemini CLI and Grok Build MCP/environment paths.

The manual now has eight chapters. Both service demos offer documented OAuth first, with an optional API-key path. For Claude Code that path uses a name-only `.mcp.json` header reference and a private value under `env` in `.claude/settings.local.json`. Keyhole does not write that destination yet; the guides say so and describe the remaining human edit. They do not treat `.env` as a universal MCP loader. Existing Copy Page For LLM, Markdown exports, `llms.txt`, source editing and correction links cover all new chapters.

## Publication and checks

Canonical site/manual change: `f52a12a`; browser check: `d7a60b2`. Publisher snapshot: `541fbb0`, importing canonical `f52a12a`. Both pushed to main. Pages workflows succeeded:

* [Manual deployment](https://github.com/jlumbroso/keyhole-docs/actions/runs/40150537330)
* [Product deployment](https://github.com/jlumbroso/keyhole/actions/runs/40150580302)

Keyhole gate passed, including 53 extension tests, type/build/package checks and both static-site checks. Publisher gate passed: 17 allowlisted source files and provenance hashes, eight generated chapters and exact copy data. No extension code changed.

Local and live Chromium runs passed nine pages, 72 layout/theme cases, eight exact full-page copies, every code-block copy in the five configuration/reference chapters, eight clipboard-denial fallbacks, all Markdown/index exports, 16 contribution links, theme persistence, both skip links, and nine pages without JavaScript. No browser, HTTP or request errors. Render guide and product screenshots were visually inspected. Live run evidence is local/ignored at `scripts/ephemeral/output/keyhole-mcp-guides-live/report.json`; the reproducible check is committed. All 29 public files checked (excluding `.nojekyll` and the 404 document) matched the build byte-for-byte.

These checks establish site behavior, not installed-extension URI behavior, full accessibility conformance, provider sign-in, or an authenticated MCP operation. No service account was accessed and no credential was created. Both temporary local preview servers were stopped.

## Coordination and remaining work

Glazier owns the actual destination writers under ADR-0010 and keeps main stable while preview work proceeds in its worktree. The matrix and preview catches are committed in `archive/2026-10-25-0121-sounder-to-glazier-mcp-destination-matrix-and-preview-caveats.md`; its wake was delivered. Surveyor's pinned-release verification has returned; the corrections are incorporated in the settings chapter. This documentation publication neither merges the preview branch nor publishes the extension.

Render's official pages disagree about API-key scope; the guide uses the broader canonical API-reference boundary. Provider-side OAuth revocation clicks were not established; the guides distinguish client disconnect from revoking every issued token. A real human walkthrough of the two demos is the next source of guide corrections.

## Release-day follow-up (22:04 ET)

Glazier's 0204 brief arrived before closeout: Purser published 0.1.0. Verified the GitHub release, live Marketplace listing (0.1.0 asset metadata), and Open VSX API version 0.1.0. Updated the sites with Marketplace/Open VSX links and `code --install-extension jlumbroso.keyhole`, keeping the request/MCP and settings writers unreleased. Source repository is still private on the GitHub API; invitation notices remain. The final release-day gate passed 54 tests; the earlier site-delivery gate above passed 53 before concurrent extension work landed.

Surveyor's corrections distinguish Gemini name redaction and Grok's Bash-only Claude-settings compatibility. A further pinned-source read found Gemini's recognized token-value filter runs before its name allowlist: allowing a variable name is not a universal bypass. The chapter therefore leads with the explicit per-server literal destination and qualifies name references. This additional limitation should follow the matrix into ADR-0010's target review. Source: Gemini v0.65.0 `packages/core/src/services/environmentSanitization.ts`, `shouldRedactEnvironmentVariable`, lines 150–181.

Release-day follow-up is deployed: canonical `a91a92e`, publisher `fede5a1`; [product run](https://github.com/jlumbroso/keyhole/actions/runs/40153337604) and [manual run](https://github.com/jlumbroso/keyhole-docs/actions/runs/40153336956) both succeeded. The final live browser run again passed all nine pages and 72 cases, copies/fallbacks/exports/no-JavaScript paths, with no errors; the final product screenshot was visually inspected. All 29 checked public files again match the build. Final ignored evidence directory: `scripts/ephemeral/output/keyhole-mcp-guides-0-1-0-live/`.
