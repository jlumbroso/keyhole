import { createHash } from 'node:crypto';
import { publicPrefixOf } from './prefixes';

// The first law as a type (ADR-0001, the note on Simon's Architecture of
// Complexity): a secret never enters the conversation, so it must not be
// printable, loggable or serializable by accident anywhere in keyhole. Only
// the file writers unwrap it, with `reveal()`, and a test fails if any other
// module does (src/test/secret.test.ts, "the boundary").

const REDACTED = '[redacted]';
/** From this many characters on, a keyprint shows the value's last four (ADR-0002, QST-KEYPRINT-LEGIBLE). */
export const KEYPRINT_LONG = 32;

export class Secret {
  readonly #value: string;

  constructor(value: string) {
    this.#value = value;
    Object.freeze(this);
  }

  /** How many characters the value has: shown to the person and in the log, never the characters. */
  get length(): number {
    return this.#value.length;
  }

  /**
   * How the log and the questions name the value: its keyprint (the naming
   * review's word, after the SSH key fingerprint; ADR-0002). Always the
   * service's public prefix, when the value has one, and the first eight hex
   * digits of a SHA-256 of the value, so every keyprint verifies against a
   * value. A long value also shows its last four characters, which the
   * service's own page shows too, so a person recognizes it by eye: four of 32
   * or more characters are at most an eighth of it; a short value, where four
   * would be a real share, shows none (QST-KEYPRINT-LEGIBLE, C, with
   * Jérémie's invariant that the prefix always shows).
   */
  keyprint(): string {
    const prefix = publicPrefixOf(this.#value);
    const lastFour = this.showsLastFour ? this.#value.slice(-4) : '';
    const hash = createHash('sha256').update(this.#value, 'utf8').digest('hex').slice(0, 8);
    return `<keyprint:${prefix}…${lastFour}#${hash}/>`;
  }

  /** Whether the keyprint shows the last four characters (the value has at least KEYPRINT_LONG). */
  get showsLastFour(): boolean {
    return this.#value.length >= KEYPRINT_LONG;
  }

  /** The value itself. Only the file writers may call this. */
  reveal(): string {
    return this.#value;
  }

  toString(): string {
    return REDACTED;
  }

  valueOf(): string {
    return REDACTED;
  }

  toJSON(): never {
    throw new Error('keyhole: a Secret cannot be serialized');
  }

  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `Secret ${REDACTED}`;
  }
}
