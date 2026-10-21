import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { inspect } from 'node:util';
import { describe, expect, it } from 'vitest';
import { Secret } from '../secret';

// The first law (ADR-0001): a secret never enters the conversation. Anything a
// model can read (a log line, a notice, a result line, an error message) is
// built from strings, so a Secret must turn into nothing but "[redacted]" by
// every route a string is made, and serializing it must fail loudly.
// Fake values only: never a real token in a test.

// Built at runtime so no token-shaped text sits in a tracked file: the gate's
// secret scan reads the text and, rightly, cannot tell a fake from a real one
// (it flagged the literal form, 2026-10-20). Never weaken the scan for a test.
const FAKE = ['ghp', 'FAKEfakeFAKEfakeFAKEfakeFAKEfake1234'].join('_');

describe('a secret cannot be leaked by accident', () => {
  const secret = new Secret(FAKE);

  it('prints as [redacted] in a template string, in String(), and when concatenated', () => {
    expect(`${secret}`).toBe('[redacted]');
    expect(String(secret)).toBe('[redacted]');
    expect('value: ' + secret).toBe('value: [redacted]');
  });

  it('shows as redacted when logged with console.log or util.inspect, the way an error report would', () => {
    expect(inspect(secret)).toBe('Secret [redacted]');
    expect(inspect({ name: 'GITHUB_TOKEN', value: secret })).not.toContain('FAKE');
  });

  it('refuses to be serialized, so it can never ride into a JSON log line or a result file', () => {
    expect(() => JSON.stringify({ name: 'GITHUB_TOKEN', value: secret })).toThrow(/cannot be serialized/);
  });

  it('gives its length, which the person and the log may see', () => {
    expect(secret.length).toBe(FAKE.length);
  });
});

describe('the keyprint (ADR-0002, QST-KEYPRINT-LEGIBLE, C)', () => {
  it('is the same for the same value and different for a rotated one', () => {
    expect(new Secret(FAKE).keyprint()).toBe(new Secret(FAKE).keyprint());
    expect(new Secret(FAKE).keyprint()).not.toBe(new Secret(`${FAKE}X`).keyprint());
  });

  it('shows a long token\'s public prefix and last four, so its owner recognizes it, and nothing else of it', () => {
    const shown = new Secret(FAKE).keyprint();
    expect(shown).toMatch(/^<keyprint:ghp_…1234#[0-9a-f]{8}\/>$/);
    const hidden = FAKE.slice('ghp_'.length, -4);
    for (let at = 0; at + 4 <= hidden.length; at++) {
      expect(shown).not.toContain(hidden.slice(at, at + 4));
    }
  });

  it('shows a short value\'s public prefix but none of the rest, where four characters would be a real share of it', () => {
    // Jérémie's invariant: the public prefix always shows, even on a short value.
    const short = ['ghp', '12345'].join('_');
    expect(new Secret(short).keyprint()).toMatch(/^<keyprint:ghp_…#[0-9a-f]{8}\/>$/);
    expect(new Secret('hunter2-but-longer').keyprint()).toMatch(/^<keyprint:…#[0-9a-f]{8}\/>$/);
  });

  it('starts showing the last four at 32 characters, not before', () => {
    expect(new Secret('a'.repeat(31)).keyprint()).toMatch(/^<keyprint:…#[0-9a-f]{8}\/>$/);
    expect(new Secret(`${'a'.repeat(28)}WXYZ`).keyprint()).toMatch(/^<keyprint:…WXYZ#[0-9a-f]{8}\/>$/);
  });

  it('never shows a value that is nothing but a known prefix', () => {
    expect(new Secret('sk-').keyprint()).toMatch(/^<keyprint:…#[0-9a-f]{8}\/>$/);
  });
});

describe('the boundary', () => {
  // Only the code that writes a file may unwrap a secret (ADR-0001, the note on
  // Simon: the value path is sealed behind one narrow interface). Listed here,
  // so widening the boundary is a visible change in review, never an accident.
  const MAY_REVEAL: string[] = [
    'targets/dotenv.ts', // the first target: quotes and writes the value into .env (2026-10-20)
  ];

  it('lets no module outside the file writers call reveal()', () => {
    const src = resolve(__dirname, '..');
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) { if (name !== 'test') { walk(path); } continue; }
        if (path.endsWith('.ts')) { files.push(path); }
      }
    };
    walk(src);

    const revealing = files
      .filter(path => /\.reveal\(\)/.test(readFileSync(path, 'utf8')))
      .map(path => relative(src, path));

    expect(revealing.filter(path => !MAY_REVEAL.includes(path))).toEqual([]);
  });
});
