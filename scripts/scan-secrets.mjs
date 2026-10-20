// Scans every git-tracked text file for strings shaped like credentials.
// Meant for `just gate` and `just publish-check`. Reports file:line and the rule,
// never the matched text, so a hit does not copy a secret into a terminal log.
//
// Why: the ADR extension autosaves what you type into answer boxes to
// docs/adr/.working/drafts*.json, and those files are tracked (ADR-0011,
// QST-DRAFTS-TRACKING, decided to stay tracked). A token typed there while minting
// registry credentials would be committed. That is exactly how another repo of the
// house leaked one (docs/MARKETPLACE-SKILL-FEEDBACK.md, 2.8).
// vsce's own secret scan is no substitute: it does not catch an Azure DevOps token,
// the kind the VS Code Marketplace uses (Surveyor's probe, same file, 2.2).
//
// Usage:  node scripts/scan-secrets.mjs            tracked files, current tree
//         node scripts/scan-secrets.mjs --history  also every added line in git history
// Exit 0 clean, 1 on a hit or on a failed self-test.
//
// The rules prefer false positives to misses on purpose: a hit costs a minute to look
// at; a miss costs a rotated token and a public incident.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// A token is not part of a longer identifier or a base64 run.
const B = String.raw`(?<![A-Za-z0-9+/=_-])`;
const E = String.raw`(?![A-Za-z0-9+/=_-])`;

export const RULES = [
  // Azure DevOps personal access tokens, which is what the VS Code Marketplace asks for.
  { name: 'azure-devops-pat-52', re: new RegExp(`${B}[a-z2-7]{52}${E}`) },
  { name: 'azure-devops-pat-84', re: new RegExp(`${B}[A-Za-z0-9]{76}AZDO[A-Za-z0-9]{4}${E}`) },
  { name: 'long-mixed-token-84', re: new RegExp(`${B}(?=[A-Za-z0-9]*[a-z])(?=[A-Za-z0-9]*[A-Z])(?=[A-Za-z0-9]*[0-9])[A-Za-z0-9]{84}${E}`) },
  { name: 'github-token', re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})/ },
  { name: 'npm-token', re: /\bnpm_[A-Za-z0-9]{36}\b/ },
  { name: 'slack-token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
  { name: 'aws-access-key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'anthropic-or-openai-key', re: /\bsk-(?:ant-)?[A-Za-z0-9_-]{32,}/ },
  { name: 'private-key-block', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY(?: BLOCK)?-----/ },
  // A password inside a URL: the shape vsce's scanner has switched off.
  { name: 'credentials-in-url', re: /\bhttps?:\/\/[^\s:@/]+:(?![<${])[^\s@/]{6,}@/ },
  // The two variables the publish recipe reads, given a value that looks like a token: 20 or
  // more token characters and nothing else. A reference such as `env.VSCE_PAT`, `$VSCE_PAT` or
  // `<paste here>` is not a value (met 2026-10-13: it flagged publish-check.mjs itself).
  { name: 'publish-token-assigned', re: /\b(?:VSCE_PAT|OVSX_PAT)\s*[=:]\s*["']?[A-Za-z0-9_-]{20,}["']?(?![A-Za-z0-9_.(-])/ },
];

export function findSecrets(text) {
  const hits = [];
  text.split('\n').forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.re.test(line)) { hits.push({ line: i + 1, rule: rule.name }); }
    }
  });
  return hits;
}

// Fabricated at run time so that this file never contains a token-shaped string itself.
const rep = (chars, n) => Array.from({ length: n }, (_, i) => chars[(i * 7 + 3) % chars.length]).join('');
const MUST_CATCH = {
  'azure-devops-pat-52': `token ${rep('abcdefghijklmnopqrstuvwxyz234567', 52)} end`,
  'azure-devops-pat-84': rep('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 76) + 'AZDO' + 'abcd',
  'long-mixed-token-84': 'x ' + rep('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 84),
  'github-token': 'ghp' + '_' + rep('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 36),
  'npm-token': 'npm' + '_' + rep('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 36),
  'slack-token': 'xox' + 'b-1234567890-abcdefghij',
  'aws-access-key': 'AKIA' + 'ABCDEFGHIJKLMNOP',
  'anthropic-or-openai-key': 'sk' + '-' + rep('abcdefghijklmnopqrstuvwxyz0123456789', 40),
  'private-key-block': '-----BEGIN ' + 'PRIVATE KEY-----',
  'credentials-in-url': 'https://user:hunter22' + '@example.com/x',
  'publish-token-assigned': [
    'VSCE_PAT=' + rep('abcdefghijklmnopqrstuvwxyz0123456789', 52),
    'OVSX_PAT: "' + ['12345678', '9abc', 'def0', '1234', '56789abcdef0'].join('-') + '"', // a UUID-shaped Open VSX token
  ],
};
// Things that look token-ish but are everyday content in this repo.
const MUST_PASS = {
  'a git commit hash': 'commit 5bb2272d5240d9d3c1c4a4a3f2b1a0e9d8c7b6a5',
  'a sha256 hex digest': 'sha256:' + 'a3f1'.repeat(16),
  'a lockfile integrity line': '"integrity": "sha512-' + rep('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/', 86) + '=="',
  'a session uuid': '"uuid": "0943f681-7d7f-4f9e-af19-9a7b62bfc37a"',
  'a placeholder assignment': 'VSCE_PAT=<paste the token here>',
  'a variable reference': 'VSCE_PAT=$VSCE_PAT vsce publish',
  'a JS object passing the variable on': 'run(cmd, args, { VSCE_PAT: env.VSCE_PAT });',
  'a JS reference to process.env': 'const t = { OVSX_PAT: process.env.OVSX_PAT };',
  'a long kebab-case slug': '2026-10-13-0425-purser-to-caliper-brand-studio-renders-all-return-poe-500-and-more',
  'a url without a password': 'https://github.com/jlumbroso/keyhole/issues',
  'a url with a placeholder password': 'https://user:<token>@dev.azure.com/org',
};

export function selfTest() {
  const failures = [];
  for (const rule of RULES) {
    const samples = [].concat(MUST_CATCH[rule.name] ?? []);
    if (!samples.length) { failures.push(`no self-test sample for rule ${rule.name}`); continue; }
    samples.forEach((sample, i) => {
      if (!findSecrets(sample).some(h => h.rule === rule.name)) { failures.push(`rule ${rule.name} missed its own sample ${i + 1}`); }
    });
  }
  for (const [what, text] of Object.entries(MUST_PASS)) {
    const hit = findSecrets(text);
    if (hit.length) { failures.push(`false positive on ${what}: ${hit.map(h => h.rule).join(', ')}`); }
  }
  return failures;
}

function git(args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 }); }

function scanTree() {
  const found = [];
  for (const file of git(['ls-files', '-z']).split('\0').filter(Boolean)) {
    if (file === 'package-lock.json' || /\.(png|jpe?g|gif|ico|vsix|zip|woff2?)$/i.test(file)) { continue; }
    let text;
    try { text = readFileSync(resolve(root, file), 'utf8'); } catch { continue; } // deleted in the worktree
    if (text.includes('\0')) { continue; }
    for (const h of findSecrets(text)) { found.push(`${file}:${h.line}  ${h.rule}`); }
  }
  return found;
}

function scanHistory() {
  const found = [];
  const log = git(['log', '-p', '--all', '--no-color', '--format=@@@ %h', '-U0']);
  let commit = '', file = '';
  for (const line of log.split('\n')) {
    if (line.startsWith('@@@ ')) { commit = line.slice(4); continue; }
    if (line.startsWith('+++ ')) { file = line.slice(6); continue; }
    if (!line.startsWith('+') || file === 'package-lock.json') { continue; }
    for (const h of findSecrets(line.slice(1))) { found.push(`${commit}:${file}  ${h.rule}`); }
  }
  return [...new Set(found)];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const failures = selfTest();
  if (failures.length) {
    console.error('✗ secret scan: self-test failed, so its silence would mean nothing:\n  ' + failures.join('\n  '));
    process.exit(1);
  }
  const found = scanTree();
  if (process.argv.includes('--history')) { found.push(...scanHistory().map(h => `history ${h}`)); }
  if (found.length) {
    console.error('✗ secret scan: credential-shaped strings (the text is not printed):\n  ' + found.join('\n  '));
    process.exit(1);
  }
  console.log(`✓ secret scan: ${RULES.length} rules, self-test passed, no credential-shaped strings in tracked files${process.argv.includes('--history') ? ' or history' : ''}`);
}
