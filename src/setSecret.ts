import { appendFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as vscode from 'vscode';
import type { GitFacts } from './git';
import { log } from './log';
import { checkName } from './names';
import { KEYPRINT_LONG, Secret } from './secret';
import { append, DOTENV, probe, quote } from './targets/dotenv';

// The person's own path (ADR-0001, the first build): a command, the masked box,
// git's checks, appending to `.env`, the probes before and after, and the log.
// No model is involved. Every word a person reads here is the naming review's
// (ADR-0002): Keyhole destroys nothing, so a second value is "set" and the old
// line is "superseded", never "replaced"; and every question follows its modal
// grammar (QST-MODALS-WHY): the message is the recommendation, the detail is
// the why (mechanism, consequence, what Keyhole will do), a choice with no
// better option says when each fits, and a refusal gives a way forward.

export const ADD_TO_GITIGNORE = 'Add to .gitignore';
export const SET_NEW_VALUE = 'Set New Value';
/** Both boxes' title: VS Code names the field from it, so a screen reader says more than "input" (ADR-0003). */
const BOX_TITLE = 'Keyhole: Set a Secret in .env';
/** The masked box's eye button, both ways (ADR-0003, QST-SHOW-VALUE, A; tooltips confirmed by the naming review, №116). */
const SHOW_VALUE = { iconPath: new vscode.ThemeIcon('eye'), tooltip: 'Show the value' };
const HIDE_VALUE = { iconPath: new vscode.ThemeIcon('eye-closed'), tooltip: 'Hide the value' };

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

/** A refusal: what Keyhole did not do, then why and the way forward. */
function refuse(message: string, detail: string): void {
  void vscode.window.showWarningMessage(message, { modal: true, detail });
}

/** Makes sure git keeps `.env` out of commits, or explains why it cannot write; true to go on. */
async function protect(git: GitFacts, folder: vscode.WorkspaceFolder): Promise<boolean> {
  const place = `${folder.name}/${DOTENV}`;
  let state = await git.protection(folder.uri.fsPath, DOTENV);
  if (typeof state === 'object') {
    log(`stopped: git cannot be asked about ${place}: ${state.unavailable}`);
    refuse(`Keyhole did not write ${place}: it could not ask git whether the file is kept out of commits.`,
      `${state.unavailable}. Keyhole writes nothing it cannot check. Make sure git is installed and VS Code's Git extension is on, then run the command again.`);
    return false;
  }
  log(`probe: git says ${place} is ${state}`);
  if (state === 'tracked') {
    refuse(`Keyhole did not write ${place}: git tracks it. Recommended: stop tracking it, then ignore it.`,
      `Anything written to a tracked file goes into the next commit and stays in the history. "git rm --cached ${DOTENV}" stops tracking the file without deleting it; then add ${DOTENV} to .gitignore. If ${DOTENV} was ever committed with a real secret in it, that secret is still in the history: replace it at its service.`);
    return false;
  }
  if (state === 'not-ignored') {
    const answer = await vscode.window.showWarningMessage(
      `Add ${DOTENV} to .gitignore first (recommended)`,
      { modal: true, detail: `Git doesn't ignore ${place} yet, so a "git add ." would commit your secrets — and a commit keeps them in the history even after the file is deleted. Keyhole adds one line to .gitignore, checks with git again, and writes nothing until ${DOTENV} is ignored.` },
      ADD_TO_GITIGNORE,
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
      refuse(`Keyhole added ${DOTENV} to .gitignore, but git still does not ignore ${place}; nothing was written.`,
        `Git says the file is ${shown}. A later line in .gitignore that starts with "!" can un-ignore it; check for one, then run the command again.`);
      return false;
    }
  }
  if (state === 'no-repository') { log(`note: ${folder.name} is not a git repository; nothing can commit ${DOTENV} by accident from here`); }
  return true;
}

/**
 * The masked box, with an eye button to show what was typed. The value is
 * hidden again whenever VS Code's window loses focus, since a revealed value
 * is in the window's pixels (ADR-0003, Surveyor's reading); there is no
 * timer, because hiding what a person is reading on a clock is a time limit
 * (WCAG 2.2.1). Resolves to the value, or undefined when the person leaves.
 */
function askForValue(prompt: string): Promise<string | undefined> {
  const box = vscode.window.createInputBox();
  box.title = BOX_TITLE;
  box.prompt = prompt;
  box.password = true;
  box.ignoreFocusOut = true;
  box.buttons = [SHOW_VALUE];
  const mask = () => { box.password = true; box.buttons = [SHOW_VALUE]; };
  return new Promise(resolve => {
    let settled = false;
    const subscriptions: vscode.Disposable[] = [];
    const settle = (value: string | undefined) => {
      if (settled) { return; }
      settled = true;
      subscriptions.forEach(subscription => subscription.dispose());
      box.dispose();
      resolve(value);
    };
    subscriptions.push(
      box.onDidTriggerButton(() => { if (box.password) { box.password = false; box.buttons = [HIDE_VALUE]; } else { mask(); } }),
      box.onDidAccept(() => settle(box.value)),
      box.onDidHide(() => settle(undefined)),
      vscode.window.onDidChangeWindowState(state => { if (!state.focused) { mask(); } }),
    );
    box.show();
  });
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
  if (before.unreadable) {
    log(`stopped: ${place} exists but could not be read (${before.unreadable})`);
    refuse(`Keyhole could not read ${place}, so it wrote nothing.`,
      `The file exists, but reading it failed (${before.unreadable}). Keyhole adds a line to .env and never rewrites it, so it must read the file first. Check its permissions (ls -l ${DOTENV} in that folder), then run the command again.`);
    return;
  }
  log(before.lines.length === 0
    ? `probe: ${name} is not set in ${place}`
    : `probe: ${name} is set in ${place} (line ${before.lines.join(', ')}; ${before.keyprint}, ${before.length} characters)`);
  if (before.lines.length > 0) {
    const answer = await vscode.window.showWarningMessage(
      `${name} is already set in ${place} (${before.keyprint}, ${before.length} characters). Set a new value?`,
      { modal: true, detail: 'The old line stays in the file (loaders use the last); Keyhole marks it superseded. Set a new value when you have a new one, for example after replacing a token at its service. Cancel keeps the value that is there. Once the new value works, delete the old line yourself if you like.' },
      SET_NEW_VALUE,
    );
    if (answer !== SET_NEW_VALUE) { log(`stopped: ${name} already set; the person kept it`); return; }
  }

  // The value goes from the person to the file, and nowhere else.
  const typed = await askForValue(`Paste the value of ${name}. It is written to ${place} and nowhere else. Tab reaches a button that shows what you typed.`);
  if (!typed) { log(`stopped: no value given for ${name}`); return; }
  const secret = new Secret(typed);

  const quoted = quote(secret);
  if (!quoted.ok) { void vscode.window.showWarningMessage(`Keyhole did not write ${name}: ${quoted.reason}.`); log(`refused: ${name}: ${quoted.reason}`); return; }

  const supersedes = before.lines.length > 0 ? ` (supersedes line ${before.lines.at(-1)})` : '';
  const comment = `Keyhole ${version} · ${new Date().toISOString()} · set ${name}${supersedes}`;
  const written = await append(folder.uri.fsPath, name, quoted.text, comment);

  const after = await probe(folder.uri.fsPath, name);
  const verified = after.keyprint === secret.keyprint() && after.lines.at(-1) === written.line;
  // Which keyprint form was used, so a wrong threshold can be audited (ADR-0002, QST-KEYPRINT-LEGIBLE).
  const form = secret.showsLastFour ? `last four shown, ${KEYPRINT_LONG} or more characters` : `no last four, under ${KEYPRINT_LONG} characters`;
  log(`${verified ? 'wrote' : 'wrote, but could not verify,'} ${name} to ${place} line ${written.line}${written.created ? ' (new file, owner-only)' : ''}: ${secret.keyprint()} (${form}), ${secret.length} characters${supersedes}`);
  if (!verified) {
    void vscode.window.showWarningMessage(`Keyhole wrote ${name} to ${place}, but reading it back did not match; please check the file.`);
    return;
  }
  void vscode.window.showInformationMessage(`Keyhole set ${name} in ${place} (${secret.length} characters). Programs read ${DOTENV} when they start: restart the one that needs ${name}.`);
}
