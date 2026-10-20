import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gitThroughVsCode, READY_TIMEOUT_MS } from '../gitApi';
import { resetExtensions, setExtension } from './helpers/vscodeMock';

// git's facts through VS Code's Git extension (Surveyor 5.1's report,
// docs/reviews/2026-10-20-git-route-the-built-in-api.md). The fake below plays
// the extension's documented members and pins the one undocumented contract
// keyhole relies on: getObjectDetails('', path) reads the index, resolving for
// a tracked file and rejecting with gitErrorCode 'UnknownPath' otherwise.

const FOLDER = '/work/project';
const ENV = `${FOLDER}/.env`;

interface Fake {
  tracked?: boolean;
  ignored?: boolean;
  indexError?: string;
  repository?: 'open' | 'closed' | 'none';
  state?: 'initialized' | 'uninitialized';
  enabled?: boolean;
}

function installGit(fake: Fake = {}) {
  const repository = {
    getObjectDetails: vi.fn(async (treeish: string, path: string) => {
      expect(treeish).toBe(''); // the index, not HEAD: a newly added file must count as tracked
      if (fake.indexError) { throw Object.assign(new Error('index unreadable'), { gitErrorCode: fake.indexError }); }
      if (fake.tracked) { return { mode: '100644', object: 'abc', size: 1 }; }
      throw Object.assign(new Error(`no such path ${path}`), { gitErrorCode: 'UnknownPath' });
    }),
    checkIgnore: vi.fn(async (paths: string[]) => new Set(fake.ignored ? paths : [])),
  };
  const listeners: Array<(state: string) => void> = [];
  const api = {
    state: fake.state ?? 'initialized',
    onDidChangeState: (listener: (state: string) => void) => { listeners.push(listener); return { dispose() {} }; },
    getRepository: () => (fake.repository ?? 'open') === 'open' ? repository : null,
    getRepositoryRoot: async () => (fake.repository === 'none' ? null : { fsPath: FOLDER }),
    openRepository: vi.fn(async () => (fake.repository === 'none' ? null : repository)),
  };
  setExtension('vscode.git', { isActive: true, exports: { enabled: fake.enabled ?? true, getAPI: () => api } });
  return { repository, api, initialize: () => { api.state = 'initialized'; listeners.forEach(listener => listener('initialized')); } };
}

beforeEach(() => { resetExtensions(); });

describe('what git says about .env', () => {
  it('protected: untracked, and a rule ignores it', async () => {
    installGit({ tracked: false, ignored: true });
    expect(await gitThroughVsCode.protection(FOLDER, '.env')).toBe('protected');
  });

  it('tracked comes first, whatever the ignore rules say (git reports a tracked file as not ignored)', async () => {
    const { repository } = installGit({ tracked: true, ignored: true });
    expect(await gitThroughVsCode.protection(FOLDER, '.env')).toBe('tracked');
    expect(repository.checkIgnore).not.toHaveBeenCalled();
  });

  it('not-ignored: untracked, and no rule ignores it', async () => {
    installGit({ tracked: false, ignored: false });
    expect(await gitThroughVsCode.protection(FOLDER, '.env')).toBe('not-ignored');
  });

  it('asks about the absolute path of the file in the folder', async () => {
    const { repository } = installGit({ ignored: true });
    await gitThroughVsCode.protection(FOLDER, '.env');
    expect(repository.getObjectDetails).toHaveBeenCalledWith('', ENV);
    expect(repository.checkIgnore).toHaveBeenCalledWith([ENV]);
  });
});

describe('when there is no repository, or git cannot be asked', () => {
  it('opens a repository VS Code has not opened yet, rather than calling it missing', async () => {
    const { api } = installGit({ repository: 'closed', ignored: true });
    expect(await gitThroughVsCode.protection(FOLDER, '.env')).toBe('protected');
    expect(api.openRepository).toHaveBeenCalled();
  });

  it('no-repository when the folder is not in one', async () => {
    installGit({ repository: 'none' });
    expect(await gitThroughVsCode.protection(FOLDER, '.env')).toBe('no-repository');
  });

  it('says so when the built-in Git extension is disabled, or git is turned off', async () => {
    expect(await gitThroughVsCode.protection(FOLDER, '.env')).toEqual({ unavailable: expect.stringMatching(/Git extension is disabled/) });
    installGit({ enabled: false });
    expect(await gitThroughVsCode.protection(FOLDER, '.env')).toEqual({ unavailable: expect.stringMatching(/git\.enabled/) });
  });

  it('refuses rather than guesses when the index cannot be read', async () => {
    installGit({ indexError: 'SomethingElse' });
    expect(await gitThroughVsCode.protection(FOLDER, '.env')).toEqual({ unavailable: expect.stringMatching(/could not read its index/) });
  });

  it('waits for the Git extension to finish starting, and says so if it never does', async () => {
    const git = installGit({ state: 'uninitialized', ignored: true });
    const answer = gitThroughVsCode.protection(FOLDER, '.env');
    git.initialize();
    expect(await answer).toBe('protected');

    vi.useFakeTimers();
    installGit({ state: 'uninitialized' });
    const stuck = gitThroughVsCode.protection(FOLDER, '.env');
    await vi.advanceTimersByTimeAsync(READY_TIMEOUT_MS + 1);
    expect(await stuck).toEqual({ unavailable: expect.stringMatching(/did not finish starting/) });
    vi.useRealTimers();
  });
});
