import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { answer, type Deps, serve, TOOL } from '../mcp/server';
import { STATUS_FILE } from '../paths';

// Keyhole's API for models (ADR-0005, QST-OUTCOME-ROUTE, D): an MCP server a
// model's harness starts. It says whether a name is set, never a value, and it
// lives on the model's side of the wall, so it opens no file but the cache.

const FAKE = ['ghp', 'FAKEfakeFAKEfakeFAKEfakeFAKEfake1234'].join('_');

let project: string;
let opened: string[];
const deps = (overrides: Partial<Deps> = {}): Deps => ({
  readFile: async path => { opened.push(path); return readFile(path, 'utf8'); },
  env: {},
  cwd: '/nowhere',
  ...overrides,
});
const call = (args: { [key: string]: unknown }, given = deps()) => answer({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: TOOL, arguments: args } }, given);
const text = (reply: unknown) => (reply as { result: { content: Array<{ text: string }> } }).result.content[0].text;

beforeEach(() => {
  project = mkdtempSync(join(tmpdir(), 'keyhole-mcp-'));
  opened = [];
  mkdirSync(join(project, '.keyhole'));
  writeFileSync(join(project, STATUS_FILE), JSON.stringify({ format: 1, variables: {
    GITHUB_TOKEN: { set: true, length: 40, keyprint: '<keyprint:ghp_…1234#0a1b2c3d/>', checked: '2026-10-22T20:00:00Z' },
    NEON_API_KEY: { set: false, checked: '2026-10-22T20:00:00Z' },
  } }));
  writeFileSync(join(project, '.env'), `GITHUB_TOKEN=${FAKE}\n`); // there, and never opened
});
afterEach(() => {
  rmSync(project, { recursive: true, force: true });
});

describe('the tool', () => {
  it('says a name is set, with its length and keyprint, and never the value', async () => {
    const reply = await call({ name: 'GITHUB_TOKEN', project });

    expect(text(reply)).toBe(`GITHUB_TOKEN is set in ${project}/.env (40 characters, <keyprint:ghp_…1234#0a1b2c3d/>); checked 2026-10-22T20:00:00Z.`);
    expect(reply).toMatchObject({ result: { structuredContent: { name: 'GITHUB_TOKEN', set: true, length: 40 }, isError: false } });
    expect(JSON.stringify(reply)).not.toContain(FAKE.slice(4, 12));
  });

  it('says a requested name is not set yet, and how the person sets it', async () => {
    expect(text(await call({ name: 'NEON_API_KEY', project }))).toMatch(/NEON_API_KEY is not set in .* yet; .* Keyhole: Show Inbox/);
  });

  it('says Keyhole has not looked at a name, and gives the link to ask for it', async () => {
    expect(text(await call({ name: 'RENDER_API_KEY', project }))).toMatch(/has not looked at RENDER_API_KEY .* vscode:\/\/jlumbroso\.keyhole\/v1\/request\?name=RENDER_API_KEY/);
  });

  it('opens no file but the cache, even with .env beside it', async () => {
    await call({ name: 'GITHUB_TOKEN', project });
    await call({ name: 'NEON_API_KEY', project });

    expect(opened.length).toBeGreaterThan(0);
    expect(opened.every(path => path === join(project, STATUS_FILE))).toBe(true);
  });

  it('refuses an argument that could carry a value, and a name Keyhole would not write', async () => {
    expect(await call({ name: 'GITHUB_TOKEN', value: FAKE, project })).toMatchObject({ result: { isError: true } });
    expect(text(await call({ name: 'GITHUB_TOKEN', value: FAKE, project }))).toMatch(/never takes a value/);
    expect(text(await call({ name: 'NODE_OPTIONS', project }))).toMatch(/changes how programs run/);
  });

  it('finds the project from CLAUDE_PROJECT_DIR, then its working directory, when none is given', async () => {
    expect(text(await call({ name: 'GITHUB_TOKEN' }, deps({ env: { CLAUDE_PROJECT_DIR: project } })))).toMatch(/is set/);
    expect(text(await call({ name: 'GITHUB_TOKEN' }, deps({ cwd: project })))).toMatch(/is set/);
    expect(text(await call({ name: 'GITHUB_TOKEN', project: 'relative/path' }))).toMatch(/absolute path/);
  });
});

describe('the protocol', () => {
  it('agrees on a protocol version the client knows, and offers its one tool', async () => {
    const init = await answer({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }, deps());
    expect(init).toMatchObject({ result: { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'keyhole' } } });
    const newer = await answer({ jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: '2099-01-01' } }, deps());
    expect(newer).toMatchObject({ result: { protocolVersion: '2026-07-28' } });
    const list = await answer({ jsonrpc: '2.0', id: 3, method: 'tools/list' }, deps());
    expect(list).toMatchObject({ result: { tools: [{ name: TOOL, inputSchema: { required: ['name'], additionalProperties: false } }] } });
  });

  it('answers no notification, and refuses a method it does not have', async () => {
    expect(await answer({ jsonrpc: '2.0', method: 'notifications/initialized' }, deps())).toBeUndefined();
    expect(await answer({ jsonrpc: '2.0', id: 4, method: 'resources/list' }, deps())).toMatchObject({ error: { code: -32601 } });
  });

  it('speaks one JSON message per line on stdout, and stops when stdin closes', async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    const lines: string[] = [];
    output.on('data', (chunk: Buffer) => lines.push(...chunk.toString('utf8').split('\n').filter(Boolean)));
    const served = serve(input, output, deps());

    input.write('{"jsonrpc":"2.0","id":1,"method":"ping"}\n{"jsonrpc":"2.0","method":"notifications/initialized"}\nnot json\n');
    input.end();
    await served;

    expect(lines.map(line => JSON.parse(line) as unknown)).toEqual([
      { jsonrpc: '2.0', id: 1, result: {} },
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } },
    ]);
  });
});

describe('the wall', () => {
  it('never imports the code that reads .env or holds a value', () => {
    // The process a model's harness starts must not be able to read a secret
    // even by mistake: walk every import from its entry point.
    const src = resolve(import.meta.dirname, '..');
    const forbidden = /^(secret|setSecret|status|inbox|requests|gitApi|extension)\.ts$|^targets\//;
    const seen = new Set<string>();
    const walk = (file: string) => {
      if (seen.has(file)) { return; }
      seen.add(file);
      for (const match of readFileSync(file, 'utf8').matchAll(/from '(\.[^']+)'/g)) {
        walk(`${resolve(dirname(file), match[1])}.ts`);
      }
    };
    walk(join(src, 'mcp', 'main.ts'));
    const reached = [...seen].map(file => relative(src, file));
    expect(reached.filter(file => forbidden.test(file))).toEqual([]);
    expect(reached.sort()).toEqual(['mcp/main.ts', 'mcp/server.ts', 'names.ts', 'paths.ts']);
  });
});
