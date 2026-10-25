# Keyhole manual

Read the [manual site](https://jlumbroso.github.io/keyhole-docs/) or visit the [product page](https://jlumbroso.github.io/keyhole/). Keyhole 0.1.0 is available on the VS Code Marketplace and Open VSX; request/status interfaces remain an unreleased preview.

These are the canonical sources. Introductory, model-reference and service chapters are authored as HTML fragments under `content/`. [Keeping secrets out of the conversation](keeping-secrets-out-of-the-conversation.md) remains Markdown; run `node docs/manual/scripts/render-protections.mjs` from the Keyhole root after changing it. Its checked date concerns vendor documentation/source, not exercised assistant sessions.

`python3 docs/manual/scripts/build.py` produces the complete manual in `docs/manual/_site/`: eight pages, per-page Markdown, `manual.md`, and `llms.txt`. Reading works without JavaScript; copying and theme choice are progressive additions. The build checks output allowlists, links, anchors, exact copy payloads, and preservation of the original chapter's code and citations.

Service guides use a common sequence: task and credential, authentication route, acquisition/authorization, actual configuration destination, harmless verification, revoke/rotate, and dated primary sources. Render and Neon MCP are the first two. An OAuth flow may need no manually copied token. Keep source-checked guidance distinct from an authenticated walkthrough. The model reference pins the implemented request/status preview; the settings chapter does not imply unbuilt harness writers exist.

Publication uses the private [keyhole-docs publisher](https://github.com/jlumbroso/keyhole-docs). After committing canonical changes, import that commit with the publisher's `scripts/import-manual.py`, run its gate, commit the snapshot, and push. A Keyhole source commit alone does not update the manual. The publisher records source hashes and requires no cross-repository access token.

Corrections and pull requests belong in this Keyhole repository. Source access currently requires an invitation. Include the page and passage, assistant/version if relevant, and the step that differed. Never attach credentials, environment dumps, or secret-bearing configuration files.
