import { appendFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as vscode from 'vscode';
import type { GitFacts } from './git';
import { parseRequestLink } from './link';
import { log } from './log';
import { knownNames, refreshStatus } from './status';
import { addRequest, type KeyholeRequest, readRequests } from './requests';
import { setNamed } from './setSecret';
import { probe } from './targets/dotenv';

// The inbox as a list (ADR-0004, D: "with the inbox as a stable form";
// ADR-0005): a model's request waits in the project's record instead of
// opening a box; the person opens the list when ready, and each request runs
// the person's path with the name already given. Nothing here holds a value:
// the value is typed in the masked box (src/setSecret.ts) and goes straight to
// `.env`. Every word is provisional until the naming review rules.

export const SHOW_INBOX = 'Show Inbox';
export const ADD_TO_ENV_EXAMPLE = 'Add to .env.example';
const ENV_EXAMPLE = '.env.example';

/** The folder a request means: `repo=` names one, or the window has exactly one. */
function folderFor(repo: string | undefined): vscode.WorkspaceFolder | string {
  const folders = (vscode.workspace.workspaceFolders ?? []).filter(folder => folder.uri.scheme === 'file');
  if (repo !== undefined) {
    return folders.find(folder => folder.name === repo) ?? `this window has no folder named ${repo}`;
  }
  if (folders.length === 1) { return folders[0]; }
  return folders.length === 0
    ? 'this window has no folder open to keep the request in'
    : `this window has ${folders.length} folders; add repo=<folder name> to the link`;
}

/** How a request's words are shown: always as the assistant's, plain text, never a link (ADR-0004, QST-MODEL-TEXT, A). */
export function assistantSays(request: KeyholeRequest): string | undefined {
  const parts = [request.why, request.where ? `Where to get it: ${request.where}` : undefined].filter(Boolean);
  return parts.length === 0 ? undefined : `Your assistant says: ${parts.join(' ')}`;
}

/** A link from outside VS Code: record the request, refresh the cache, and say it is waiting. Never opens a box. */
export async function handleRequestLink(git: GitFacts, uri: { path: string; query: string }): Promise<void> {
  const parsed = parseRequestLink(uri);
  if ('refused' in parsed) {
    log(`link refused: ${parsed.refused}`);
    void vscode.window.showWarningMessage(`Keyhole did not record the request: ${parsed.refused}.`);
    return;
  }
  const folder = folderFor(parsed.request.repo);
  if (typeof folder === 'string') {
    log(`link refused: ${folder}`);
    void vscode.window.showWarningMessage(`Keyhole did not record the request: ${folder}.`);
    return;
  }
  const { names, why, where } = parsed.request;
  const added = await addRequest(folder.uri.fsPath, { kind: 'request', names, why, where, asked: new Date().toISOString() });
  if (!added.added && added.reason !== 'already requested') {
    log(`link refused: ${added.reason}`);
    void vscode.window.showWarningMessage(`Keyhole did not record the request: ${added.reason}.`);
    return;
  }
  log(`request: ${names.join(', ')} in ${folder.name} (${added.added ? 'recorded' : 'already recorded'})`);
  await refresh(git, folder, names);
  await ring(git, names);
}

/** The doorbell: says a request is waiting, and opens the list only if the person asks. */
async function ring(git: GitFacts, names: string[]): Promise<void> {
  const answer = await vscode.window.showInformationMessage(`Your assistant asked for ${names.join(', ')}.`, SHOW_INBOX);
  if (answer === SHOW_INBOX) { await showInbox(git); }
}

async function refresh(git: GitFacts, folder: vscode.WorkspaceFolder, names: string[]): Promise<void> {
  const refreshed = await refreshStatus(git, folder.uri.fsPath, names);
  if (!refreshed.written) { log(`note: Keyhole's cache was not written: ${refreshed.reason}`); }
}

interface Waiting extends vscode.QuickPickItem {
  folder: vscode.WorkspaceFolder;
  request: KeyholeRequest;
  /** The request's names not yet set, in order. */
  pending: string[];
}

async function waitingRequests(): Promise<Waiting[]> {
  const folders = (vscode.workspace.workspaceFolders ?? []).filter(folder => folder.uri.scheme === 'file');
  const waiting: Waiting[] = [];
  for (const folder of folders) {
    const record = await readRequests(folder.uri.fsPath);
    record.refused.forEach(reason => log(`requests in ${folder.name}: ${reason}`));
    for (const request of record.requests) {
      const pending: string[] = [];
      for (const name of request.names) {
        if ((await probe(folder.uri.fsPath, name)).lines.length === 0) { pending.push(name); }
      }
      if (pending.length === 0) { continue; }
      waiting.push({
        label: pending.join(', '),
        description: folders.length > 1 ? folder.name : undefined,
        detail: assistantSays(request),
        folder, request, pending,
      });
    }
  }
  return waiting;
}

/** The command: lists the requests still waiting, and runs the person's path for the one chosen. */
export async function showInbox(git: GitFacts): Promise<void> {
  const waiting = await waitingRequests();
  if (waiting.length === 0) {
    void vscode.window.showInformationMessage('Keyhole: no requests are waiting.');
    return;
  }
  const chosen = await vscode.window.showQuickPick(waiting, { title: 'Keyhole: Show Inbox', placeHolder: 'Choose a request to set its value', matchOnDetail: true, ignoreFocusOut: true });
  if (!chosen) { return; }
  const done: string[] = [];
  for (const name of chosen.pending) {
    const set = await setNamed(git, chosen.folder, name);
    if (!set) { break; } // a sequence stops where the person stopped; the rest stays waiting
    done.push(name);
  }
  if (done.length > 0) { await refresh(git, chosen.folder, done); }
  if (done.length === chosen.pending.length) { await offerEnvExample(chosen.folder, chosen.request.names); }
}

/**
 * Offers to keep `.env.example` in step (ADR-0005, QST-REQUEST-FILE, C): each
 * requested name not yet there, with an empty value. Names only, never a value.
 */
export async function offerEnvExample(folder: vscode.WorkspaceFolder, names: string[]): Promise<void> {
  const path = join(folder.uri.fsPath, ENV_EXAMPLE);
  let current = '';
  try { current = await readFile(path, 'utf8'); } catch { /* not yet */ }
  const has = (name: string) => new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=`, 'm').test(current);
  const missing = names.filter(name => !has(name));
  if (missing.length === 0) { return; }
  const answer = await vscode.window.showInformationMessage(
    `Add ${missing.join(', ')} to ${ENV_EXAMPLE} (recommended): it tells the next person who clones this project which secrets it needs, without any value.`,
    ADD_TO_ENV_EXAMPLE,
  );
  if (answer !== ADD_TO_ENV_EXAMPLE) { return; }
  const lines = missing.map(name => `${name}=`).join('\n');
  await appendFile(path, `${current === '' || current.endsWith('\n') ? '' : '\n'}# Needed by this project (recorded by Keyhole)\n${lines}\n`);
  log(`added ${missing.join(', ')} to ${folder.name}/${ENV_EXAMPLE}, names only`);
}

/**
 * Watches each folder's `.env` (a value edited by hand refreshes the cache) and
 * the record (a request a model wrote into the file rings like a link, the
 * other route of QST-REQUEST-ROUTE, C). Requests already there when Keyhole
 * starts do not ring.
 */
export function watchInbox(git: GitFacts): vscode.Disposable {
  const seen = new Set<string>();
  const key = (folder: vscode.WorkspaceFolder, request: KeyholeRequest) => `${folder.uri.fsPath}\n${request.names.join('\n')}`;
  const folders = () => (vscode.workspace.workspaceFolders ?? []).filter(folder => folder.uri.scheme === 'file');
  void (async () => { for (const folder of folders()) { (await readRequests(folder.uri.fsPath)).requests.forEach(request => seen.add(key(folder, request))); } })();

  const onEnv = async (uri: vscode.Uri) => {
    const folder = vscode.workspace.getWorkspaceFolder(uri);
    if (!folder) { return; }
    const names = new Set([...(await readRequests(folder.uri.fsPath)).requests.flatMap(request => request.names), ...await knownNames(folder.uri.fsPath)]);
    if (names.size > 0) { await refresh(git, folder, [...names]); }
  };
  const onRecord = async (uri: vscode.Uri) => {
    const folder = vscode.workspace.getWorkspaceFolder(uri);
    if (!folder) { return; }
    const record = await readRequests(folder.uri.fsPath);
    record.refused.forEach(reason => log(`requests in ${folder.name}: ${reason}`));
    const fresh = record.requests.filter(request => !seen.has(key(folder, request)));
    fresh.forEach(request => seen.add(key(folder, request)));
    for (const request of fresh) {
      log(`request: ${request.names.join(', ')} in ${folder.name} (written into the record)`);
      await refresh(git, folder, request.names);
      await ring(git, request.names);
    }
  };
  const env = vscode.workspace.createFileSystemWatcher('**/.env');
  const record = vscode.workspace.createFileSystemWatcher('**/.keyhole/inbox.json');
  return vscode.Disposable.from(
    env, record,
    env.onDidChange(onEnv), env.onDidCreate(onEnv), env.onDidDelete(onEnv),
    record.onDidChange(onRecord), record.onDidCreate(onRecord),
  );
}
