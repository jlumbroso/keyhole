import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type * as vscode from 'vscode';
import { activate } from '../extension';
import { loggedLines, resetVscodeMock } from './helpers/vscodeMock';

const MANIFEST = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf8'));

describe('activation', () => {
  it('logs the extension version and the VS Code version first, so a stale install shows at once', () => {
    resetVscodeMock();
    activate({ subscriptions: [], extension: { packageJSON: MANIFEST } } as unknown as vscode.ExtensionContext);

    expect(loggedLines()[0]).toBe(`Keyhole ${MANIFEST.version} activated on Visual Studio Code (mock) 1.141.0-mock`);
  });
});
