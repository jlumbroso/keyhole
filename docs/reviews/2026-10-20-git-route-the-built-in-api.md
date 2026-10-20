# How keyhole asks git: VS Code's built-in Git extension API answers both checks

- **Date**: 2026-10-20
- **By**: Surveyor 5.1 (Claude Fable 5.1), read not run
- **For**: Glazier's assignment in `docs/inbox/2026-10-20-1636-glazier-to-crew-keyhole-work-forward-assignments.md`: the route for the person's path's two questions, in the corrected order (tracked first, then ignored), either VS Code's Git extension API or `execFile` with the package check's ban on `child_process` lifted for git alone
- **Source**: VS Code at tags `1.134.0` and `1.141.0`, `extensions/git/src/` (`api/git.d.ts`, `api/api1.ts`, `api/extension.ts`, `main.ts`, `model.ts`, `repository.ts`, `git.ts`). Line numbers are at `1.141.0` unless marked; the 1.134.0 facts were checked separately.

## TL;DR

**Take the API route.** It answers both questions, at the 1.134.0 floor, with no process of keyhole's own, and the ban on `child_process` stays whole:

| Question | API call | Answer |
| --- | --- | --- |
| Is `<file>` tracked (in the index, not only HEAD)? | `repo.getObjectDetails('', absolutePath)` | resolves `{ mode, object, size }` when the index has it; rejects with `gitErrorCode === 'UnknownPath'` ("Path not known by git") when it does not |
| Is `<file>` ignored? | `repo.checkIgnore([absolutePath])` | resolves a `Set` containing the path when ignored, an empty `Set` when not; same `git check-ignore` as the command line, so a tracked file answers "not ignored" (hence the order) |
| Is there a repository at all? | `api.getRepository(uri)`, else `api.getRepositoryRoot(uri)` | `null` for "no repository" and for "unsafe repository"; `openRepository(root)` opens one VS Code has not opened |
| Is git usable at all? | `gitExtension.enabled`, `onDidChangeEnablement` | `false` when `git.enabled` is off or the git binary was not found; `getAPI(1)` throws "Git model not found" then |

Two things the route costs: the repository must be one VS Code has *opened* (or keyhole opens it, which adds it to the Source Control view), and the answers come from the same `git` the person's VS Code found, which is what we want.

## 1. The API exists at the floor

`extensions/git/src/api/git.d.ts` differs between 1.134.0 and 1.141.0 only by six additions (`getRemoteRefs`, `pushRefWithLease`, a widened `rebase`, `rebaseAbort`, `updateRef`, `resetKeep`). `checkIgnore` (L294), `getObjectDetails` (L254), `getRepository`, `getRepositoryRoot` (L427), `openRepository` (L436), `state` (L416) and `GitErrorCodes` are in both. The index branch of `getObjectDetails` is in `git.ts` at 1.134.0 too (L1598–1602). So nothing below depends on a version above the floor. The API is reached as the documented `GitExtension` export of `vscode.git` (`getAPI(1)`), with `@types/vscode` plus the copied `git.d.ts`.

## 2. "Is it tracked": the index, through `getObjectDetails`

`api1.ts` L131–133 passes `treeish` and `path` straight to `git.ts` `getObjectDetails` (L1607–1619). Its first branch:

```ts
if (!treeish || treeish === ':1' || treeish === ':2' || treeish === ':3') { // index
    const elements = await this.lsfiles(path);
    if (elements.length === 0) {
        throw new GitError({ message: 'Path not known by git', gitErrorCode: GitErrorCodes.UnknownPath });
    }
```

`lsfiles` runs `git ls-files --stage -- <path>` (L1652–1662), the index. An absolute path is made relative to the repository root first (`sanitizeRelativePath`, L3447 on). So:

- tracked, unmodified, modified or newly `git add`ed: resolves;
- untracked, ignored, never added, or removed from the index with `git rm --cached`: rejects with `gitErrorCode` `UnknownPath` (the enum's value is the string `'UnknownPath'`, `git.d.ts` L517);
- a *different* failure (git itself failing) rejects with another code or none, which keyhole treats as "cannot tell, stop".

This is the same question as `git ls-files --error-unmatch`, answered from the index, which is what the ADR's "tracked anyway" check needs. HEAD would be wrong in both directions (a file added but not committed; a file committed and then removed from the index); the index branch gets both right. (`repo.state.indexChanges` / `workingTreeChanges` would need a `status()` refresh and still cannot tell "tracked and clean" from "ignored", since neither appears; `getObjectDetails` is the direct answer.)

## 3. "Is it ignored": `checkIgnore`

`repository.ts` L2755–2818: the paths are filtered to descendants of the repository root (L2759–2760; a path outside returns nothing rather than an error), then `git check-ignore -v -z --stdin` runs with the paths on stdin (L2768, L2777). Exit 1 resolves an empty `Set` ("nothing ignored", L2781–2783); exit 0 resolves the paths whose matching pattern is not a negation (`parseIgnoreCheck`, L2820–2830, so `!.env` is honored); any other exit rejects, with `IsInSubmodule` recognized (L2785–2791). It is the same `check-ignore` the probe ran, so every finding of `2026-10-20-adr-0001-source-check.md` section 2 holds through the API: nested ignore files, the global excludes file and a path that does not exist yet all answer; **a tracked file answers "not ignored"**, which is why the index question comes first. The paths come back as given (absolute in, absolute out).

## 4. No repository, or git not usable

- **`api.getRepository(uri)`** returns `null` unless VS Code has *opened* a repository containing the path (`api1.ts` L455–458; `model.ts` L929–932 over the open repositories). "Not opened" is not "none": `git.autoRepositoryDetection` off, a repository in a parent folder with `git.openRepositoryInParentFolders` at its `prompt` default and not yet answered, or the initial scan still running (`api.state` is `'uninitialized'` until then, with `onDidChangeState`).
- **`api.getRepositoryRoot(uri)`** (L460–479) answers the real question: it runs `git rev-parse --show-toplevel` and returns `null` for `NotAGitRepository` and `NotASafeGitRepository` (the "dubious ownership" case), rethrowing anything else. Then **`api.openRepository(root)`** (L499–506) opens it, with `openIfClosed` and `openIfParent` both `true` (`model.ts` L600), and returns the `Repository`. The side effect is that the repository appears in the Source Control view, which is the honest state for a project keyhole is writing into.
- **Git not usable**: `main.ts` L210–232. With `git.enabled: false` the extension exports an object whose `enabled` is `false` until the setting changes; when the binary is not found, `createModel` throws, the extension warns the person ("Git not found", with the download offer) and `enabled` stays `false`. In both, `getAPI(1)` throws `Git model not found` (`api/extension.ts` L81–84). If the `vscode.git` extension itself is disabled, `vscode.extensions.getExtension('vscode.git')` is `undefined`. So keyhole reads `enabled` and subscribes to `onDidChangeEnablement` (`extension.ts` L28–45), and all three cases are "cannot check, refuse to write", with a message that names which.
- Worktrees and submodules are opened as their own repositories (`RepositoryKind`); a path inside a submodule is answered by that repository.

## 5. The sequence keyhole would run

1. `const ext = vscode.extensions.getExtension<GitExtension>('vscode.git')`; `undefined` → refuse ("the Git extension is disabled"). `await ext.activate()`; if `!ext.exports.enabled`, refuse and name `git.enabled` or the missing binary; `getAPI(1)`.
2. If `api.state !== 'initialized'`, wait for `onDidChangeState`.
3. `repo = api.getRepository(fileUri) ?? (root = await api.getRepositoryRoot(fileUri)) && await api.openRepository(root)`; `null` → refuse ("not in a git repository").
4. `await repo.getObjectDetails('', filePath)`: resolves → **tracked, stop**; rejects with `UnknownPath` → go on; rejects otherwise → refuse.
5. `(await repo.checkIgnore([filePath])).has(filePath)` → `true` go; `false` → refuse ("not ignored").

Every step reads; nothing here changes the repository.

## 6. If `execFile` were chosen instead

The ban on `child_process` would need the recorded exception, and keyhole would own the git path (`api.git.path`, `git.d.ts` L9–10, gives the one VS Code found, so even then the extension is the place to ask), the `cwd`, the exit-code mapping (0, 1, 128) and the `-z` parsing. The API already does all of that in the same process VS Code trusts. The only reason to run git oneself would be a repository VS Code refuses to open, which is a case keyhole should refuse too.

## What this does not settle

- The API's `getObjectDetails` is documented in `git.d.ts` only by its signature; the index branch is implementation. It has been stable from 1.134.0 to 1.141.0 (identical lines), and keyhole's mocked-VS Code tests can pin the contract keyhole relies on (`''` treeish, `UnknownPath` on miss).
- Nothing here was run against a real repository through the API; the by-hand check of the person's path covers it.
