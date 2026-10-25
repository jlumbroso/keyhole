import { isAbsolute, join } from 'node:path';
import { checkName } from '../names';
import { STATUS_FILE } from '../paths';

// Keyhole's API for models (ADR-0005, QST-OUTCOME-ROUTE, D): a small MCP
// server, started by the model's harness over stdio, that says whether a
// variable is set in a project, with its length and keyprint, never its value.
//
// The wall (Simon's empty world, ADR-0005): this process belongs to the
// model's side, so it never opens `.env`. It reads one file, Keyhole's cache,
// which Keyhole's extension keeps inside VS Code; and it imports nothing that
// can read `.env` (src/test/mcpServer.test.ts walks its imports and fails if
// it reaches `secret.ts` or a target).
//
// Written by hand, not with the MCP SDK: the SDK's stdio path brings zod, ajv
// and their kin (Surveyor's reading), and this server needs four methods of
// JSON-RPC; a process on the model's side of a secrets tool should carry no
// code nobody here has read. The tool's name is provisional until the naming
// review rules.

export const TOOL = 'secret_status';
const SERVER = { name: 'keyhole', version: '0.0.0' };
const PROTOCOLS = ['2026-07-28', '2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

export interface Deps {
  /** Reads a file as text; the only file it is ever asked for is the cache. */
  readFile: (path: string) => Promise<string>;
  env: { [key: string]: string | undefined };
  cwd: string;
}

type Id = string | number;
interface Message { jsonrpc?: string; id?: Id; method?: string; params?: { [key: string]: unknown } }
type Reply = { jsonrpc: '2.0'; id: Id | null; result?: unknown; error?: { code: number; message: string } };

const result = (id: Id, value: unknown): Reply => ({ jsonrpc: '2.0', id, result: value });
const failure = (id: Id | null, code: number, message: string): Reply => ({ jsonrpc: '2.0', id, error: { code, message } });

const TOOL_DESCRIPTION = 'Says whether an environment variable is set in a project\'s .env, with its length and keyprint (a fingerprint that never shows the secret part of the value). Never returns a value. Use it after asking the person for a secret through Keyhole (the link vscode://jlumbroso.keyhole/v1/request?name=NAME, or Keyhole: Show Inbox), to learn when they have set it.';

/** What Keyhole's cache says about one name in one project, as the tool's text. */
async function check(args: { [key: string]: unknown }, deps: Deps): Promise<{ text: string; isError: boolean; structured?: unknown }> {
  const name = args.name;
  if (typeof name !== 'string') { return { text: 'Give the variable\'s name, for example {"name": "NEON_API_KEY"}. Never a value.', isError: true }; }
  const named = checkName(name);
  if (!named.ok) { return { text: `${name}: ${named.reason}.`, isError: true }; }
  const given = args.project;
  if (given !== undefined && (typeof given !== 'string' || !isAbsolute(given))) { return { text: 'project must be the project folder\'s absolute path.', isError: true }; }
  const project = given ?? deps.env.CLAUDE_PROJECT_DIR ?? deps.cwd;
  let variables: { [name: string]: { set?: unknown; length?: unknown; keyprint?: unknown; checked?: unknown } } = {};
  try {
    const parsed = JSON.parse(await deps.readFile(join(project, STATUS_FILE))) as { format?: unknown; variables?: typeof variables };
    if (parsed.format === 1 && parsed.variables && typeof parsed.variables === 'object') { variables = parsed.variables; }
  } catch { /* no cache yet: Keyhole has not looked at anything in this project */ }
  const known = variables[name];
  if (!known) {
    const structured = { name, project, known: false };
    return { text: `Keyhole has not looked at ${name} in ${project}. Ask the person for it with vscode://jlumbroso.keyhole/v1/request?name=${name} (they type the value in Keyhole's masked box, never in the conversation), then check again.`, isError: false, structured };
  }
  // Only these fields cross, whatever else the cache may hold one day.
  const structured = known.set === true
    ? { name, project, known: true, set: true, length: known.length, keyprint: known.keyprint, checked: known.checked }
    : { name, project, known: true, set: false, checked: known.checked };
  const text = known.set === true
    ? `${name} is set in ${project}/.env (${String(known.length)} characters, ${String(known.keyprint)}); checked ${String(known.checked)}.`
    : `${name} is not set in ${project}/.env yet; checked ${String(known.checked)}. The person sets it with Keyhole: Show Inbox.`;
  return { text, isError: false, structured };
}

/** One JSON-RPC message in, at most one reply out (notifications get none). */
export async function answer(message: Message, deps: Deps): Promise<Reply | undefined> {
  const id = message.id;
  if (message.jsonrpc !== '2.0' || typeof message.method !== 'string') { return failure(id ?? null, -32600, 'not a JSON-RPC 2.0 request'); }
  if (id === undefined) { return undefined; } // a notification, such as notifications/initialized
  switch (message.method) {
    case 'initialize': {
      const asked = message.params?.protocolVersion;
      const protocolVersion = typeof asked === 'string' && PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0];
      return result(id, { protocolVersion, capabilities: { tools: {} }, serverInfo: SERVER, instructions: 'Keyhole never returns a secret. Ask for one by name with its link; check whether it is set with secret_status.' });
    }
    case 'ping':
      return result(id, {});
    case 'tools/list':
      return result(id, { tools: [{
        name: TOOL,
        description: TOOL_DESCRIPTION,
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'The variable\'s name, for example NEON_API_KEY.' },
            project: { type: 'string', description: 'The project folder\'s absolute path; by default, CLAUDE_PROJECT_DIR, then the server\'s working directory.' },
          },
          required: ['name'],
          additionalProperties: false,
        },
      }] });
    case 'tools/call': {
      if (message.params?.name !== TOOL) { return failure(id, -32602, `unknown tool: ${String(message.params?.name)}`); }
      const args = (message.params.arguments ?? {}) as { [key: string]: unknown };
      const unknown = Object.keys(args).filter(key => key !== 'name' && key !== 'project');
      if (unknown.length > 0) { return result(id, { content: [{ type: 'text', text: `${TOOL} takes name and project only (not ${unknown.join(', ')}); it never takes a value.` }], isError: true }); }
      const checked = await check(args, deps);
      return result(id, { content: [{ type: 'text', text: checked.text }], ...(checked.structured ? { structuredContent: checked.structured } : {}), isError: checked.isError });
    }
    default:
      return failure(id, -32601, `method not found: ${message.method}`);
  }
}

/** The stdio loop: one JSON message per line in, one per line out; logs go to stderr; exits when stdin closes. */
export function serve(input: NodeJS.ReadableStream, output: NodeJS.WritableStream, deps: Deps): Promise<void> {
  return new Promise(resolve => {
    let buffer = '';
    let pending = Promise.resolve();
    input.setEncoding('utf8');
    input.on('data', (chunk: string) => {
      buffer += chunk;
      let newline: number;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line === '') { continue; }
        pending = pending.then(async () => {
          let reply: Reply | undefined;
          try { reply = await answer(JSON.parse(line) as Message, deps); } catch { reply = failure(null, -32700, 'parse error'); }
          if (reply) { output.write(`${JSON.stringify(reply)}\n`); }
        });
      }
    });
    input.on('end', () => { void pending.then(resolve); });
  });
}

