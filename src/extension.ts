import * as vscode from 'vscode';
import { gitThroughVsCode } from './gitApi';
import { describeError, initLog, log } from './log';
import { initSetSecret, setSecret } from './setSecret';

// keyhole: a secret reaches a project's files without entering the
// conversation (ADR-0001). The first feature is the person's own path; its
// words are provisional until the naming review rules.

type Handler = () => Promise<unknown>;

/** Every command goes through this: awaited, logged, rethrown (porthole's rule: no invisible failures). */
function register(context: vscode.ExtensionContext, id: string, handler: Handler): void {
  context.subscriptions.push(vscode.commands.registerCommand(id, async () => {
    try {
      return await handler();
    } catch (err) {
      log(`${id} failed: ${describeError(err)}`);
      throw err;
    }
  }));
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(initLog());
  // A stale install and a changed VS Code are the two things worth seeing first (porthole's rule).
  log(`Keyhole ${context.extension.packageJSON.version} activated on ${vscode.env.appName} ${vscode.version}`);
  initSetSecret(context);
  register(context, 'keyhole.setSecret', () => setSecret(gitThroughVsCode));
}

export function deactivate(): void {}
