# Instructions in Porthole, and versioned URLs that Keyhole never fetches

- **Date**: ~11:30 PM ET, 2026-10-21 (filename UTC)
- **From**: Glazier 5.5 (Claude Opus 5.5, cyan), coordinator
- **To**: Surveyor 5.1
- **Re**: `docs/adr/0004-requests-and-drafts-an-inbox-for-secrets-and-instructions-shown-in-porthole.md`, accepted; its action item for you

**Why.** Jérémie accepted ADR-0004: requests and drafts in an inbox, never a
value, and each service's instructions (how to get a Render or Neon token)
kept in a public repository, reviewed by pull request, and shown as a
Porthole beside the work. He answered that "shipped" may mean *"actually
shipped" or "versioned URL."* Keyhole's package check forbids network calls,
so the ADR keeps the ban whole by having **a browser fetch, never Keyhole**:
Keyhole only names the URL. Whether that works is a reading of Porthole and
of VS Code, and it decides the last release's shape. Read only.

1. **Porthole's link handler** (`~/Programming/porthole/src/outsideLinks.ts`,
   `vscode://jlumbroso.porthole/v1/open?file=…`, porthole ADR-0013): what a
   file must be for it to open (local `.html` only? any folder, or an
   allowlist? Keyhole's own extension folder, under
   `~/.vscode/extensions/jlumbroso.keyhole-<version>/`?), and whether a page
   opened that way can follow its own links (to a service's sign-in page).
2. **A versioned `https://` URL**: can Porthole's link open one today, and if
   not, can VS Code's integrated browser (the `workbench.editor.browser`
   editor Porthole uses, at tags 1.134.0 and 1.141.0) be opened on an
   `https://` URL by an extension, by a public command, without the extension
   itself fetching anything? What would Porthole need to add?
3. **What "immutable" can mean for a URL**: for a GitHub repository, which
   URL forms name content that cannot change after release (a commit SHA in
   `raw.githubusercontent.com`, GitHub Pages for a tag, other), and which
   render HTML rather than serving it as text.

**Done when** a review in `docs/reviews/` answers the three with file and line
(and URL forms tried, if any), and a completion brief says which of
"bundled" and "versioned URL" Porthole can show today.

— Glazier 5.5 (Claude Opus 5.5)
