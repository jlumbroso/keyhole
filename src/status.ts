import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { GitFacts } from './git';
import { KEYHOLE_FOLDER, STATUS_FILE } from './paths';
import { writeJsonAtomic } from './requests';
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

export { STATUS_FILE };
const FORMAT = 1;
const IGNORE_LINE = '*.local.json';

export interface VariableStatus {
  /** True only when `.env` assigns the name a value with at least one character. */
  set: boolean;
  /** The name is assigned, but with no value (`NAME=`): present, and not usable. */
  empty?: true;
  /** `.env` exists but could not be read: nothing is known about the name; the error's code. */
  unreadable?: string;
  length?: number;
  keyprint?: string;
  /** When Keyhole last looked, ISO 8601. */
  checked: string;
}

async function readStatus(folderPath: string): Promise<{ [name: string]: VariableStatus }> {
  try {
    const parsed = JSON.parse(await readFile(join(folderPath, STATUS_FILE), 'utf8')) as { format?: unknown; variables?: unknown };
    return parsed.format === FORMAT && typeof parsed.variables === 'object' && parsed.variables !== null ? parsed.variables as { [name: string]: VariableStatus } : {};
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

export type Refreshed = { written: true; statuses: { [name: string]: VariableStatus } } | { written: false; reason: string };

/**
 * Looks at `.env` for each name and records what it finds in the cache.
 * Returns the reason, and writes nothing, when git does not ignore the cache.
 */
export function refreshStatus(git: GitFacts, folderPath: string, names: string[]): Promise<Refreshed> {
  // One refresh at a time per folder: two at once (startup, and a change to
  // .env a moment later) each read, then write, the cache, and the slower one
  // would put back what the faster one had just corrected.
  const previous = queues.get(folderPath) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(() => refreshNow(git, folderPath, names));
  queues.set(folderPath, next.catch(() => undefined));
  return next;
}
const queues = new Map<string, Promise<unknown>>();

async function refreshNow(git: GitFacts, folderPath: string, names: string[]): Promise<Refreshed> {
  await ignoreLocalFiles(folderPath);
  const protection = await git.protection(folderPath, STATUS_FILE);
  if (protection !== 'protected' && protection !== 'no-repository') {
    const shown = typeof protection === 'object' ? protection.unavailable : protection;
    return { written: false, reason: `git says ${STATUS_FILE} is ${shown}, and it can hold the last four characters of a value` };
  }
  const statuses = await readStatus(folderPath);
  const checked = new Date().toISOString();
  for (const name of names) {
    const presence = await probe(folderPath, name);
    statuses[name] = presence.unreadable !== undefined ? { set: false, unreadable: presence.unreadable, checked }
      : presence.lines.length === 0 ? { set: false, checked }
      : presence.length === 0 ? { set: false, empty: true, checked }
      : { set: true, length: presence.length, keyprint: presence.keyprint, checked };
  }
  await writeJsonAtomic(join(folderPath, STATUS_FILE), { format: FORMAT, variables: statuses });
  return { written: true, statuses };
}

/** The names the cache already knows, so a change to `.env` refreshes all of them. */
export async function knownNames(folderPath: string): Promise<string[]> {
  return Object.keys(await readStatus(folderPath));
}
