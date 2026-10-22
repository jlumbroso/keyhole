// Prints the CHANGELOG.md section for one version, for the body of a GitHub Release.
// Fails loudly when the version has no heading or an empty section, so a release can
// never go out with blank notes (playbook V.6: a missing entry is a blocker).
//
// Usage: node scripts/release-notes.mjs 0.1.0
// Heading format (Keep a Changelog, with a hyphen): ## [0.1.0] - 2026-10-12

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function sectionFor(changelog, version) {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const start = changelog.match(new RegExp(`^## \\[${escaped}\\] - \\d{4}-\\d{2}-\\d{2}[ \\t]*$`, 'm'));
  if (!start) { return null; }
  const rest = changelog.slice(start.index + start[0].length);
  // The section ends at the next version heading or at the link references at the foot.
  const end = rest.search(/^(?:## \[|\[[^\]]+\]: )/m);
  return (end === -1 ? rest : rest.slice(0, end)).trim();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const version = process.argv[2];
  if (!version) { console.error('usage: node scripts/release-notes.mjs <version>'); process.exit(2); }
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const notes = sectionFor(readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8'), version);
  if (!notes) { console.error(`CHANGELOG.md has no non-empty "## [${version}] - YYYY-MM-DD" section`); process.exit(1); }
  console.log(notes);
}
