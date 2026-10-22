import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as vscode from 'vscode';
import { log } from './log';

// Connecting a model's harness to Keyhole's API (ADR-0005; Surveyor's reading,
// docs/reviews/2026-10-22-mcp-server-inside-an-extension.md). The server lives
// in Keyhole's extension folder, whose path carries the version, so Keyhole
// keeps a copy where the path does not change: VS Code's storage folder for
// this extension. Each harness is told about it once, at user scope, by a
// command the person runs; Keyhole runs nothing itself (no child_process).
// VS Code's own chat needs no copy: VS Code starts the server from the
// extension folder, with its own Node. Words are provisional until the naming
// review rules.

const SERVER = 'mcp-server.js';
const STAMP = 'mcp-server.version';

/** Copies the server to Keyhole's storage folder when this version's copy is not there yet; returns its path. */
export async function installServerCopy(context: vscode.ExtensionContext): Promise<string> {
  const folder = context.globalStorageUri.fsPath;
  const target = join(folder, SERVER);
  const version = String(context.extension.packageJSON.version);
  let stamped = '';
  try { stamped = await readFile(join(folder, STAMP), 'utf8'); } catch { /* first run */ }
  if (stamped !== version) {
    await mkdir(folder, { recursive: true });
    await copyFile(join(context.extensionPath, 'dist', SERVER), target);
    await writeFile(join(folder, STAMP), version, 'utf8');
    log(`the API for models is at ${target} (Keyhole ${version})`);
  }
  return target;
}

export interface Harness { label: string; command: (server: string) => string }

/** One registration line per harness, at user scope (Surveyor's table, section 1). */
export const HARNESSES: Harness[] = [
  { label: 'Claude Code', command: server => `claude mcp add --scope user --transport stdio keyhole -- node "${server}"` },
  { label: 'Codex CLI', command: server => `codex mcp add keyhole -- node "${server}"` },
  { label: 'Gemini CLI', command: server => `gemini mcp add -s user keyhole node "${server}"` },
  { label: 'Grok Build', command: server => `grok mcp add keyhole -- node "${server}"` },
];

/** The command: copies the line that connects the chosen harness, for the person to run once. */
export async function connectAssistant(server: string): Promise<void> {
  const chosen = await vscode.window.showQuickPick(HARNESSES.map(harness => ({ label: harness.label, harness })), {
    title: 'Keyhole: Connect an Assistant',
    placeHolder: 'Which assistant should be able to ask Keyhole whether a secret is set?',
  });
  if (!chosen) { return; }
  const line = chosen.harness.command(server);
  await vscode.env.clipboard.writeText(line);
  log(`connect: copied the line for ${chosen.label}`);
  void vscode.window.showInformationMessage(
    `Copied the line that connects ${chosen.label} to Keyhole. Run it once in a terminal: ${chosen.label} can then ask whether a secret is set, never for its value. It needs Node.js on your PATH.`,
  );
}

/** VS Code's own chat: the server from the extension folder, started by VS Code with its own Node. */
export function offerToVsCodeChat(context: vscode.ExtensionContext): vscode.Disposable | undefined {
  if (typeof vscode.lm?.registerMcpServerDefinitionProvider !== 'function') { return undefined; }
  const version = String(context.extension.packageJSON.version);
  return vscode.lm.registerMcpServerDefinitionProvider('keyhole.mcp', {
    provideMcpServerDefinitions: () => {
      const definition = new vscode.McpStdioServerDefinition('Keyhole', process.execPath, [join(context.extensionPath, 'dist', SERVER)], { ELECTRON_RUN_AS_NODE: '1' }, version);
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (folder) { definition.cwd = folder.uri; }
      return [definition];
    },
  });
}
