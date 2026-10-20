// Checks what would actually ship in the VSIX, and that the bundle is sound.
// Part of `npm run check`, so it runs in `just gate`.
//
// Why: both of the house's other extensions shipped working files in their
// packages (CLAUDE.md, .mcp.json, pneumatic's ledger, coverage output), and
// nothing noticed (ADR-0002). An ignore file is an intention; this is the check.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Grows file by file, each addition named in the commit that ships it (copied from porthole, 2026-10-20).
const ALLOWED = new Set(['package.json', 'README.md', 'CHANGELOG.md', 'LICENSE', 'LICENSE.txt', 'NOTICE', 'dist/extension.js']);
// Apache-2.0 (Jérémie, 2026-10-20): the package must carry the license and its NOTICE.
const REQUIRED = ['package.json', 'dist/extension.js', 'LICENSE', 'NOTICE'];

const vsce = resolve(root, 'node_modules', '.bin', 'vsce');
const listed = execFileSync(vsce, ['ls'], { cwd: root, encoding: 'utf8' })
  .split('\n').map(line => line.trim()).filter(Boolean);

const problems = [];
const unexpected = listed.filter(file => !ALLOWED.has(file));
if (unexpected.length) { problems.push(`would ship files that are not on the allowlist:\n    ${unexpected.join('\n    ')}`); }
const missing = REQUIRED.filter(file => !listed.includes(file));
if (missing.length) { problems.push(`required files are missing from the package: ${missing.join(', ')}`); }

// The real VS Code injects `vscode` at runtime, so the bundle must still ask
// for it, and must contain none of the test mock.
const bundle = readFileSync(resolve(root, 'dist', 'extension.js'), 'utf8');
if (!/require\(["']vscode["']\)/.test(bundle)) { problems.push('dist/extension.js has no require("vscode"): the module was bundled or aliased'); }
if (bundle.includes('resetVscodeMock')) { problems.push('dist/extension.js contains the test mock'); }

// keyhole opens no port and makes no network request: a secret goes from a
// masked box to a local file, and nowhere else. Keep that a checked fact, not
// a promise (porthole's rule, Purser's suggestion there). Asking git whether a
// file is tracked or ignored may need `child_process`; if it does, allowing it
// is a decision to record (ADR), and this line is where it gets deliberately
// changed, for git alone. VS Code's own Git extension API is the alternative.
const NETWORK_MODULES = ['net', 'http', 'https', 'http2', 'dgram', 'tls', 'dns', 'child_process'];
const required = [...bundle.matchAll(/require\(["'](?:node:)?([a-z_0-9/]+)["']\)/g)].map(match => match[1]);
const networked = required.filter(name => NETWORK_MODULES.includes(name));
if (networked.length) { problems.push(`dist/extension.js requires network or process modules: ${networked.join(', ')}`); }
if (/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(bundle)) { problems.push('dist/extension.js calls fetch, XMLHttpRequest or WebSocket'); }

if (problems.length) {
  console.error(`✗ package check failed:\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
console.log(`✓ package contents: ${listed.join(', ')}`);
