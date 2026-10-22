# Instructions shown in Porthole, and versioned URLs that a browser fetches

- **Date**: 2026-10-21 (evening)
- **By**: Surveyor 5.1 (Claude Fable 5.1); read, not run, except the URL forms in section 3, which were fetched for their headers
- **For**: Glazier's brief `2026-10-22-0330-glazier-to-surveyor-instructions-in-porthole-and-versioned-urls.md`; ADR-0004 (QST-INSTRUCTIONS-SOURCE, B: "shipped" as "actually shipped" or "versioned URL", with a browser fetching and Keyhole never)
- **Sources**: porthole at `e466e8bd` (`src/outsideLinks.ts`, `src/keepToOneTab.ts`, `package.json`, ADR-0008, ADR-0013, ADR-0025); VS Code at tags `1.134.0` and `1.141.0` (paths under `src/vs/`; lines at 1.141.0, the 1.134.0 presence checked); six URL forms against porthole's own public repository

## TL;DR

| Question | Answer |
| --- | --- |
| 1. What Porthole's link opens | A **local file that exists**, `.html`, `.htm`, `.md` or `.markdown`, by real path; inside an open workspace folder by default, elsewhere only through `porthole.outsideLinks.allowedFolders` (a prompt adds the folder) or `allowLocalFiles`. Keyhole's extension folder is "elsewhere", and its name carries the version, so each release would prompt again unless the person allows all local files. A page opened from a file **can follow its links**, but every link to another page opens as a **new tab**, which Porthole's one-tab guard moves to the main window |
| 2. An `https://` URL | **Not today**: Porthole's link takes `file=` only and refuses anything that is not a local page. VS Code can do it at both tags without the extension fetching: the public command `workbench.action.browser.open` takes a URL, and Porthole's own one-shot takes a `viewState.url` for a `vscode-browser:` resource. Porthole would add a `url=` parameter, the `porthole.allowRemoteLinks` setting ADR-0008 already decided, and about ten lines in `miniWindow.ts` |
| 3. "Immutable" URL forms for a GitHub repository | Every first-party form that names a commit (`raw.githubusercontent.com/…/<sha>/…`, and the CDNs that front it) is immutable **and served as `text/plain` with `nosniff`**: a browser shows the source, not the page. GitHub Pages renders HTML and is mutable (the latest deploy; any tag path is the publisher's convention). Release assets are downloads. So no GitHub form is both immutable and rendered; **bundled** is the only route that is both |

## 1. Porthole's link handler

`src/outsideLinks.ts` at `e466e8bd`:

- **Grammar.** `/v1/open` (or `/open`) with `file=` and optional `width=`, `height=`, `repo=` (L15–16, L69–81). Unknown parameters are logged and ignored (L72–73); there is no `url=`.
- **What a file must be.** `resolveTarget` (L111–149): an absolute path is taken as given; a relative one is looked up in the window's local workspace folders (with `repo=`, only the folder of that name). The path is resolved to a **real path** (symbolic links and `..` settled, L139), must exist (L140), and must match `isPage`, `/\.(html?|md|markdown)$/i` (L22, L141). So: local, existing, HTML or Markdown; nothing else.
- **Which folders.** `allowedBy` (L155–169), in order: inside an open workspace folder when `porthole.outsideLinks.allowWorkspaceFolders` is on (default `true`); inside a folder listed in `porthole.outsideLinks.allowedFolders` (absolute paths, resolved); anywhere when `allowLocalFiles` is on (default `false`). Otherwise `askToOpen` (L177–194) shows a modal with **Open Once** and **Allow This Folder**, the latter adding the file's parent folder to the global `allowedFolders` list. The settings are `package.json` L218–248; the words are the naming review's (ADR-0013, QST-NAME-OPEN-WORDS).
- **Keyhole's extension folder.** `~/.vscode/extensions/jlumbroso.keyhole-<version>/…` is not a workspace folder, so a bundled instructions page there opens only after the prompt, and **Allow This Folder** stores the versioned folder path: the next Keyhole release lives in a new folder and prompts again, leaving a stale entry behind each time. The alternatives are `allowLocalFiles` (any local page, the person's choice, broad), a Porthole setting for extension folders (not built; a brief to Porthole), or Keyhole copying its pages into the workspace, which would then need its own ignore rule. ADR-0013's answer to QST-OPEN-ALLOWLIST (A and B) names `porthole.allowLocalFiles`, `porthole.allowRemoteLinks` and `porthole.allowLocalHost`; the first is built as `outsideLinks.allowLocalFiles`, the other two are not built.
- **Can the page follow its own links?** Yes, and where the link lands is VS Code's doing. A page opened from a file is a browser tab with an `associatedResource`; the main process's `will-navigate` and `will-redirect` handlers (`platform/browserView/electron-main/browserView.ts` L332–346) call `_redirectPinnedNavigation` (L764–775): any navigation away from the associated file is cancelled and opened as a **child tab** (`_createChildView` with `pinned: true, parentViewId`), which the workbench places in the parent's editor group (`contrib/browserView/electron-browser/browserViewWorkbenchService.ts` L550–551). Same at 1.134.0 (L323, L335). In a Porthole floating window that is a second tab, and Porthole's guard (`src/keepToOneTab.ts`, ADR-0025) moves an extra tab to the main window by default (`move`; `ask` and `off` exist). Net: the instructions page stays in the small window, and the service's sign-in page opens in the main window, at full size, which is a reasonable place for a sign-in. Links a page opens with `target="_blank"` go through the window-open handler and its popup budget (L187–216, one per user gesture; `consumePopupPermission`, L544 at 1.134.0) and land the same way. A page with **no** associated resource (section 2's URL route) navigates in place instead; only `_blank` links become tabs.

## 2. An `https://` page, at both tags

- **Porthole today**: no. `file=` is the only subject, and `resolveTarget` refuses anything that is not an existing local page.
- **VS Code, public command.** `workbench.action.browser.open` (`contrib/browserView/common/browserView.ts` L19) accepts a URL string or `{ url, openToSide, reuseUrlFilter }` (`electron-browser/features/browserTabManagementFeatures.ts` L261–271, run at L284–332) and opens `editorService.openEditor({ resource: BrowserViewUri.forId(generateUuid()), options: { viewState: { url } } }, group)` (L332). Identical signature at 1.134.0 (L284–290). The extension fetches nothing: the browser view's web contents, in the main process, does. The fallback shape for Porthole would be this command, then `moveEditorToNewWindow`, as its file fallback does.
- **VS Code, the one-shot.** The `vscode-browser:` registration reads `options.viewState` into the input at both tags (`electron-browser/browserView.contribution.ts`, 1.134.0 L80 `getOrCreateLazy(parsed.id, options?.viewState)`; 1.141.0 L91–94), `IBrowserEditorViewState` has `url` at both (`common/browserView.ts` 1.134.0 L168–171, 1.141.0 L197–201), and `_workbench.openWith` passes its options through unchanged (`browser/parts/editor/editorCommands.ts` L549–551: `{ pinned: true, ...optionsArg, override: id }`). So `_workbench.openWith(BrowserViewUri-shaped URI 'vscode-browser:/<uuid>', 'workbench.editor.browser', [-3, { auxiliary: {…}, viewState: { url } }])` opens the page sized, compact and pinned in one call, exactly as the file route does; `singlePerResource` holds per id. Read, not run; it is the same handler Spike 0 proved for files, with a different resource and one more option.
- **What Porthole would add**: a `url=` parameter in the link grammar (its name through the naming review, ADR-0017), the allowlist ADR-0008 decided (`https://` only with `porthole.allowRemoteLinks`, off by default; ADR-0013's answer repeats it), and the one-shot above with the fallback. Nothing in Porthole's package would fetch anything either.

## 3. What "immutable" can mean for a URL on GitHub

Fetched 2026-10-21, for `samples/tasks.html` in porthole's public repository at commit `e466e8bd…` and tag `v0.4.1`; `curl -I`, following redirects, with and without a browser user agent.

| Form | Immutable? | What a browser gets | Renders HTML? |
| --- | --- | --- | --- |
| `https://raw.githubusercontent.com/<owner>/<repo>/<sha>/<path>` | yes (a commit) | `200`, `content-type: text/plain; charset=utf-8`, `x-content-type-options: nosniff`, `cache-control: max-age=300` | **no**: the source is shown as text |
| `https://github.com/<owner>/<repo>/blob/<sha>/<path>?raw=1` | yes | `302` to `…/raw/<sha>/…`, `302` to `raw.githubusercontent.com` (above) | no |
| `https://cdn.jsdelivr.net/gh/<owner>/<repo>@<sha>/<path>` | yes, and served with `cache-control: … immutable` | `text/plain; charset=utf-8`, `nosniff` | no (jsDelivr serves HTML as text on purpose) |
| `https://cdn.jsdelivr.net/gh/<owner>/<repo>@<tag>/<path>` | a tag can be moved; jsDelivr caches it as immutable regardless | same | no |
| `https://cdn.statically.io/gh/<owner>/<repo>/<sha>/<path>` | yes | `301`, then `text/plain`, `immutable` | no |
| `https://raw.githack.com/…/<sha>/…` and `rawcdn.githack.com` | by reputation it renders; **could not be verified**: `403` to every fetch from here, with or without a browser user agent | | unknown, and a third party |
| `https://github.com/<owner>/<repo>/releases/download/<tag>/<asset>` | a release's assets can be replaced and a tag moved | `302`, then `application/octet-stream`, `content-disposition: attachment` | no: a download |
| GitHub Pages, `https://<owner>.github.io/<site>/…` | **no**: it is the latest deploy of the site (`cache-control: max-age=600`); a `/v0.4.1/` path is only the publisher's convention and can be republished | `text/html` | **yes** |

What follows:

- A URL that is both pinned by content and rendered by a browser does not exist on GitHub's first-party hosts. Rendering lives on GitHub Pages, whose URLs are mutable by the publisher; content pinning lives on raw and the CDNs, which refuse to render.
- "Versioned URL" can therefore mean only a Pages path the Keyhole release names (`…/instructions/v<keyhole version>/render.html`), immutable by the project's own discipline (a workflow that only ever adds version folders, never rewrites one), not by the host. That is a weaker promise than a commit, and the review process ADR-0004 relies on (an edit must pass a reviewer and a release) would have to include "the workflow may not touch an existing version folder", enforced in CI.
- **Bundled** has the property for free: a page inside the `.vsix` cannot change after the Marketplace accepts the version, and it opens through Porthole's file route, which exists today. Its one cost is section 1's folder prompt, which a Porthole setting for extension folders (or `allowLocalFiles`) removes.
- Either way, the pages can be Markdown, which Porthole renders through VS Code's own preview (porthole ADR-0015), so the instructions repository can hold `.md` files that render both on GitHub and in the floating window.

## What this does not settle

- Whether a `vscode-browser:` resource with a `viewState.url` opens into group `-3` as cleanly as a file does: read, not run; a Spike 0 variant.
- githack's behavior; the host refused every fetch from this machine.
- Whether the sign-in page landing in the main window (section 1) is the behavior the person wants, or whether Porthole's guard should leave browser child tabs in place; that is Porthole's question (ADR-0025 has the three modes).
