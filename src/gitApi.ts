import { lstat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import * as vscode from 'vscode';
import type { GitFacts, Protection } from './git';

// git's facts through VS Code's built-in Git extension (Surveyor 5.1's report,
// docs/reviews/2026-10-20-git-route-the-built-in-api.md, section 5). Nothing
// here starts a process of keyhole's own, so the package check's ban on
// child_process stays whole; and every step only reads.
//
// The few members keyhole uses, from extensions/git/src/api/git.d.ts (present
// from 1.134.0 to 1.141.0 alike). The empty-treeish behavior of
// getObjectDetails (it reads the index) is the extension's implementation, not
// a documented promise, so the tests pin it.

interface Repository {
  getObjectDetails(treeish: string, path: string): Promise<unknown>;
  checkIgnore(paths: string[]): Promise<Set<string>>;
}
interface GitApi {
  readonly state: 'uninitialized' | 'initialized';
  readonly onDidChangeState: vscode.Event<'uninitialized' | 'initialized'>;
  getRepository(uri: vscode.Uri): Repository | null;
  getRepositoryRoot(uri: vscode.Uri): Promise<vscode.Uri | null>;
  openRepository(root: vscode.Uri): Promise<Repository | null>;
}
interface GitExtension {
  readonly enabled: boolean;
  getAPI(version: 1): GitApi;
}

/** The first `.git` (a folder, or a file for a worktree or submodule) in `start` or above it, if any. */
async function gitMarkerAbove(start: string): Promise<string | undefined> {
  let current = start;
  for (;;) {
    try {
      await lstat(join(current, '.git'));
      return current;
    } catch { /* none here */ }
    const parent = dirname(current);
    if (parent === current) { return undefined; }
    current = parent;
  }
}

/** How long to wait for the Git extension to finish starting before saying so. */
export const READY_TIMEOUT_MS = 10_000;

async function gitApi(): Promise<GitApi | string> {
  const extension = vscode.extensions.getExtension<GitExtension>('vscode.git');
  if (!extension) { return 'VS Code\'s built-in Git extension is disabled'; }
  const exports = extension.isActive ? extension.exports : await extension.activate();
  if (!exports.enabled) { return 'git is turned off in VS Code (the git.enabled setting) or is not installed'; }
  const api = exports.getAPI(1);
  if (api.state === 'initialized') { return api; }
  const ready = await new Promise<boolean>(resolve => {
    const timer = setTimeout(() => { subscription.dispose(); resolve(false); }, READY_TIMEOUT_MS);
    const subscription = api.onDidChangeState(state => {
      if (state === 'initialized') { clearTimeout(timer); subscription.dispose(); resolve(true); }
    });
  });
  return ready ? api : 'VS Code\'s Git extension did not finish starting';
}

export const gitThroughVsCode: GitFacts = {
  async protection(folderPath: string, relativePath: string): Promise<Protection> {
    const api = await gitApi();
    if (typeof api === 'string') { return { unavailable: api }; }
    const file = vscode.Uri.file(join(folderPath, relativePath));
    let repository = api.getRepository(file);
    if (!repository) {
      const root = await api.getRepositoryRoot(file); // null: not a repository, or one git calls unsafe
      repository = root ? await api.openRepository(root) : null;
    }
    if (!repository) {
      // The API's null means two things: no repository, or one git refuses
      // ("dubious ownership"). Only the first is safe to write in, so look
      // for a `.git` ourselves, without a process (regression test, 2026-10-24).
      const marker = await gitMarkerAbove(dirname(file.fsPath));
      if (marker) {
        return { unavailable: `${marker} belongs to a git repository that VS Code's Git extension did not open (git may consider it unsafe, for example when the folder belongs to another user), so Keyhole cannot check that .env stays out of commits. Run "git status" in a terminal in that folder to see why` };
      }
      return 'no-repository';
    }
    try {
      await repository.getObjectDetails('', file.fsPath); // '' reads the index: resolves when the file is tracked
      return 'tracked';
    } catch (err) {
      if ((err as { gitErrorCode?: string }).gitErrorCode !== 'UnknownPath') {
        return { unavailable: `git could not read its index (${err instanceof Error ? err.message : String(err)})` };
      }
    }
    const ignored = await repository.checkIgnore([file.fsPath]);
    return ignored.has(file.fsPath) ? 'protected' : 'not-ignored';
  },
};
