import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GitFacts, Protection } from '../git';
import { initLog } from '../log';
import { setSecret } from '../setSecret';
import {
  answerNextModal, loggedLines, resetVscodeMock, setWorkspaceFolders, shownInputBoxes, shownMessages, typeIntoNextInputBox,
} from './helpers/vscodeMock';

// The person's own path (ADR-0001, the first build), on real folders: the
// file on disk is what matters. Fake values only, built at runtime so no
// token-shaped text is tracked (the gate's secret scan reads the text).

const FAKE = ['ghp', 'FAKEfakeFAKEfakeFAKEfakeFAKEfake1234'].join('_');
const OTHER = ['ghp', 'ROTATEDrotatedROTATEDrotatedROTAT9876'].join('_');

let folder: string;
const env = () => readFileSync(join(folder, '.env'), 'utf8');
/** git's answer, as the GitFacts implementation would give it; changes after .gitignore is edited when told to. */
let protectionNow: Protection;
const git: GitFacts = { protection: async () => protectionNow };

/** Everything a model could ever read about this run: the log, and every notice and question. */
const everythingShown = () => [...loggedLines(), ...shownMessages().map(message => `${message.text} ${message.detail ?? ''}`)].join('\n');

beforeEach(() => {
  resetVscodeMock();
  // Without the channel, log() writes nothing, and a test of "the value never
  // reaches the log" would pass on an empty log (it did, once, 2026-10-20).
  initLog();
  folder = mkdtempSync(join(tmpdir(), 'keyhole-'));
  setWorkspaceFolders([folder]);
  protectionNow = 'protected';
});
afterEach(() => {
  rmSync(folder, { recursive: true, force: true });
});

describe('setting a secret in .env', () => {
  it('appends it after a comment line, in a new file only its owner can read', async () => {
    typeIntoNextInputBox('GITHUB_TOKEN');
    typeIntoNextInputBox(FAKE);

    await setSecret(git);

    expect(env()).toMatch(new RegExp(`^# Keyhole [^\\n]* · set GITHUB_TOKEN\\nGITHUB_TOKEN=${FAKE}\\n$`));
    expect(statSync(join(folder, '.env')).mode & 0o777).toBe(0o600);
    expect(shownMessages().at(-1)?.text).toMatch(/Keyhole set GITHUB_TOKEN in .*\/\.env \(40 characters\)\./);
  });

  it('takes the value in a masked box that stays open while the person is away minting the token', async () => {
    typeIntoNextInputBox('GITHUB_TOKEN');
    typeIntoNextInputBox(FAKE);

    await setSecret(git);

    const valueBox = shownInputBoxes()[1];
    expect(valueBox.password).toBe(true);
    expect(valueBox.ignoreFocusOut).toBe(true);
  });

  it('keeps what was in the file before, byte for byte', async () => {
    const before = '# my settings\nDATABASE_URL=postgres://localhost/dev\n';
    writeFileSync(join(folder, '.env'), before);
    typeIntoNextInputBox('GITHUB_TOKEN');
    typeIntoNextInputBox(FAKE);

    await setSecret(git);

    expect(env().startsWith(before)).toBe(true);
  });

  it('asks before replacing a value that is already set, and appends rather than rewrites', async () => {
    writeFileSync(join(folder, '.env'), `GITHUB_TOKEN=${FAKE}\n`);
    typeIntoNextInputBox('GITHUB_TOKEN');
    answerNextModal('Replace It');
    typeIntoNextInputBox(OTHER);

    await setSecret(git);

    expect(shownMessages()[0].text).toMatch(/GITHUB_TOKEN is already set in .*\(<OBKEY:…#[0-9a-f]{8}\/>, 40 characters\)\. Replace it\?/);
    expect(env()).toMatch(new RegExp(`^GITHUB_TOKEN=${FAKE}\\n# Keyhole [^\\n]*replaces the value on line 1\\)\\nGITHUB_TOKEN=${OTHER}\\n$`));
  });

  it('writes nothing when the person keeps the old value', async () => {
    writeFileSync(join(folder, '.env'), `GITHUB_TOKEN=${FAKE}\n`);
    typeIntoNextInputBox('GITHUB_TOKEN');
    answerNextModal(undefined);

    await setSecret(git);

    expect(env()).toBe(`GITHUB_TOKEN=${FAKE}\n`);
  });

  it('quotes a value with a space or a #, so loaders read it back unchanged', async () => {
    typeIntoNextInputBox('SERVICE_PASSWORD');
    typeIntoNextInputBox('two words #and a hash');

    await setSecret(git);

    expect(env()).toMatch(/\nSERVICE_PASSWORD='two words #and a hash'\n$/);
  });

  it('refuses a value on several lines, and writes nothing', async () => {
    typeIntoNextInputBox('PRIVATE_KEY');
    typeIntoNextInputBox('-----BEGIN KEY-----\nabc\n-----END KEY-----');

    await setSecret(git);

    expect(() => env()).toThrow();
    expect(shownMessages().at(-1)?.text).toMatch(/more than one line/);
  });
});

describe('git keeps the secret out of commits', () => {
  it('refuses when git tracks .env, and says how to stop tracking it', async () => {
    protectionNow = 'tracked';
    typeIntoNextInputBox('GITHUB_TOKEN');

    await setSecret(git);

    expect(shownInputBoxes()).toHaveLength(1); // never asked for the value
    expect(shownMessages().at(-1)?.text).toMatch(/git tracks it.*git rm --cached \.env/);
  });

  it('offers to add .env to .gitignore when no rule ignores it, then writes', async () => {
    protectionNow = 'not-ignored';
    writeFileSync(join(folder, '.gitignore'), 'node_modules/');
    typeIntoNextInputBox('GITHUB_TOKEN');
    answerNextModal('Add to .gitignore');
    typeIntoNextInputBox(FAKE);
    const realGit: GitFacts = { protection: async () => (readFileSync(join(folder, '.gitignore'), 'utf8').includes('\n.env\n') ? 'protected' : 'not-ignored') };

    await setSecret(realGit);

    expect(readFileSync(join(folder, '.gitignore'), 'utf8')).toMatch(/^node_modules\/\n\n# Secrets stay out of git \(added by Keyhole [^)]*\)\n\.env\n$/);
    expect(env()).toContain(`GITHUB_TOKEN=${FAKE}`);
  });

  it('writes nothing when the person declines to ignore .env', async () => {
    protectionNow = 'not-ignored';
    typeIntoNextInputBox('GITHUB_TOKEN');
    answerNextModal(undefined);

    await setSecret(git);

    expect(() => env()).toThrow();
  });
});

describe('names keyhole refuses', () => {
  it('refuses NODE_OPTIONS and its kin, which would turn a value into code', async () => {
    typeIntoNextInputBox('NODE_OPTIONS');

    await setSecret(git);

    expect(shownInputBoxes()).toHaveLength(1);
    expect(() => env()).toThrow();
  });
});

describe('the first law', () => {
  it('never shows the value in the log, a notice or a question, whatever happens', async () => {
    writeFileSync(join(folder, '.env'), `GITHUB_TOKEN=${FAKE}\n`);
    typeIntoNextInputBox('GITHUB_TOKEN');
    answerNextModal('Replace It');
    typeIntoNextInputBox(OTHER);

    await setSecret(git);

    expect(loggedLines().length).toBeGreaterThanOrEqual(3); // the log really was captured (git, the probe, the write)
    for (const value of [FAKE, OTHER]) {
      expect(everythingShown()).not.toContain(value.slice(4, 12));
    }
    expect(everythingShown()).toMatch(/<OBKEY:…#[0-9a-f]{8}\/>/);
  });

  it('leaves no temporary file beside .env', async () => {
    mkdirSync(join(folder, 'sub'));
    typeIntoNextInputBox('GITHUB_TOKEN');
    typeIntoNextInputBox(FAKE);

    await setSecret(git);

    expect(readdirSync(folder).filter(name => name.includes('keyhole'))).toEqual([]);
  });
});
