// `just release X.Y.Z`: "X.Y.Z is released everywhere", as an idempotent command (ADR-0012, option D).
// Every step has an observable post-condition READ FROM THE WORLD (git remote, GitHub, the two registries), is
// skipped when it already holds, and is acted on otherwise. So a re-run after any failure resumes at the first
// step that is not done, and running it twice, or from two machines, does no harm. No step undoes another.
//
//   0 preconditions (read-only; a failure STOPS, it never "skips")
//   1 tag            the remote has vX.Y.Z at the commit being released
//   2 GitHub Release a Release exists and carries keyhole-X.Y.Z.vsix (built by CI from the tag)
//   3 Open VSX       the registry shows X.Y.Z (published by the workflow; --ovsx-fallback publishes with OVSX_PAT
//                    if the workflow failed: the fallback is kept until one real release has gone through the workflow)
//   4 Marketplace    the registry shows X.Y.Z (publishes the Release's .vsix with VSCE_PAT)
//   5 verify         both registries show it; a registry that has not caught up is lag, not failure
//
// Usage: node scripts/release.mjs X.Y.Z [--dry-run] [--ovsx-fallback]
//   --dry-run  prints what each step finds and what it would do, changes nothing (`just release-status`)
//
// The logic is `release(world, options)`; the real world is `realWorld()` below, and the tests (src/test/release.test.ts)
// feed it recorded situations. Token values are read from .env into child processes only and are never printed.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function release(world, { version, dryRun = false, ovsxFallback = false, polls = 30, pollMs = 20_000 }) {
  const tag = `v${version}`;
  const vsixName = `keyhole-${version}.vsix`;
  const steps = [];
  const note = (name, state, detail = '') => { steps.push({ name, state, detail }); world.say?.(name, state, detail); };
  const finish = ok => ({ ok, steps });
  const stop = (name, detail) => { note(name, 'stop', detail); return finish(false); };
  const when = (acted, ifDry) => (dryRun ? ifDry : acted);

  // 0. preconditions: read-only, and a failure stops here
  const failed = [];
  for (const check of await world.preconditions(version)) {
    note(`precondition: ${check.what}`, check.ok ? 'ok' : 'stop', check.detail ?? '');
    if (!check.ok) { failed.push(check.what); }
  }
  // a real run stops here; a dry run is a status report, so it keeps reading and reports the failure at the end
  if (failed.length && !dryRun) { return finish(false); }
  const finishAll = ok => finish(ok && failed.length === 0);

  // 1. tag. An existing tag is accepted at HEAD, or at an ancestor whose files outside docs/ equal HEAD's (docs-only
  //    commits after a tag do not change what ships). A tag on a different commit is never moved.
  const head = await world.headSha();
  let sha = await world.remoteTag(tag);
  if (sha && sha !== head && !(await world.sameContent(sha, head)) && dryRun) {
    note('tag', 'done', `${tag} is on ${sha.slice(0, 7)}, an earlier release commit (HEAD has moved on); reading the rest of the status from that tag`);
  } else if (sha && sha !== head && !(await world.sameContent(sha, head))) {
    return stop('tag', `${tag} exists on ${sha.slice(0, 7)}, a commit whose files differ from HEAD (${head.slice(0, 7)}). A tag is never moved: release a new version instead.`);
  }
  // CI must be green for the commit being released, before anything is created
  const releasing = sha ?? head;
  let ci = await world.ci(releasing);
  for (let i = 0; i < polls && (ci === 'pending' || ci === 'none') && !dryRun; i++) { await world.sleep(pollMs); ci = await world.ci(releasing); }
  if (ci !== 'green') {
    if (dryRun && (ci === 'pending' || ci === 'none')) { note('ci', 'pending', `CI for ${releasing.slice(0, 7)} is ${ci}`); } else {
      return stop('ci', `CI for ${releasing.slice(0, 7)} is ${ci}; a release needs a green run of the tests workflow on that commit.`);
    }
  } else { note('ci', 'ok', `green for ${releasing.slice(0, 7)}`); }
  if (sha) { if (!steps.some(x => x.name === 'tag')) { note('tag', 'done', `${tag} is on ${sha.slice(0, 7)}`); } }
  else if (dryRun) { note('tag', 'would', `create and push ${tag} at ${head.slice(0, 7)}`); }
  else { await world.createTag(tag, head); sha = head; note('tag', 'acted', `created and pushed ${tag} at ${head.slice(0, 7)}`); }

  // 2. GitHub Release from the tag push. "The tag exists" is not "released": the Release must exist WITH the file.
  const complete = r => Boolean(r && r.assets.includes(vsixName));
  if (complete(await world.githubRelease(tag))) { note('github release', 'done', `${tag} has ${vsixName}`); }
  else if (dryRun) { note('github release', 'would', `wait for release.yml to attach ${vsixName} to ${tag}`); }
  else {
    let done = false;
    for (let i = 0; i < polls && !done; i++) {
      if (complete(await world.githubRelease(tag))) { done = true; break; }
      const run = await world.releaseRun(tag);
      if (run && run.status === 'completed' && run.conclusion !== 'success') {
        return stop('github release', `release.yml ended ${run.conclusion} (${run.url ?? 'see Actions'}). Fix the workflow and re-run that run; do not move the tag.`);
      }
      await world.sleep(pollMs);
    }
    if (!done) { return stop('github release', `no Release with ${vsixName} after ${polls} checks; look at the release.yml run for ${tag}.`); }
    note('github release', 'acted', `release.yml created it, with ${vsixName}`);
  }

  // 3. Open VSX, published by the workflow with the short-lived token
  if ((await world.openVsxVersion()) === version) { note('open vsx', 'done', `shows ${version}`); }
  else if (dryRun) { note('open vsx', 'would', `wait for publish-open-vsx.yml${ovsxFallback ? ', then fall back to OVSX_PAT if it failed' : ''}`); }
  else {
    // Wait for the workflow to COMPLETE before deciding anything. A queued or running workflow may still publish, so the
    // token fallback is only for a workflow that failed (or never started). A queued run gets a longer bound (met at
    // 0.4.1: a GitHub Actions incident held the run about ten minutes, and the fallback fired while it was queued).
    let live = false; let run = null; let checks = 0;
    const limit = () => (run && run.status !== 'completed' ? polls * 3 : polls);
    while (checks < limit()) {
      if ((await world.openVsxVersion()) === version) { live = true; break; }
      run = await world.openVsxRun(tag);
      if (run?.status === 'completed' && run.conclusion !== 'success') { break; }
      await world.sleep(pollMs);
      checks++;
    }
    const failedRun = run?.status === 'completed' && run.conclusion !== 'success';
    const stillRunning = run && run.status !== 'completed';
    if (live) { note('open vsx', 'acted', 'published by publish-open-vsx.yml (trusted publishing)'); }
    else if (run?.status === 'completed' && run.conclusion === 'success') { note('open vsx', 'pending', 'the workflow succeeded; the registry validates a new upload before showing it (lag, not failure)'); }
    else if (stillRunning) { return stop('open vsx', `publish-open-vsx.yml is still ${run.status} after ${checks} checks. It may yet publish, so the token fallback was not used; run the same command again later.`); }
    else if (!failedRun && !ovsxFallback) { return stop('open vsx', 'the workflow never started or did not publish in time. Re-run with --ovsx-fallback to publish the Release\'s file with OVSX_PAT, or look at the workflow.'); }
    else if (failedRun && !ovsxFallback) { return stop('open vsx', 'the workflow failed. Re-run with --ovsx-fallback to publish the Release\'s file with OVSX_PAT, or fix the workflow.'); }
    else {
      const file = await world.downloadVsix(tag);
      const r = await world.publishOpenVsxWithToken(file);
      if (r.alreadyPublished) { note('open vsx', 'done', 'the registry says it is already published (by the workflow or an earlier run): done'); }
      else if (r.ok) { note('open vsx', 'acted', 'published with OVSX_PAT as the fallback (the workflow had failed or never started)'); }
      else { return stop('open vsx', `fallback publish failed: ${r.error}`); }
    }
  }

  // 4. Marketplace: the Release's own file, so what is attached is what is live
  if ((await world.marketplaceVersion()) === version) { note('marketplace', 'done', `shows ${version}`); }
  else if (dryRun) { note('marketplace', 'would', `publish ${vsixName} from the Release with VSCE_PAT`); }
  else {
    const file = await world.downloadVsix(tag);
    const r = await world.publishMarketplace(file);
    if (r.alreadyPublished) { note('marketplace', 'acted', 'the registry said already published: done'); }
    else if (r.ok) { note('marketplace', 'acted', `published ${vsixName}`); }
    else { return stop('marketplace', r.error); }
  }

  // 5. verify both, patiently. A registry that has not caught up is lag, not failure.
  if (dryRun) { note('verify', 'would', 'poll both registries until they show the version'); return finishAll(true); }
  let seen = { ovsx: false, marketplace: false };
  for (let i = 0; i < polls; i++) {
    seen = { ovsx: (await world.openVsxVersion()) === version, marketplace: (await world.marketplaceVersion()) === version };
    if (seen.ovsx && seen.marketplace) { break; }
    await world.sleep(pollMs);
  }
  if (seen.ovsx && seen.marketplace) { note('verify', 'ok', `both registries show ${version}`); }
  else {
    const missing = [!seen.ovsx && 'Open VSX', !seen.marketplace && 'the Marketplace'].filter(Boolean).join(' and ');
    note('verify', 'pending', `${missing} not showing ${version} yet. That is lag until proven otherwise (0.2.0 took about 15 minutes); run \`just release-status ${version}\` later.`);
  }
  return finish(true);
}

// ---- the real world ---------------------------------------------------------------------------------------------

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sh = (cmd, args, env = {}) => spawnSync(cmd, args, { cwd: root, encoding: 'utf8', env: { ...process.env, ...env } });
const out = (cmd, args) => { const r = sh(cmd, args); return r.status === 0 ? r.stdout.trim() : null; };

function readEnvFile() {
  const found = {};
  if (!existsSync(resolve(root, '.env'))) { return found; }
  for (const line of readFileSync(resolve(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m) { found[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2'); }
  }
  return found;
}

export function realWorld() {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const id = `${pkg.publisher}.${pkg.name}`;
  const already = text => /already (exists|published)|is already published/i.test(text);
  return {
    say: (name, state, detail) => console.log(`  ${{ ok: '✓', done: '✓', acted: '▶', would: '·', pending: '…', stop: '✗' }[state]} ${name}${detail ? `: ${detail}` : ''}`),
    sleep: ms => new Promise(r => setTimeout(r, ms)),
    async preconditions(version) {
      const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8');
      const dirty = sh('git', ['status', '--porcelain', '--untracked-files=no', '--', '.', ':(exclude)docs']).stdout.trim();
      sh('git', ['fetch', '-q', 'origin', 'main']);
      const onMain = sh('git', ['merge-base', '--is-ancestor', 'HEAD', 'origin/main']).status === 0;
      const scan = sh('node', ['scripts/scan-secrets.mjs']);
      return [
        { what: `package.json says ${version}`, ok: pkg.version === version, detail: pkg.version === version ? '' : `it says ${pkg.version}` },
        { what: `CHANGELOG.md has "## [${version}] - date"`, ok: new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\] - \\d{4}-\\d{2}-\\d{2}\\s*$`, 'm').test(changelog) },
        { what: 'no uncommitted changes outside docs/', ok: !dirty, detail: dirty.split('\n').slice(0, 3).join(' | ') },
        { what: 'HEAD is on main and pushed', ok: onMain },
        { what: 'no credential-shaped strings (scan-secrets)', ok: scan.status === 0 },
      ];
    },
    headSha: async () => out('git', ['rev-parse', 'HEAD']),
    async remoteTag(tag) {
      const text = out('git', ['ls-remote', 'origin', `refs/tags/${tag}`, `refs/tags/${tag}^{}`]);
      if (!text) { return null; }
      const lines = text.split('\n').map(l => l.split('\t'));
      return (lines.find(l => l[1].endsWith('^{}')) ?? lines[0])[0];
    },
    async sameContent(tagSha, head) {
      sh('git', ['fetch', '-q', 'origin', tagSha]);
      return sh('git', ['diff', '--quiet', tagSha, head, '--', '.', ':(exclude)docs']).status === 0;
    },
    async ci(sha) {
      const text = out('gh', ['run', 'list', '--workflow', 'tests', '--commit', sha, '--json', 'status,conclusion']);
      const runs = text ? JSON.parse(text) : [];
      if (!runs.length) { return 'none'; }
      if (runs.some(r => r.conclusion === 'success')) { return 'green'; }
      if (runs.some(r => r.status !== 'completed')) { return 'pending'; }
      return 'red';
    },
    async createTag(tag, sha) {
      for (const args of [['tag', '-a', tag, '-m', `keyhole ${tag.slice(1)}`, sha], ['push', 'origin', tag]]) {
        const r = sh('git', args);
        if (r.status !== 0) { throw new Error(`git ${args[0]} failed: ${r.stderr.trim()}`); }
      }
    },
    async githubRelease(tag) {
      const text = out('gh', ['release', 'view', tag, '--json', 'assets']);
      return text ? { assets: JSON.parse(text).assets.map(a => a.name) } : null;
    },
    async releaseRun(tag) { return latestRun('release', tag); },
    async openVsxRun(tag) { return latestRun('publish-open-vsx', tag); },
    async openVsxVersion() {
      try { const j = await (await fetch(`https://open-vsx.org/api/${pkg.publisher}/${pkg.name}`)).json(); return j.version ?? null; } catch { return null; }
    },
    async marketplaceVersion() {
      const text = out(resolve(root, 'node_modules/.bin/vsce'), ['show', id, '--json']);
      try { return JSON.parse(text).versions?.[0]?.version ?? null; } catch { return null; }
    },
    async downloadVsix(tag) {
      const r = sh('gh', ['release', 'download', tag, '--pattern', '*.vsix', '--dir', 'releases', '--clobber']);
      if (r.status !== 0) { throw new Error(`could not download the Release's .vsix: ${r.stderr.trim()}`); }
      return resolve(root, 'releases', `${pkg.name}-${tag.slice(1)}.vsix`);
    },
    async publishMarketplace(file) {
      const env = readEnvFile();
      if (!env.VSCE_PAT) { return { ok: false, error: 'VSCE_PAT is not set in .env' }; }
      const r = sh(resolve(root, 'node_modules/.bin/vsce'), ['publish', '--packagePath', file], { VSCE_PAT: env.VSCE_PAT });
      const text = `${r.stdout}\n${r.stderr}`;
      return r.status === 0 ? { ok: true } : already(text) ? { alreadyPublished: true } : { ok: false, error: text.trim().split('\n').slice(-3).join(' | ') };
    },
    async publishOpenVsxWithToken(file) {
      const env = readEnvFile();
      if (!env.OVSX_PAT) { return { ok: false, error: 'OVSX_PAT is not set in .env' }; }
      const r = sh(resolve(root, 'node_modules/.bin/ovsx'), ['publish', file], { OVSX_PAT: env.OVSX_PAT });
      const text = `${r.stdout}\n${r.stderr}`;
      return r.status === 0 ? { ok: true } : already(text) ? { alreadyPublished: true } : { ok: false, error: text.trim().split('\n').slice(-3).join(' | ') };
    },
  };
}

function latestRun(workflow, tag) {
  const text = out('gh', ['run', 'list', '--workflow', workflow, '--branch', tag, '--limit', '1', '--json', 'status,conclusion,url']);
  const runs = text ? JSON.parse(text) : [];
  return runs[0] ?? null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const version = args.find(a => /^\d+\.\d+\.\d+$/.test(a));
  if (!version) { console.error('usage: node scripts/release.mjs X.Y.Z [--dry-run] [--ovsx-fallback]'); process.exit(2); }
  const dryRun = args.includes('--dry-run');
  console.log(`${dryRun ? 'release status' : 'release'} ${version}\n`);
  const result = await release(realWorld(), { version, dryRun, ovsxFallback: args.includes('--ovsx-fallback') });
  console.log(result.ok ? (dryRun ? '\nnothing changed (dry run).' : `\n✓ ${version} is released.`) : dryRun ? '\nnothing changed (dry run); the ✗ lines above would stop a real run.' : '\n✗ stopped. Nothing after the failed step was attempted; fix it and run the same command again.');
  process.exit(result.ok ? 0 : 1);
}
