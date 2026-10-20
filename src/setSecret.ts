import { appendFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as vscode from 'vscode';
import type { GitFacts } from './git';
import { log } from './log';
import { checkName } from './names';
import { Secret } from './secret';
import { append, DOTENV, probe, quote } from './targets/dotenv';

// The person's own path (ADR-0001, the first build): a command, the masked box,
// git's checks, appending to `.env`, the probes before and after, and the log.
// No model is involved. Every word a person reads here is the naming review's
// ruling (ADR-0002, QST-NAME-PERSON-PATH): Keyhole destroys nothing, so a second
// value is "set" and the old line is "superseded", never "replaced".

export const ADD_TO_GITIGNORE = 'Add to .gitignore';
export const SET_NEW_VALUE = 'Set New Value';
/** Both boxes' title: VS Code names the field from it, so a screen reader says more than "input" (ADR-0003). */
const BOX_TITLE = 'Keyhole: Set a Secret in .env';

let version = '0.0.0';

/** Call once, from `activate`. */
export function initSetSecret(context: vscode.ExtensionContext): void {
  version = String(context.extension.packageJSON.version ?? '0.0.0');
}

async function pickFolder(): Promise<vscode.WorkspaceFolder | undefined> {
  const folders = (vscode.workspace.workspaceFolders ?? []).filter(folder => folder.uri.scheme === 'file');
  if (folders.length === 0) {
    void vscode.window.showInformationMessage('Keyhole: open a folder first; secrets are written to its .env.');
    return undefined;
  }
  if (folders.length === 1) { return folders[0]; }
  const picked = await vscode.window.showQuickPick(folders.map(folder => ({ label: folder.name, folder })), { placeHolder: 'Set a secret in which folder\'s .env?' });
  return picked?.folder;
}

/** Makes sure git keeps `.env` out of commits, or explains why it cannot write; true to go on. */
async function protect(git: GitFacts, folder: vscode.WorkspaceFolder): Promise<boolean> {
  const place = `${folder.name}/${DOTENV}`;
  let state = await git.protection(folder.uri.fsPath, DOTENV);
  if (typeof state === 'object') {
    log(`stopped: git cannot be asked about ${place}: ${state.unavailable}`);
    void vscode.window.showWarningMessage(`Keyhole did not write ${place}: it could not ask git whether the file is kept out of commits (${state.unavailable}).`);
    return false;
  }
  log(`probe: git says ${place} is ${state}`);
  if (state === 'tracked') {
    void vscode.window.showWarningMessage(`Keyhole did not write ${place}: git tracks it, so a secret written there would go into the next commit. Stop tracking it first (git rm --cached ${DOTENV}), then add it to .gitignore.`);
    return false;
  }
  if (state === 'not-ignored') {
    const answer = await vscode.window.showWarningMessage(
      `${place} is not ignored by git, so a "git add ." would put your secrets in the next commit. Add it to .gitignore?`,
      { modal: true }, ADD_TO_GITIGNORE,
    );
    if (answer !== ADD_TO_GITIGNORE) { log(`stopped: ${place} is not ignored, and the person chose not to add it to .gitignore`); return false; }
    const gitignore = join(folder.uri.fsPath, '.gitignore');
    let current = '';
    try { current = await readFile(gitignore, 'utf8'); } catch { /* no .gitignore yet */ }
    await appendFile(gitignore, `${current === '' || current.endsWith('\n') ? '' : '\n'}\n# Secrets stay out of git (added by Keyhole ${version})\n${DOTENV}\n`);
    state = await git.protection(folder.uri.fsPath, DOTENV);
    const shown = typeof state === 'object' ? state.unavailable : state;
    log(`probe: after adding ${DOTENV} to .gitignore, git says ${place} is ${shown}`);
    if (state !== 'protected') {
      void vscode.window.showWarningMessage(`Keyhole added ${DOTENV} to .gitignore, but git still does not ignore ${place} (${shown}); nothing was written.`);
      return false;
    }
  }
  if (state === 'no-repository') { log(`note: ${folder.name} is not a git repository; nothing can commit ${DOTENV} by accident from here`); }
  return true;
}

/** The command: asks for a name, then for the value in a masked box, and appends it to the folder's `.env`. */
export async function setSecret(git: GitFacts): Promise<void> {
  const folder = await pickFolder();
  if (!folder) { return; }
  const name = await vscode.window.showInputBox({
    title: BOX_TITLE,
    prompt: 'Name of the variable to set (for example NEON_API_KEY)',
    ignoreFocusOut: true,
    validateInput: text => { const check = checkName(text); return check.ok ? undefined : check.reason; },
  });
  if (!name) { return; }
  const nameCheck = checkName(name);
  if (!nameCheck.ok) { void vscode.window.showWarningMessage(`Keyhole did not write ${name}: ${nameCheck.reason}.`); return; }

  if (!(await protect(git, folder))) { return; }

  const place = `${folder.name}/${DOTENV}`;
  const before = await probe(folder.uri.fsPath, name);
  log(before.lines.length === 0
    ? `probe: ${name} is not set in ${place}`
    : `probe: ${name} is set in ${place} (line ${before.lines.join(', ')}; ${before.fingerprint}, ${before.length} characters)`);
  if (before.lines.length > 0) {
    const answer = await vscode.window.showWarningMessage(
      `${name} is already set in ${place} (${before.fingerprint}, ${before.length} characters). Set a new value?`,
      { modal: true, detail: 'The old line stays in the file (loaders use the last); Keyhole marks it superseded.' }, SET_NEW_VALUE,
    );
    if (answer !== SET_NEW_VALUE) { log(`stopped: ${name} already set; the person kept it`); return; }
  }

  // The masked box: the value goes from the person to the file, and nowhere else.
  const typed = await vscode.window.showInputBox({
    title: BOX_TITLE,
    prompt: `Paste the value of ${name}. It is written to ${place} and nowhere else.`,
    password: true,
    ignoreFocusOut: true,
  });
  if (!typed) { log(`stopped: no value given for ${name}`); return; }
  const secret = new Secret(typed);

  const quoted = quote(secret);
  if (!quoted.ok) { void vscode.window.showWarningMessage(`Keyhole did not write ${name}: ${quoted.reason}.`); log(`refused: ${name}: ${quoted.reason}`); return; }

  const supersedes = before.lines.length > 0 ? ` (supersedes line ${before.lines.at(-1)})` : '';
  const comment = `Keyhole ${version} · ${new Date().toISOString()} · set ${name}${supersedes}`;
  const written = await append(folder.uri.fsPath, name, quoted.text, comment);

  const after = await probe(folder.uri.fsPath, name);
  const verified = after.fingerprint === secret.fingerprint() && after.lines.at(-1) === written.line;
  log(`${verified ? 'wrote' : 'wrote, but could not verify,'} ${name} to ${place} line ${written.line}${written.created ? ' (new file, owner-only)' : ''}: ${secret.fingerprint()}, ${secret.length} characters${supersedes}`);
  if (!verified) {
    void vscode.window.showWarningMessage(`Keyhole wrote ${name} to ${place}, but reading it back did not match; please check the file.`);
    return;
  }
  void vscode.window.showInformationMessage(`Keyhole set ${name} in ${place} (${secret.length} characters).`);
}
