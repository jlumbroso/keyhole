import { describe, expect, it } from 'vitest';
import { release, type World } from '../../scripts/release.mjs';

// `just release` must be idempotent: each step reads its post-condition from the world, skips when it holds, and a
// re-run after a failure resumes at the first step that is not done. These scenarios are the ones that happened
// (0.1.0, 0.2.0) or that ADR-0012 says must be handled. The world is a small state machine, so an action changes what
// the next read sees, as it would for real.

interface State {
  head: string;
  tagSha: string | null;
  sameContent: boolean;
  ci: 'green' | 'pending' | 'red' | 'none';
  releaseAssets: string[] | null;
  releaseRun: { status: string; conclusion?: string } | null;
  ovsxRun: { status: string; conclusion?: string } | null;
  ovsx: string | null;
  marketplace: string | null;
  preconditionsOk: boolean;
  marketplaceResult: { ok?: boolean; alreadyPublished?: boolean; error?: string };
  ovsxTokenResult: { ok?: boolean; alreadyPublished?: boolean; error?: string };
  calls: string[];
}

const fresh = (over: Partial<State> = {}): State => ({
  head: 'aaaaaaa1', tagSha: null, sameContent: true, ci: 'green', releaseAssets: null, releaseRun: null, ovsxRun: null,
  ovsx: null, marketplace: null, preconditionsOk: true, marketplaceResult: { ok: true }, ovsxTokenResult: { ok: true }, calls: [], ...over,
});

function worldOf(s: State, hooks: { afterTag?: (() => void)[] } = {}): World {
  let pending: (() => void)[] = [];   // what CI does after the tag is pushed, one effect per wait
  return {
    sleep: async () => { pending.shift()?.(); },
    preconditions: async () => [{ what: 'everything is committed', ok: s.preconditionsOk, detail: 'x' }],
    headSha: async () => s.head,
    remoteTag: async () => s.tagSha,
    sameContent: async () => s.sameContent,
    ci: async () => s.ci,
    createTag: async (tag, sha) => { s.calls.push(`tag ${tag}`); s.tagSha = sha; pending = [...(hooks.afterTag ?? [])]; },
    githubRelease: async () => (s.releaseAssets ? { assets: s.releaseAssets } : null),
    releaseRun: async () => s.releaseRun,
    openVsxRun: async () => s.ovsxRun,
    openVsxVersion: async () => s.ovsx,
    marketplaceVersion: async () => s.marketplace,
    downloadVsix: async () => '/tmp/keyhole-0.5.0.vsix',
    publishMarketplace: async () => { s.calls.push('marketplace'); if (s.marketplaceResult.ok) { s.marketplace = '0.5.0'; } return s.marketplaceResult; },
    publishOpenVsxWithToken: async () => { s.calls.push('ovsx-token'); if (s.ovsxTokenResult.ok) { s.ovsx = '0.5.0'; } return s.ovsxTokenResult; },
  };
}

const opts = { version: '0.5.0', polls: 3, pollMs: 0 };
const states = (r: { steps: { name: string; state: string }[] }) => Object.fromEntries(r.steps.filter(x => !x.name.startsWith('precondition')).map(x => [x.name, x.state]));

describe('release: one command that asserts a destination', () => {
  it('does nothing when everything is already released', async () => {
    const s = fresh({ tagSha: 'aaaaaaa1', releaseAssets: ['keyhole-0.5.0.vsix'], ovsx: '0.5.0', marketplace: '0.5.0' });
    const r = await release(worldOf(s), opts);
    expect(r.ok).toBe(true);
    expect(s.calls).toEqual([]);
    expect(states(r)).toMatchObject({ tag: 'done', 'github release': 'done', 'open vsx': 'done', marketplace: 'done', verify: 'ok' });
  });

  it('a dry run reports what it would do and changes nothing', async () => {
    const s = fresh();
    const r = await release(worldOf(s), { ...opts, dryRun: true });
    expect(r.ok).toBe(true);
    expect(s.calls).toEqual([]);
    expect(states(r)).toMatchObject({ tag: 'would', 'github release': 'would', 'open vsx': 'would', marketplace: 'would' });
  });

  it('stops at a failed precondition, before creating the tag', async () => {
    const s = fresh({ preconditionsOk: false });
    const r = await release(worldOf(s), opts);
    expect(r.ok).toBe(false);
    expect(s.calls).toEqual([]);
  });

  it('never moves a tag: a tag on a commit whose files differ stops the release', async () => {
    // 0.1.0's tag was moved once, only because nobody had used it yet; the repository now forbids it
    const s = fresh({ tagSha: 'bbbbbbb2', sameContent: false });
    const r = await release(worldOf(s), opts);
    expect(r.ok).toBe(false);
    expect(r.steps.at(-1)?.detail).toMatch(/never moved/);
    expect(s.calls).toEqual([]);
  });

  it('accepts a tag on an earlier commit when only docs/ changed since (docs commits keep landing after a tag)', async () => {
    const s = fresh({ tagSha: 'bbbbbbb2', sameContent: true, releaseAssets: ['keyhole-0.5.0.vsix'], ovsx: '0.5.0', marketplace: '0.5.0' });
    const r = await release(worldOf(s), opts);
    expect(r.ok).toBe(true);
    expect(s.calls).toEqual([]);
  });

  it('"the tag exists" is not "released": 0.1.0 had its tag while the release job had failed', async () => {
    // release.yml died on a clean checkout (ENOTDIR on releases/); the tag was there, the Release was not
    const s = fresh({ tagSha: 'aaaaaaa1', releaseAssets: null, releaseRun: { status: 'completed', conclusion: 'failure' } });
    const r = await release(worldOf(s), opts);
    expect(r.ok).toBe(false);
    expect(states(r)).toMatchObject({ tag: 'done', 'github release': 'stop' });
    expect(r.steps.at(-1)?.detail).toMatch(/do not move the tag/);
    expect(s.calls).toEqual([]);   // and neither registry was touched
  });

  it('refuses to start without a green CI run on the commit being released', async () => {
    const red = fresh({ ci: 'red' });
    expect((await release(worldOf(red), opts)).ok).toBe(false);
    expect(red.calls).toEqual([]);
    const missing = fresh({ ci: 'none' });
    expect((await release(worldOf(missing), opts)).ok).toBe(false);
    expect(missing.calls).toEqual([]);
  });

  it('a full release from nothing creates the tag, then publishes the Release\'s file to both registries', async () => {
    const s = fresh();
    // CI builds the Release and the workflow publishes to Open VSX once the tag exists
    const r = await release(worldOf(s, { afterTag: [() => { s.releaseAssets = ['keyhole-0.5.0.vsix']; }, () => { s.ovsx = '0.5.0'; }] }), opts);
    expect(r.ok).toBe(true);
    expect(s.calls).toEqual(['tag v0.5.0', 'marketplace']);
    expect(states(r)).toMatchObject({ tag: 'acted', 'github release': 'acted', 'open vsx': 'acted', marketplace: 'acted', verify: 'ok' });
  });

  it('a registry that already has the version when we publish counts as done, not as a failure (registry lag)', async () => {
    // the Marketplace showed the old version for about 15 minutes after the 0.2.0 publish; a re-run then tries again
    const s = fresh({ tagSha: 'aaaaaaa1', releaseAssets: ['keyhole-0.5.0.vsix'], ovsx: '0.5.0', marketplace: '0.4.0', marketplaceResult: { alreadyPublished: true } });
    const r = await release(worldOf(s), opts);
    expect(r.ok).toBe(true);
    expect(states(r).marketplace).toBe('acted');
    expect(r.steps.find(x => x.name === 'marketplace')?.detail).toMatch(/already published: done/);
    expect(states(r).verify).toBe('pending');   // still not visible: reported as lag, not failure
  });

  it('after Open VSX succeeded and the Marketplace failed, a re-run resumes at the Marketplace only', async () => {
    const s = fresh({ tagSha: 'aaaaaaa1', releaseAssets: ['keyhole-0.5.0.vsix'], ovsx: '0.5.0', marketplaceResult: { ok: false, error: 'token expired' } });
    const first = await release(worldOf(s), opts);
    expect(first.ok).toBe(false);
    expect(first.steps.at(-1)?.detail).toBe('token expired');
    s.marketplaceResult = { ok: true };   // the person renews the token
    s.calls.length = 0;
    const second = await release(worldOf(s), opts);
    expect(second.ok).toBe(true);
    expect(s.calls).toEqual(['marketplace']);   // not the tag, not Open VSX
  });

  it('falls back to the token for Open VSX only when asked to, and only after the workflow failed', async () => {
    const base = { tagSha: 'aaaaaaa1', releaseAssets: ['keyhole-0.5.0.vsix'], ovsxRun: { status: 'completed', conclusion: 'failure' }, marketplace: '0.5.0' };
    const without = fresh(base);
    expect((await release(worldOf(without), opts)).ok).toBe(false);
    expect(without.calls).toEqual([]);
    const withFallback = fresh(base);
    const r = await release(worldOf(withFallback), { ...opts, ovsxFallback: true });
    expect(r.ok).toBe(true);
    expect(withFallback.calls).toEqual(['ovsx-token']);
  });

  it('does not use the token when the workflow succeeded but the registry has not shown the version yet', async () => {
    const s = fresh({ tagSha: 'aaaaaaa1', releaseAssets: ['keyhole-0.5.0.vsix'], ovsxRun: { status: 'completed', conclusion: 'success' }, marketplace: '0.5.0' });
    const r = await release(worldOf(s), { ...opts, ovsxFallback: true });
    expect(r.ok).toBe(true);
    expect(s.calls).toEqual([]);   // a duplicate upload would only fail; validation takes a few minutes
    expect(states(r)['open vsx']).toBe('pending');
  });

  it('does not use the token while the workflow is still queued or running (0.4.1: an Actions incident held it ten minutes)', async () => {
    // the fallback once fired while the run was queued and printed a misleading "published with OVSX_PAT"
    const s = fresh({ tagSha: 'aaaaaaa1', releaseAssets: ['keyhole-0.5.0.vsix'], ovsxRun: { status: 'queued' }, marketplace: '0.5.0' });
    const r = await release(worldOf(s), { ...opts, ovsxFallback: true });
    expect(r.ok).toBe(false);
    expect(s.calls).toEqual([]);
    expect(r.steps.at(-1)?.detail).toMatch(/still queued/);
  });

  it('waits longer for a queued run, and takes its result when it comes', async () => {
    const s = fresh({ tagSha: 'aaaaaaa1', releaseAssets: ['keyhole-0.5.0.vsix'], ovsxRun: { status: 'queued' }, marketplace: '0.5.0' });
    let waits = 0;
    const world = worldOf(s);
    world.sleep = async () => { waits++; if (waits === 5) { s.ovsx = '0.5.0'; } };   // later than the plain bound of 3 checks
    const r = await release(world, { ...opts, ovsxFallback: true });
    expect(r.ok).toBe(true);
    expect(s.calls).toEqual([]);
    expect(states(r)['open vsx']).toBe('acted');
    expect(r.steps.find(x => x.name === 'open vsx')?.detail).toMatch(/trusted publishing/);
  });

  it('reports "already published" from the fallback as done, not as published with the token', async () => {
    const s = fresh({ tagSha: 'aaaaaaa1', releaseAssets: ['keyhole-0.5.0.vsix'], ovsxRun: { status: 'completed', conclusion: 'failure' }, ovsxTokenResult: { alreadyPublished: true }, marketplace: '0.5.0' });
    const r = await release(worldOf(s), { ...opts, ovsxFallback: true });
    expect(r.ok).toBe(true);
    expect(states(r)['open vsx']).toBe('done');
    expect(r.steps.find(x => x.name === 'open vsx')?.detail).not.toMatch(/with OVSX_PAT/);
  });
});
