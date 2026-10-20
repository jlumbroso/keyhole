import * as vscode from 'vscode';
import { initLog, log } from './log';

// keyhole: a secret reaches a project's files without entering the
// conversation (ADR-0001). Nothing is contributed yet: the first feature, the
// person's own path, comes next, with its names through the naming review.

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(initLog());
  // A stale install and a changed VS Code are the two things worth seeing first (porthole's rule).
  log(`Keyhole ${context.extension.packageJSON.version} activated on ${vscode.env.appName} ${vscode.version}`);
}

export function deactivate(): void {}
