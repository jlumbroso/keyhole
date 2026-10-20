import { createHash } from 'node:crypto';

// The first law as a type (ADR-0001, the note on Simon's Architecture of
// Complexity): a secret never enters the conversation, so it must not be
// printable, loggable or serializable by accident anywhere in keyhole. Only
// the file writers unwrap it, with `reveal()`, and a test fails if any other
// module does (src/test/secret.test.ts, "the boundary").

const REDACTED = '[redacted]';

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
   * How the log names the value (ADR-0001, QST-FINGERPRINT, B): the token's
   * public prefix, when the value has it (the same for every token of that kind,
   * from its service card), and the first eight hex digits of a SHA-256 of the
   * value. Identifies the key across log lines and rotations; reveals none of it.
   * The marker's name is provisional until the naming review.
   */
  fingerprint(publicPrefix?: string): string {
    const prefix = publicPrefix && this.#value.startsWith(publicPrefix) ? publicPrefix : '';
    const hash = createHash('sha256').update(this.#value, 'utf8').digest('hex').slice(0, 8);
    return `<OBKEY:${prefix}…#${hash}/>`;
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
