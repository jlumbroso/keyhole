import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { checkName } from './names';

// The project's requests (ADR-0004, ADR-0005): a file in the project,
// committed, the project's map of the secrets it needs. A request is names
// and the assistant's words, never a value. It arrives by the link or by an
// edit to the file (QST-REQUEST-ROUTE, C), and every entry is checked here,
// at the record, whichever route wrote it. The file's name is provisional
// until the naming review rules.

import { KEYHOLE_FOLDER, REQUESTS_FILE } from './paths';

export { KEYHOLE_FOLDER, REQUESTS_FILE };
const FORMAT = 1;
/** The longest the assistant's words may be, per field: a sentence or two, not a page. */
export const TEXT_LIMIT = 500;
/** The most names one request may carry (a sequence: an SMTP host, user and password). */
export const NAMES_LIMIT = 10;
const FIELDS = ['names', 'why', 'where', 'asked'];

export interface KeyholeRequest {
  names: string[];
  /** The assistant's words: why the project needs it. Shown labeled as the assistant's, never as a link. */
  why?: string;
  /** The assistant's words: where to get it. */
  where?: string;
  /** When it was asked, ISO 8601. */
  asked: string;
}

export type CheckedRequest = { ok: true; request: KeyholeRequest } | { ok: false; reason: string };

function checkText(label: string, text: unknown): string | undefined {
  if (text === undefined) { return undefined; }
  if (typeof text !== 'string') { return `${label} must be text`; }
  if (text.length > TEXT_LIMIT) { return `${label} is longer than ${TEXT_LIMIT} characters`; }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\u2028\u2029]/.test(text)) { return `${label} contains a control character or a line break`; }
  return undefined;
}

/** Whether an entry may stand in the record, and if not, why, in words a person can act on. */
export function checkRequest(raw: unknown): CheckedRequest {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) { return { ok: false, reason: 'a request must be an object' }; }
  const entry = raw as Record<string, unknown>;
  const unknown = Object.keys(entry).filter(key => !FIELDS.includes(key));
  if (unknown.length > 0) {
    return { ok: false, reason: `a request has ${unknown.join(', ')}, which Keyhole does not know; a request holds names and the assistant's words, never a value` };
  }
  const names = entry.names;
  if (!Array.isArray(names) || names.length === 0) { return { ok: false, reason: 'a request must name at least one variable' }; }
  if (names.length > NAMES_LIMIT) { return { ok: false, reason: `a request names more than ${NAMES_LIMIT} variables` }; }
  for (const name of names) {
    if (typeof name !== 'string') { return { ok: false, reason: 'a variable\'s name must be text' }; }
    const check = checkName(name);
    if (!check.ok) { return { ok: false, reason: `${name}: ${check.reason}` }; }
  }
  if (new Set(names).size !== names.length) { return { ok: false, reason: 'a request names the same variable twice' }; }
  const problem = checkText('why', entry.why) ?? checkText('where', entry.where);
  if (problem) { return { ok: false, reason: problem }; }
  if (typeof entry.asked !== 'string' || Number.isNaN(Date.parse(entry.asked))) { return { ok: false, reason: 'a request must say when it was asked (asked, a date and time)' }; }
  return { ok: true, request: { names: names as string[], why: entry.why as string | undefined, where: entry.where as string | undefined, asked: entry.asked } };
}

export interface RequestRecord {
  requests: KeyholeRequest[];
  /** Entries that were refused, each with its reason; shown in the log, never silently dropped. */
  refused: string[];
}

/** The folder's requests; a missing file is an empty record, an unreadable one a refusal. */
export async function readRequests(folderPath: string): Promise<RequestRecord> {
  let text: string;
  try { text = await readFile(join(folderPath, REQUESTS_FILE), 'utf8'); } catch { return { requests: [], refused: [] }; }
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return { requests: [], refused: [`${REQUESTS_FILE} is not valid JSON`] }; }
  const file = parsed as { format?: unknown; requests?: unknown };
  if (file.format !== FORMAT || !Array.isArray(file.requests)) {
    return { requests: [], refused: [`${REQUESTS_FILE} is not in a format this Keyhole reads (format ${FORMAT}, a list of requests)`] };
  }
  const record: RequestRecord = { requests: [], refused: [] };
  file.requests.forEach((raw, index) => {
    const checked = checkRequest(raw);
    if (checked.ok) { record.requests.push(checked.request); } else { record.refused.push(`request ${index + 1}: ${checked.reason}`); }
  });
  return record;
}

/** Writes JSON beside the target and renames it over, so a crash leaves the old file or the new. */
export async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.keyhole-${process.pid}-${Date.now()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    await rename(temporary, path);
  } catch (err) {
    await rm(temporary, { force: true });
    throw err;
  }
}

export type Added = { added: true } | { added: false; reason: string };

/**
 * Adds a request to the folder's record, after the same check an edited entry
 * gets. The same names, in the same order, are one request: asking again does
 * not add a second (an idempotent converge, as Porthole's install-skill).
 * Entries already refused in the file are kept as they are, untouched.
 */
export async function addRequest(folderPath: string, request: KeyholeRequest): Promise<Added> {
  const checked = checkRequest(request);
  if (!checked.ok) { return { added: false, reason: checked.reason }; }
  const path = join(folderPath, REQUESTS_FILE);
  let entries: unknown[] = [];
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as { format?: unknown; requests?: unknown };
    if (parsed.format !== FORMAT || !Array.isArray(parsed.requests)) {
      return { added: false, reason: `${REQUESTS_FILE} is not in a format this Keyhole reads; it was left as it is` };
    }
    entries = parsed.requests;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') { return { added: false, reason: `${REQUESTS_FILE} could not be read as JSON; it was left as it is` }; }
  }
  const same = (raw: unknown) => {
    const names = (raw as { names?: unknown })?.names;
    return Array.isArray(names) && names.join('\n') === checked.request.names.join('\n');
  };
  if (entries.some(same)) { return { added: false, reason: 'already requested' }; }
  const clean: { [field: string]: unknown } = { names: checked.request.names };
  if (checked.request.why !== undefined) { clean.why = checked.request.why; }
  if (checked.request.where !== undefined) { clean.where = checked.request.where; }
  clean.asked = checked.request.asked;
  await writeJsonAtomic(path, { format: FORMAT, requests: [...entries, clean] });
  return { added: true };
}
