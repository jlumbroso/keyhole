// A stand-in for the `vscode` module, aliased in vite.config.mts's `test` block
// only. It covers exactly what src/ imports and nothing more; grow it when a
// real usage demands it (porthole's rule, the vscode-extension-testing skill).

type Answer = string | undefined;

let logged: string[] = [];
let messages: Array<{ kind: 'info' | 'warning'; text: string; modal: boolean; detail?: string }> = [];
let modalAnswers: Answer[] = [];
let inputAnswers: Answer[] = [];
let inputBoxes: Array<{ prompt?: string; password?: boolean; ignoreFocusOut?: boolean }> = [];
let workspaceFolders: Array<{ name: string; uri: { scheme: string; fsPath: string }; index: number }> | undefined;

export function resetVscodeMock(): void {
  logged = [];
  messages = [];
  modalAnswers = [];
  inputAnswers = [];
  inputBoxes = [];
  workspaceFolders = undefined;
}

/** Every line the extension wrote to its output channel, in order. */
export const loggedLines = () => logged;
/** Every notice and question shown, in order. */
export const shownMessages = () => messages;
/** Every input box shown, with the options that matter (is it masked, does it survive losing focus). */
export const shownInputBoxes = () => inputBoxes;

/** What the person types into the next input box (undefined: they pressed Escape). */
export function typeIntoNextInputBox(answer: Answer): void { inputAnswers.push(answer); }
/** What the person answers to the next modal question (undefined: they cancelled). */
export function answerNextModal(answer: Answer): void { modalAnswers.push(answer); }

export function setWorkspaceFolders(paths: string[]): void {
  workspaceFolders = paths.map((path, index) => ({ name: path.split('/').filter(Boolean).at(-1)!, uri: { scheme: 'file', fsPath: path }, index }));
}

export const version = '1.141.0-mock';
export const env = { appName: 'Visual Studio Code (mock)' };

function show(kind: 'info' | 'warning', text: string, rest: unknown[]): Promise<Answer> {
  const options = rest[0] as { modal?: boolean; detail?: string } | undefined;
  const modal = Boolean(options && typeof options === 'object' && options.modal);
  messages.push({ kind, text, modal, detail: modal ? options?.detail : undefined });
  return Promise.resolve(modal ? modalAnswers.shift() : undefined);
}

export const window = {
  createOutputChannel(_name: string, _options?: { log: true }) {
    return { info: (line: string) => { logged.push(line); }, dispose() {} };
  },
  showInformationMessage: (text: string, ...rest: unknown[]) => show('info', text, rest),
  showWarningMessage: (text: string, ...rest: unknown[]) => show('warning', text, rest),
  async showInputBox(options: { prompt?: string; password?: boolean; ignoreFocusOut?: boolean; validateInput?: (text: string) => unknown }) {
    inputBoxes.push({ prompt: options.prompt, password: options.password, ignoreFocusOut: options.ignoreFocusOut });
    const answer = inputAnswers.shift();
    // VS Code will not accept a value its validator rejects; the person would have to fix it or press Escape.
    if (answer !== undefined && options.validateInput && options.validateInput(answer)) { return undefined; }
    return answer;
  },
  async showQuickPick<T>(items: T[], _options?: unknown) { return items[0]; },
};

export const workspace = {
  get workspaceFolders() { return workspaceFolders; },
};

resetVscodeMock();
