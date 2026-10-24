// Purpose: Purser 5.5, 2026-10-24. The read-only pre-flight for keyhole's first release (Glazier's brief 2238): do the two
// registry tokens in keyhole's .env authenticate for publisher/namespace `jlumbroso`? Prints PASS or FAIL per registry and a
// short message, never a token: the values go only into the environment of the child process that verifies them, and any
// occurrence of either value in the child's output is replaced before printing. It publishes nothing.
//
// Usage: node scripts/ephemeral/2026-10-24-verify-pats-pass-fail-only.mjs
//
// ovsx is not a devDependency of keyhole (finding in the pre-flight brief), so it is run through npx at the version porthole
// pins (1.2.0), which reads OVSX_PAT from the environment, so no token is ever an argument visible in `ps`.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const env = {};
if (existsSync(resolve(root, '.env'))) {
  for (const line of readFileSync(resolve(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?(VSCE_PAT|OVSX_PAT)\s*=\s*(.*?)\s*$/);
    if (m) { env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2'); }
  }
}
const scrub = text => Object.values(env).filter(Boolean).reduce((t, v) => t.split(v).join('[redacted]'), text);
const check = (label, name, cmd, args) => {
  if (!env[name]) { console.log(`FAIL ${label}: ${name} is not set in .env`); return false; }
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', env: { ...process.env, [name]: env[name] } });
  const msg = scrub(`${r.stdout}\n${r.stderr}`).trim().split('\n').filter(Boolean).slice(-2).join(' | ').slice(0, 220);
  console.log(`${r.status === 0 ? 'PASS' : 'FAIL'} ${label}${msg ? `: ${msg}` : ''}`);
  return r.status === 0;
};
const a = check('vsce verify-pat jlumbroso', 'VSCE_PAT', resolve(root, 'node_modules/.bin/vsce'), ['verify-pat', 'jlumbroso']);
const b = check('ovsx verify-pat jlumbroso', 'OVSX_PAT', 'npx', ['--yes', 'ovsx@1.2.0', 'verify-pat', 'jlumbroso']);
process.exit(a && b ? 0 : 1);

// --- Outcome (Purser 5.5, 2026-10-24) ---
// Run once, 2026-10-24, before keyhole's first release: PASS for `vsce verify-pat jlumbroso` and PASS for
// `ovsx verify-pat jlumbroso` (ovsx 1.2.0 through npx; its output was npm deprecation warnings only, exit code 0). No value
// was printed. Run it again right before publishing: a token can expire between the check and the release.
