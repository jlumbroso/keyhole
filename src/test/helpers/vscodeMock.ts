// A stand-in for the `vscode` module, aliased in vite.config.mts's `test` block
// only. It covers exactly what src/ imports and nothing more; grow it when a
// real usage demands it (porthole's rule, the vscode-extension-testing skill).

type Answer = string | undefined;

let logged: string[] = [];
let messages: Array<{ kind: 'info' | 'warning'; text: string; modal: boolean; detail?: string }> = [];
let modalAnswers: Answer[] = [];
let inputAnswers: Answer[] = [];
let inputBoxes: Array<{ title?: string; prompt?: string; password?: boolean; ignoreFocusOut?: boolean }> = [];
let workspaceFolders: Array<{ name: string; uri: { scheme: string; fsPath: string }; index: number }> | undefined;

export function resetVscodeMock(): void {
  logged = [];
  messages = [];
  modalAnswers = [];
  inputAnswers = [];
  inputBoxes = [];
  workspaceFolders = undefined;
  windowStateListeners = [];
  holdNext = false;
  heldBox = undefined;
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
  async showInputBox(options: { title?: string; prompt?: string; password?: boolean; ignoreFocusOut?: boolean; validateInput?: (text: string) => unknown }) {
    inputBoxes.push({ title: options.title, prompt: options.prompt, password: options.password, ignoreFocusOut: options.ignoreFocusOut });
    const answer = inputAnswers.shift();
    // VS Code will not accept a value its validator rejects; the person would have to fix it or press Escape.
    if (answer !== undefined && options.validateInput && options.validateInput(answer)) { return undefined; }
    return answer;
  },
  async showQuickPick<T>(items: T[], _options?: unknown) { return items[0]; },
  /**
   * A box the extension drives itself (the masked box with its eye button).
   * On show() it takes the next typed answer and accepts it, or hides on
   * undefined, unless the test holds it open with holdNextInputBox() to press
   * its button or move focus away first.
   */
  createInputBox() {
    const box = new MockInputBox();
    return box;
  },
  onDidChangeWindowState(listener: (state: { focused: boolean }) => void) {
    windowStateListeners.push(listener);
    return { dispose: () => { windowStateListeners = windowStateListeners.filter(other => other !== listener); } };
  },
};

type Listener<T> = (value: T) => void;
let windowStateListeners: Array<(state: { focused: boolean }) => void> = [];
let holdNext = false;
let heldBox: MockInputBox | undefined;

class MockInputBox {
  title?: string;
  prompt?: string;
  password = false;
  ignoreFocusOut = true;
  value = '';
  buttons: Array<{ iconPath: unknown; tooltip?: string }> = [];
  disposed = false;
  #accept: Array<Listener<void>> = [];
  #hide: Array<Listener<void>> = [];
  #button: Array<Listener<{ iconPath: unknown; tooltip?: string }>> = [];
  onDidAccept(listener: Listener<void>) { this.#accept.push(listener); return { dispose() {} }; }
  onDidHide(listener: Listener<void>) { this.#hide.push(listener); return { dispose() {} }; }
  onDidTriggerButton(listener: Listener<{ iconPath: unknown; tooltip?: string }>) { this.#button.push(listener); return { dispose() {} }; }
  show() {
    inputBoxes.push({ title: this.title, prompt: this.prompt, password: this.password, ignoreFocusOut: this.ignoreFocusOut });
    if (holdNext) { holdNext = false; heldBox = this; return; }
    this.finish(inputAnswers.shift());
  }
  /** The person types `answer` and presses Enter, or Escape when undefined. */
  finish(answer: Answer) {
    if (answer === undefined) { this.#hide.forEach(listener => listener()); return; }
    this.value = answer;
    this.#accept.forEach(listener => listener());
  }
  press(index = 0) { this.#button.forEach(listener => listener(this.buttons[index])); }
  hide() { this.#hide.forEach(listener => listener()); }
  dispose() { this.disposed = true; }
}

/** Keep the next created input box open; the test gets it from heldInputBox(). */
export function holdNextInputBox(): void { holdNext = true; }
export const heldInputBox = () => heldBox;
/** VS Code's window gains or loses focus (the person switches to another app). */
export function setWindowFocused(focused: boolean): void { windowStateListeners.forEach(listener => listener({ focused })); }

export class ThemeIcon {
  constructor(readonly id: string) {}
}

export const workspace = {
  get workspaceFolders() { return workspaceFolders; },
};

const registered = new Map<string, (...args: unknown[]) => unknown>();
export const commands = {
  registerCommand(id: string, handler: (...args: unknown[]) => unknown) {
    registered.set(id, handler);
    return { dispose: () => { registered.delete(id); } };
  },
};
/** The handler the extension registered for a command id. */
export const registeredCommand = (id: string) => registered.get(id);

let extensionsById = new Map<string, unknown>();
export const extensions = {
  getExtension: (id: string) => extensionsById.get(id),
};
/** What `vscode.extensions.getExtension(id)` returns (undefined: the extension is disabled). */
export function setExtension(id: string, extension: unknown): void { extensionsById.set(id, extension); }
export function resetExtensions(): void { extensionsById = new Map(); }

export const Uri = {
  file: (fsPath: string) => ({ scheme: 'file', fsPath, path: fsPath, toString: () => `file://${fsPath}` }),
};

resetVscodeMock();
