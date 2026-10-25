import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GitFacts, Protection } from '../git';
import { handleRequestLink, showInbox, watchInbox } from '../inbox';
import { readQuery } from '../link';
import { initLog } from '../log';
import { STATUS_FILE } from '../status';
import { INBOX_FILE } from '../requests';
import {
  answerNextNotice, fileChanged, loggedLines, pickNext, resetVscodeMock, setWorkspaceFolders, shownInputBoxes, shownMessages, shownQuickPicks, typeIntoNextInputBox,
} from './helpers/vscodeMock';

// The inbox as a list (ADR-0004, D; ADR-0005): a model asks by name with a
// link, or writes the record; the request waits; the person opens the list
// and the masked box when ready. On real folders: the files are what matter.
// Fake values only, built at runtime so no token-shaped text is tracked.

const FAKE = ['ghp', 'FAKEfakeFAKEfakeFAKEfakeFAKEfake1234'].join('_');
// No English words in it: a window of the value must not match Keyhole's own sentences by chance.
const SMTP_PASSWORD = ['Qz7', 'Hj4', 'Vx9', 'Lp7', 'Mn3', 'Rk2', 'Tb8', 'XYZW'].join('-');

let folder: string;
const read = (relative: string) => readFileSync(join(folder, relative), 'utf8');
/** git's answer per file: `.env` and the cache are ignored unless a test says otherwise. */
let protections: { [relative: string]: Protection };
const git: GitFacts = { protection: async (_folder, relative) => protections[relative] ?? 'protected' };
const link = (query: string) => handleRequestLink(git, { path: '/v1/request', query });

beforeEach(() => {
  resetVscodeMock();
  initLog();
  folder = mkdtempSync(join(tmpdir(), 'keyhole-inbox-'));
  setWorkspaceFolders([folder]);
  protections = {};
});
afterEach(() => {
  rmSync(folder, { recursive: true, force: true });
});

describe('a model asks for a secret by name, with a link', () => {
  it('records the request with the assistant\'s words, says it is waiting, and opens no box', async () => {
    await link('name=NEON_API_KEY&why=The app reads its database from Neon');

    expect(JSON.parse(read(INBOX_FILE)).requests).toEqual([
      expect.objectContaining({ names: ['NEON_API_KEY'], why: 'The app reads its database from Neon' }),
    ]);
    expect(shownMessages().at(-1)).toMatchObject({ kind: 'info', text: 'Your assistant asked for NEON_API_KEY.' });
    expect(shownInputBoxes()).toHaveLength(0); // nothing is now-or-never
  });

  it('refuses a link that carries a value, says why, and records nothing', async () => {
    await link(`name=GITHUB_TOKEN&value=${FAKE}`);

    expect(shownMessages().at(-1)?.text).toMatch(/never carries a value/);
    expect(existsSync(join(folder, INBOX_FILE))).toBe(false);
    expect(loggedLines().join('\n')).not.toContain(FAKE.slice(4, 12));
  });

  it('refuses a name Keyhole would not write, as the person\'s own box does', async () => {
    await link('name=NODE_OPTIONS');

    expect(shownMessages().at(-1)?.text).toMatch(/NODE_OPTIONS changes how programs run/);
    expect(existsSync(join(folder, INBOX_FILE))).toBe(false);
  });

  it('records the same request once, however often it is asked', async () => {
    await link('name=NEON_API_KEY');
    await link('name=NEON_API_KEY');

    expect(JSON.parse(read(INBOX_FILE)).requests).toHaveLength(1);
  });

  it('keeps a + and a % in the assistant\'s words, which VS Code has already decoded', () => {
    expect(readQuery('name=A_KEY&why=C++ build, 100% of tests')).toEqual([['name', 'A_KEY'], ['why', 'C++ build, 100% of tests']]);
  });
});

describe('the list', () => {
  it('opens the masked box with the name already given, and shows the assistant\'s words as theirs', async () => {
    await link('name=GITHUB_TOKEN&why=To open pull requests&where=github.com/settings/tokens');
    typeIntoNextInputBox(FAKE);

    await showInbox(git);

    const item = shownQuickPicks()[0].items[0] as { label: string; detail?: string };
    expect(item.label).toBe('GITHUB_TOKEN');
    expect(item.detail).toBe('Your assistant says: To open pull requests Where to get it: github.com/settings/tokens');
    expect(shownInputBoxes()).toHaveLength(1); // no name box: only the masked one
    expect(shownInputBoxes()[0].password).toBe(true);
    expect(read('.env')).toContain(`GITHUB_TOKEN=${FAKE}`);
  });

  it('sets a sequence in order, and stops where the person stops, leaving the rest waiting', async () => {
    await link('name=SMTP_HOST&name=SMTP_USER&name=SMTP_PASSWORD');
    typeIntoNextInputBox('smtp.example.com');
    typeIntoNextInputBox(undefined); // Escape at the second

    await showInbox(git);

    expect(read('.env')).toContain('SMTP_HOST=smtp.example.com');
    expect(read('.env')).not.toContain('SMTP_USER');
    pickNext(0);
    typeIntoNextInputBox('mailer');
    typeIntoNextInputBox(SMTP_PASSWORD);
    await showInbox(git);
    expect((shownQuickPicks()[1].items[0] as { label: string }).label).toBe('SMTP_USER, SMTP_PASSWORD');
    expect(read('.env').match(/^SMTP_\w+/gm)).toEqual(['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD']);
  });

  it('says so when nothing is waiting, instead of an empty list', async () => {
    await showInbox(git);

    expect(shownQuickPicks()).toHaveLength(0);
    expect(shownMessages().at(-1)?.text).toBe('Keyhole: no requests are waiting.');
  });

  it('offers to add the names to .env.example once a request is done, names only', async () => {
    await link('name=GITHUB_TOKEN');
    typeIntoNextInputBox(FAKE);
    answerNextNotice(undefined); // the "Keyhole set …" notice
    answerNextNotice('Add to .env.example');

    await showInbox(git);

    expect(read('.env.example')).toBe('# Needed by this project (recorded by Keyhole)\nGITHUB_TOKEN=\n');
  });
});

describe('the cache behind the API (ADR-0005)', () => {
  it('records that a requested name is set, with its length and keyprint, and never the value', async () => {
    await link('name=GITHUB_TOKEN');
    typeIntoNextInputBox(FAKE);

    await showInbox(git);

    expect(JSON.parse(read(STATUS_FILE)).variables.GITHUB_TOKEN).toMatchObject({ set: true, length: 40, keyprint: expect.stringMatching(/^<keyprint:ghp_…1234#[0-9a-f]{8}\/>$/) });
    expect(read('.keyhole/.gitignore')).toContain('*.local.json');
  });

  it('writes nothing when git would not ignore it, since a keyprint can show a value\'s last four', async () => {
    protections[STATUS_FILE] = 'not-ignored';

    await link('name=GITHUB_TOKEN');

    expect(existsSync(join(folder, STATUS_FILE))).toBe(false);
    expect(loggedLines().join('\n')).toMatch(/cache was not written: git says .* is not-ignored/);
  });

  it('sees a value the person set by hand in .env', async () => {
    await link('name=GITHUB_TOKEN');
    const watching = watchInbox(git);
    writeFileSync(join(folder, '.env'), `GITHUB_TOKEN=${FAKE}\n`);

    await fileChanged(join(folder, '.env'));

    expect(JSON.parse(read(STATUS_FILE)).variables.GITHUB_TOKEN).toMatchObject({ set: true, length: 40 });
    watching.dispose();
  });
});

describe('Regression tests', () => {
  // Sounder's read of the preview (2026-10-25): the status said "set" for a
  // name assigned no value, said "not set" for an .env it could not read, and
  // requests already in the inbox at startup were never looked at again.

  it('does not call a name set when it is assigned no value, and keeps its request waiting', async () => {
    writeFileSync(join(folder, '.env'), 'GITHUB_TOKEN=\n');
    await link('name=GITHUB_TOKEN');

    expect(JSON.parse(read(STATUS_FILE)).variables.GITHUB_TOKEN).toMatchObject({ set: false, empty: true });
    typeIntoNextInputBox(undefined);
    await showInbox(git);
    expect((shownQuickPicks()[0]?.items[0] as { label: string } | undefined)?.label).toBe('GITHUB_TOKEN');
  });

  it.skipIf(process.getuid?.() === 0)('says an .env it cannot read is unreadable, not that the name is not set', async () => {
    writeFileSync(join(folder, '.env'), `GITHUB_TOKEN=${FAKE}\n`);
    chmodSync(join(folder, '.env'), 0o000);
    try {
      await link('name=GITHUB_TOKEN');
    } finally {
      chmodSync(join(folder, '.env'), 0o600);
    }

    const status = JSON.parse(read(STATUS_FILE)).variables.GITHUB_TOKEN;
    expect(status).toMatchObject({ set: false, unreadable: expect.any(String) });
    expect(status.empty).toBeUndefined();
  });

  it('looks again at the requests already in the inbox when Keyhole starts, without ringing for them', async () => {
    mkdirSync(join(folder, '.keyhole'), { recursive: true });
    writeFileSync(join(folder, INBOX_FILE), JSON.stringify({ format: 1, requests: [{ kind: 'request', names: ['GITHUB_TOKEN'], asked: '2026-10-22T19:00:00Z' }] }));
    writeFileSync(join(folder, '.env'), `GITHUB_TOKEN=${FAKE}\n`);

    const watching = watchInbox(git);
    for (let tries = 0; !existsSync(join(folder, STATUS_FILE)) && tries < 50; tries++) { await new Promise(resolve => setTimeout(resolve, 5)); }

    expect(JSON.parse(read(STATUS_FILE)).variables.GITHUB_TOKEN).toMatchObject({ set: true, length: 40 });
    expect(shownMessages()).toEqual([]);
    watching.dispose();
  });
});

describe('a model writes the record directly (QST-REQUEST-ROUTE, C)', () => {
  it('rings like a link for a new request, and refuses an entry with a field that could carry a value', async () => {
    const watching = watchInbox(git);
    await new Promise(resolve => setTimeout(resolve, 0)); // the watcher has read the record as it was
    mkdirSync(join(folder, '.keyhole'), { recursive: true });
    writeFileSync(join(folder, INBOX_FILE), JSON.stringify({ format: 1, requests: [
      { kind: 'request', names: ['RENDER_API_KEY'], why: 'To deploy', asked: '2026-10-22T19:00:00Z' },
      { kind: 'request', names: ['GITHUB_TOKEN'], value: FAKE, asked: '2026-10-22T19:00:00Z' },
      { names: ['NEON_API_KEY'], asked: '2026-10-22T19:00:00Z' }, // no kind: an older or a foreign row
    ] }));

    await fileChanged(join(folder, INBOX_FILE));

    expect(shownMessages().map(message => message.text)).toEqual(['Your assistant asked for RENDER_API_KEY.']);
    expect(loggedLines().join('\n')).toMatch(/request 2: a request has value, which Keyhole does not know; a request holds names and the assistant's words, never a value/);
    expect(loggedLines().join('\n')).toMatch(/request 3: a row must say kind "request"/);
    // The test wrote the value into the record itself; Keyhole must not carry it anywhere else.
    expect([...loggedLines(), ...shownMessages().map(message => message.text)].join('\n')).not.toContain(FAKE.slice(4, 12));
    watching.dispose();
  });
});

describe('the first law, across the inbox', () => {
  it('never puts a value in the record, the cache, the log, a notice or the list', async () => {
    await link('name=SMTP_HOST&name=SMTP_PASSWORD&why=Mail for password resets');
    typeIntoNextInputBox('smtp.example.com');
    typeIntoNextInputBox(SMTP_PASSWORD);

    await showInbox(git);

    expect(read('.env')).toContain(`SMTP_PASSWORD=${SMTP_PASSWORD}`); // it was written
    const hidden = SMTP_PASSWORD.slice(0, -4);
    for (let at = 0; at + 4 <= hidden.length; at++) {
      expect(everything()).not.toContain(hidden.slice(at, at + 4));
    }
  });
});

/** Everything a model could ever read: the record, the cache, the log, every notice and list item. */
function everything(): string {
  const file = (relative: string) => existsSync(join(folder, relative)) ? read(relative) : '';
  return [
    file(INBOX_FILE), file(STATUS_FILE), ...loggedLines(),
    ...shownMessages().map(message => `${message.text} ${message.detail ?? ''}`),
    ...shownQuickPicks().flatMap(pick => pick.items.map(item => JSON.stringify(item, (key, value) => (key === 'folder' ? undefined : value)))),
  ].join('\n');
}
