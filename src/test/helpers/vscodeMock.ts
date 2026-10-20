// A stand-in for the `vscode` module, aliased in vite.config.mts's `test` block
// only. It covers exactly what src/ imports and nothing more; grow it when a
// real usage demands it (porthole's rule, the vscode-extension-testing skill).

let logged: string[] = [];

export function resetVscodeMock(): void {
  logged = [];
}

/** Every line the extension wrote to its output channel, in order. */
export const loggedLines = () => logged;

export const version = '1.141.0-mock';
export const env = { appName: 'Visual Studio Code (mock)' };

export const window = {
  createOutputChannel(_name: string, _options?: { log: true }) {
    return { info: (line: string) => { logged.push(line); }, dispose() {} };
  },
};

resetVscodeMock();
