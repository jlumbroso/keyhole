# Keyhole manual

Read the [manual site](https://jlumbroso.github.io/keyhole-docs/) or visit the [product page](https://jlumbroso.github.io/keyhole/). The extension's first release is in preparation.

These are the canonical sources. Three introductory/reference chapters are authored as HTML fragments under `content/`. [Keeping secrets out of the conversation](keeping-secrets-out-of-the-conversation.md) remains Markdown; run `node docs/manual/scripts/render-protections.mjs` from the Keyhole root after changing it. Its checked date concerns vendor documentation/source, not exercised assistant sessions.

`python3 docs/manual/scripts/build.py` produces the complete manual in `docs/manual/_site/`: four pages, per-page Markdown, `manual.md`, and `llms.txt`. Reading works without JavaScript; copying and theme choice are progressive additions. The build checks output allowlists, links, anchors, exact copy payloads, and preservation of the original chapter's code and citations.

Publication uses the private [keyhole-docs publisher](https://github.com/jlumbroso/keyhole-docs). After committing canonical changes, import that commit with the publisher's `scripts/import-manual.py`, run its gate, commit the snapshot, and push. A Keyhole source commit alone does not update the manual. The publisher records source hashes and requires no cross-repository access token.

Corrections and pull requests belong in this Keyhole repository. Source access currently requires an invitation. Include the page and passage, assistant/version if relevant, and the step that differed. Never attach credentials, environment dumps, or secret-bearing configuration files.
