// What git says about a file keyhole is about to write (ADR-0001, Surveyor
// 5.1's corrected order): tracked first, because git answers "not ignored" for
// a tracked file even when a rule matches it; then ignored. A folder that is
// not a repository is a third outcome, not an error.
//
// How the facts are obtained is behind this interface on purpose: VS Code's
// Git extension API, or running git itself, is being read in source now
// (Surveyor's assignment, 2026-10-20). The rest of keyhole does not care which.

export type Protection =
  | 'protected'   // in a repository, not tracked, and ignored: safe to write
  | 'tracked'     // git tracks the file: writing would put the secret in the next commit
  | 'not-ignored' // in a repository, untracked, but no rule ignores it: the next `git add .` would take it
  | 'no-repository';

export interface GitFacts {
  /** The file's protection, for a path relative to the workspace folder; works before the file exists. */
  protection(folderPath: string, relativePath: string): Promise<Protection>;
}
