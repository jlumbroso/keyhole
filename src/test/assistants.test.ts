import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type * as vscode from 'vscode';
import { connectAssistant, HARNESSES, installServerCopy, offerToVsCodeChat } from '../assistants';
import { initLog } from '../log';
import { clipboard, pickNext, registeredMcpProviders, resetVscodeMock, setWorkspaceFolders } from './helpers/vscodeMock';

// Connecting a model's harness to Keyhole's API (ADR-0005; Surveyor's
// reading): the server's path in the extension folder carries the version,
// so harnesses are pointed at a copy whose path does not change.

let root: string;
const context = (version: string) => ({
  extension: { packageJSON: { version } },
  extensionPath: join(root, `jlumbroso.keyhole-${version}`),
  globalStorageUri: { fsPath: join(root, 'globalStorage', 'jlumbroso.keyhole') },
}) as unknown as vscode.ExtensionContext;
function release(version: string, body: string): void {
  mkdirSync(join(root, `jlumbroso.keyhole-${version}`, 'dist'), { recursive: true });
  writeFileSync(join(root, `jlumbroso.keyhole-${version}`, 'dist', 'mcp-server.js'), body);
}

beforeEach(() => {
  resetVscodeMock();
  initLog();
  root = mkdtempSync(join(tmpdir(), 'keyhole-assistants-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('the copy at a path that survives updates', () => {
  it('keeps one path across versions, so a harness registered once still finds the server after an update', async () => {
    release('0.2.0', '// server 0.2.0');
    const first = await installServerCopy(context('0.2.0'));
    release('0.3.0', '// server 0.3.0');
    const second = await installServerCopy(context('0.3.0'));

    expect(second).toBe(first);
    expect(first).not.toMatch(/0\.[23]\.0/);
    expect(readFileSync(second, 'utf8')).toBe('// server 0.3.0');
  });

  it('copies once per version, not at every start', async () => {
    release('0.2.0', '// server 0.2.0');
    const path = await installServerCopy(context('0.2.0'));
    const copied = statSync(path).mtimeMs;
    await new Promise(resolve => setTimeout(resolve, 20));

    await installServerCopy(context('0.2.0'));

    expect(statSync(path).mtimeMs).toBe(copied);
  });
});

describe('connecting an assistant', () => {
  it('copies the line for the chosen harness, quoting the path with its spaces', async () => {
    pickNext(0);
    await connectAssistant('/Users/someone/Library/Application Support/Code/User/globalStorage/jlumbroso.keyhole/mcp-server.js');

    expect(clipboard()).toBe('claude mcp add --scope user --transport stdio keyhole -- node "/Users/someone/Library/Application Support/Code/User/globalStorage/jlumbroso.keyhole/mcp-server.js"');
  });

  it('has a user-scope line for each of the four harnesses Surveyor read', () => {
    expect(HARNESSES.map(harness => harness.label)).toEqual(['Claude Code', 'Codex CLI', 'Gemini CLI', 'Grok Build']);
    for (const harness of HARNESSES) { expect(harness.command('/stable/mcp-server.js')).toContain('"/stable/mcp-server.js"'); }
  });
});

describe('VS Code\'s own chat', () => {
  it('starts the server from the extension folder with VS Code\'s own Node, in the open folder', async () => {
    setWorkspaceFolders([root]);
    const offered = offerToVsCodeChat(context('0.2.0'));

    const [entry] = registeredMcpProviders();
    const [definition] = await entry.provider.provideMcpServerDefinitions() as Array<{ command: string; args: string[]; env: { [key: string]: string }; cwd: { fsPath: string } }>;
    expect(entry.id).toBe('keyhole.mcp');
    expect(definition.command).toBe(process.execPath);
    expect(definition.args).toEqual([join(root, 'jlumbroso.keyhole-0.2.0', 'dist', 'mcp-server.js')]);
    expect(definition.env).toEqual({ ELECTRON_RUN_AS_NODE: '1' });
    expect(definition.cwd.fsPath).toBe(root);
    offered?.dispose();
  });
});
