import { chmod, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Secret } from '../secret';

// The project's `.env`, the first target (ADR-0001). One of the two places in
// keyhole allowed to unwrap a Secret (`reveal()`), and only to write it.
//
// Rules, from ADR-0001 and Surveyor's reading of five loaders (last line wins,
// none warns): keyhole appends, never rewrites earlier lines; each write is
// preceded by a `#` comment saying keyhole wrote it, when, and which line it supersedes;
// the file is replaced atomically (written beside it, then renamed), and a new
// file is created readable by its owner only.

export const DOTENV = '.env';

export interface Presence {
  /** 1-based line numbers where the variable is assigned, in order; the last one wins. */
  lines: number[];
  /** The keyprint of the value that wins, or undefined when the variable is absent. */
  keyprint?: string;
  /** The winning value's length. */
  length?: number;
  /** Set when `.env` exists but cannot be read: the error's code. Nothing else is known then. */
  unreadable?: string;
}

const assignment = (name: string) => new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=(.*)$`);

/** The value an assignment line holds, unquoted as the common loaders read it. */
function valueOf(rest: string): string {
  const text = rest.trim();
  const quote = text[0];
  if ((quote === '"' || quote === "'") && text.length >= 2) {
    const end = text.indexOf(quote, 1);
    if (end > 0) { return text.slice(1, end); }
  }
  const comment = text.search(/\s#/);
  return comment >= 0 ? text.slice(0, comment).trimEnd() : text;
}

/** `.env` exists but cannot be read: Keyhole must not take it for a new file (regression test, 2026-10-25). */
export class UnreadableFile extends Error {}

/**
 * The file's text, or undefined when there is no file. Only "no such file"
 * means absent: any other error (permissions, a folder in its place) is
 * thrown, because a file taken for absent would be replaced by append() and
 * lose every value in it.
 */
async function readIfPresent(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') { return undefined; }
    throw new UnreadableFile((err as NodeJS.ErrnoException).code ?? String(err));
  }
}

/** Where the variable is set in this folder's `.env`, without showing its value. */
export async function probe(folderPath: string, name: string): Promise<Presence> {
  let text: string | undefined;
  try {
    text = await readIfPresent(join(folderPath, DOTENV));
  } catch (err) {
    if (err instanceof UnreadableFile) { return { lines: [], unreadable: err.message }; }
    throw err;
  }
  if (text === undefined) { return { lines: [] }; }
  const pattern = assignment(name);
  const lines: number[] = [];
  let last: string | undefined;
  text.split('\n').forEach((line, index) => {
    const match = pattern.exec(line);
    if (match) { lines.push(index + 1); last = valueOf(match[1]); }
  });
  if (last === undefined) { return { lines }; }
  const winning = new Secret(last);
  return { lines, keyprint: winning.keyprint(), length: winning.length };
}

export type Quoted = { ok: true; text: string } | { ok: false; reason: string };

/** The value as it must be written so every common loader reads it back unchanged. */
export function quote(secret: Secret): Quoted {
  const value = secret.reveal();
  if (/[\r\n]/.test(value)) { return { ok: false, reason: 'the value has more than one line (a key file?); keyhole writes one-line values only' }; }
  if (/^[A-Za-z0-9_\-./:+=@~,%]*$/.test(value)) { return { ok: true, text: value }; }
  if (!value.includes("'")) { return { ok: true, text: `'${value}'` }; }
  if (!/["\\$`]/.test(value)) { return { ok: true, text: `"${value}"` }; }
  return { ok: false, reason: 'the value contains both kinds of quote and a character a loader would expand; it cannot be written safely in one line' };
}

export interface Written {
  line: number;
  created: boolean;
}

/**
 * Appends `name=value` to the folder's `.env`, after a comment line, and returns
 * the line the value is on. Atomic: the new content is written beside the file
 * and renamed over it, so a crash leaves the old file or the new, never half.
 */
export async function append(folderPath: string, name: string, quoted: string, comment: string): Promise<Written> {
  const path = join(folderPath, DOTENV);
  const before = await readIfPresent(path);
  const created = before === undefined;
  const head = before === undefined || before === '' ? '' : before.endsWith('\n') ? before : `${before}\n`;
  const content = `${head}# ${comment}\n${name}=${quoted}\n`;
  const temporary = join(folderPath, `.env.keyhole-${process.pid}-${Date.now()}.tmp`);
  const mode = created ? 0o600 : (await stat(path)).mode & 0o777;
  try {
    await writeFile(temporary, content, { encoding: 'utf8', mode });
    await chmod(temporary, mode); // writeFile's mode is reduced by the umask; set it exactly
    await rename(temporary, path);
  } catch (err) {
    // The temporary file holds the secret, and nothing promises git ignores its name: never leave it behind.
    await rm(temporary, { force: true });
    throw err;
  }
  return { line: content.split('\n').length - 1, created };
}
