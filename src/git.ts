// What git says about a file keyhole is about to write (ADR-0001, Surveyor
// 5.1's corrected order): tracked first, because git answers "not ignored" for
// a tracked file even when a rule matches it; then ignored. A folder that is
// not a repository is a third outcome, not an error.
//
// How the facts are obtained is behind this interface on purpose; the one
// implementation asks VS Code's built-in Git extension (src/gitApi.ts,
// Surveyor 5.1's reading of the route, 2026-10-20), so keyhole starts no
// process of its own. The rest of keyhole does not care how.

export type Protection =
  | 'protected'   // in a repository, not tracked, and ignored: safe to write
  | 'tracked'     // git tracks the file: writing would put the secret in the next commit
  | 'not-ignored' // in a repository, untracked, but no rule ignores it: the next `git add .` would take it
  | 'no-repository'
  | { unavailable: string }; // git cannot be asked: the reason, in words a person can act on

export interface GitFacts {
  /** The file's protection, for a path relative to the workspace folder; works before the file exists. */
  protection(folderPath: string, relativePath: string): Promise<Protection>;
}
