import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { GitFacts } from './git';
import { KEYHOLE_FOLDER, writeJsonAtomic } from './requests';
import { probe } from './targets/dotenv';

// The cache behind Keyhole's API for models (ADR-0005, QST-OUTCOME-ROUTE, D):
// for each variable Keyhole set or was asked for, whether it is set, its
// length and its keyprint, never its value. Models never read this file; the
// coming MCP server answers from it, so the process a model's harness starts
// never opens `.env`. Its format can change freely for that reason.
//
// A keyprint shows the last four characters of a long value, so the cache
// must never be committed: Keyhole writes it only once git says it is ignored
// (a `.gitignore` inside Keyhole's own folder), and says so in the log when
// it cannot. The file's name is provisional until the naming review rules.

export const OUTCOMES_FILE = `${KEYHOLE_FOLDER}/outcomes.local.json`;
const FORMAT = 1;
const IGNORE_LINE = '*.local.json';

export interface Outcome {
  set: boolean;
  length?: number;
  keyprint?: string;
  /** When Keyhole last looked, ISO 8601. */
  checked: string;
}

async function readOutcomes(folderPath: string): Promise<{ [name: string]: Outcome }> {
  try {
    const parsed = JSON.parse(await readFile(join(folderPath, OUTCOMES_FILE), 'utf8')) as { format?: unknown; variables?: unknown };
    return parsed.format === FORMAT && typeof parsed.variables === 'object' && parsed.variables !== null ? parsed.variables as { [name: string]: Outcome } : {};
  } catch {
    return {};
  }
}

/** Makes Keyhole's folder ignore its local files, with a `.gitignore` of its own; idempotent. */
async function ignoreLocalFiles(folderPath: string): Promise<void> {
  const path = join(folderPath, KEYHOLE_FOLDER, '.gitignore');
  let current = '';
  try { current = await readFile(path, 'utf8'); } catch { /* not yet */ }
  if (current.split('\n').some(line => line.trim() === IGNORE_LINE)) { return; }
  await mkdir(join(folderPath, KEYHOLE_FOLDER), { recursive: true });
  await appendFile(path, `${current === '' || current.endsWith('\n') ? '' : '\n'}# Keyhole's local cache: never committed (a keyprint can show a value's last four)\n${IGNORE_LINE}\n`);
}

export type Refreshed = { written: true; outcomes: { [name: string]: Outcome } } | { written: false; reason: string };

/**
 * Looks at `.env` for each name and records what it finds in the cache.
 * Returns the reason, and writes nothing, when git does not ignore the cache.
 */
export async function refreshOutcomes(git: GitFacts, folderPath: string, names: string[]): Promise<Refreshed> {
  await ignoreLocalFiles(folderPath);
  const protection = await git.protection(folderPath, OUTCOMES_FILE);
  if (protection !== 'protected' && protection !== 'no-repository') {
    const shown = typeof protection === 'object' ? protection.unavailable : protection;
    return { written: false, reason: `git says ${OUTCOMES_FILE} is ${shown}, and it can hold the last four characters of a value` };
  }
  const outcomes = await readOutcomes(folderPath);
  const checked = new Date().toISOString();
  for (const name of names) {
    const presence = await probe(folderPath, name);
    outcomes[name] = presence.lines.length > 0
      ? { set: true, length: presence.length, keyprint: presence.keyprint, checked }
      : { set: false, checked };
  }
  await writeJsonAtomic(join(folderPath, OUTCOMES_FILE), { format: FORMAT, variables: outcomes });
  return { written: true, outcomes };
}

/** The names the cache already knows, so a change to `.env` refreshes all of them. */
export async function knownNames(folderPath: string): Promise<string[]> {
  return Object.keys(await readOutcomes(folderPath));
}
