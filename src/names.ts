// Which variable names keyhole will write (ADR-0001). A request chooses the
// name, and a request can come from anywhere local, so some names are refused:
// they turn a pasted value into code that runs in every later session, or the
// harness drops them anyway (Surveyor 5.1's source check, 2026-10-20).

const SHAPE = /^[A-Z][A-Z0-9_]*$/;

const REFUSED_EXACT = new Set([
  'PATH', 'NODE_OPTIONS', 'NODE_PATH', 'LD_PRELOAD', 'LD_LIBRARY_PATH', 'PYTHONPATH', 'PYTHONSTARTUP',
  'PERL5OPT', 'RUBYOPT', 'BASH_ENV', 'ENV', 'PROMPT_COMMAND', 'GIT_SSH_COMMAND', 'GIT_EXEC_PATH',
  'GIT_CONFIG_GLOBAL', 'SHELL', 'HOME', 'TMPDIR', 'CLAUDE_CONFIG_DIR',
]);
const REFUSED_PREFIXES = ['DYLD_', 'XDG_'];

export type NameCheck = { ok: true } | { ok: false; reason: string };

/** Whether keyhole may write a variable of this name, and if not, why, in words a person can act on. */
export function checkName(name: string): NameCheck {
  if (!SHAPE.test(name)) {
    return { ok: false, reason: 'use capital letters, digits and underscores, starting with a letter (for example NEON_API_KEY)' };
  }
  if (REFUSED_EXACT.has(name) || REFUSED_PREFIXES.some(prefix => name.startsWith(prefix))) {
    return { ok: false, reason: `${name} changes how programs run, so a value for it could run code in every later session; keyhole does not write it` };
  }
  return { ok: true };
}
