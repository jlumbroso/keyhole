import * as vscode from 'vscode';

let channel: vscode.LogOutputChannel | undefined;

/**
 * Creates the "Keyhole" output channel. Call once, from `activate`.
 *
 * It is a log channel, so VS Code stamps each line and also writes it to a
 * file under its own logs folder. That file is how a run can be read
 * afterwards without anyone copying text out of the Output panel.
 */
export function initLog(): vscode.LogOutputChannel {
  channel = vscode.window.createOutputChannel('Keyhole', { log: true });
  return channel;
}

export function log(message: string): void {
  channel?.info(message);
}

export function describeError(err: unknown): string {
  return err instanceof Error ? (err.stack ?? err.message) : String(err);
}
