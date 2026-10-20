# ADR-0001 source check: the masked box, the two git checks, and the harness file

- **Date**: 2026-10-20
- **By**: Surveyor 5.1 (Claude Fable 5.1), read not run, except the git probe, which ran in a throwaway repository
- **For**: Glazier's onboarding brief, the claims ADR-0001 rests on before any are built on
- **Sources**: VS Code at tag `1.141.0` (the shallow clone at `~/Programming/_vscode-source/vscode`; paths under `src/vs/`); git 2.52.0 through `scripts/ephemeral/2026-10-20-git-ignore-checks-probe.sh`; Claude Code's published documentation for the `env` key (section 3)

## TL;DR

1. **The masked box holds.** `showInputBox({ password: true, ignoreFocusOut: true })` is a plain `<input type="password">` that VS Code never reads back, logs or intercepts on paste, and that stays open when focus leaves the window. One caveat for the manual: VS Code's extension-host communication log, a developer flag, prints every reply including this one.
2. **Git's two checks hold, with an order that matters.** `check-ignore` says "not ignored" for a file that is tracked even when a rule matches it, so keyhole must ask "tracked?" before "ignored?", treat exit 128 as "no repository", and run git from the workspace folder. Nested ignore files, the global excludes file and not-yet-existing paths all work.
3. **The `settings.local.json` claim**: see section 3.

## 1. `showInputBox` with `password` and `ignoreFocusOut`

| Claim | Where | Verdict |
| --- | --- | --- |
| The box masks the value | `api/browser/mainThreadQuickOpen.ts` L111 passes `password`; `platform/quickinput/browser/quickInputController.ts` L665; `quickInputBox.ts` L93–95 sets `inputElement.type = 'password'` | holds: it is the browser's own password field, nothing more |
| Paste works | No paste handler exists in `quickInputBox.ts`, `base/browser/ui/inputbox/inputBox.ts` or `findInput.ts` (grep for "paste": nothing), so Chromium's default for a password field applies, which accepts paste | holds, as the browser's behavior, not VS Code's |
| The box survives focus leaving VS Code | `mainThreadQuickOpen.ts` L116 maps `ignoreFocusOut` to `ignoreFocusLost`; `quickInputController.ts` L666 sets it on the input; the only blur handler, L350–353, hides the widget on blur **unless** `ignoreFocusOut` is set. No other listener in the quick-input code reacts to window focus (`hostService`, `onDidChangeFocus` on the window: nothing). When the OS window deactivates the field blurs, which is exactly the event L350 ignores | holds |
| VS Code does not keep or log the value | `quickInput.ts` and `quickInputController.ts` reference no telemetry or log service; the value travels main thread → extension host as the reply to `$show`, and lands only in the extension's memory | holds, with one caveat below |

**Caveat for the manual.** With the developer flag `--logExtensionHostCommunication` (or the `LOG_EXTENSION_HOST_COMMUNICATION` constant, `services/extensions/common/extensionHostManager.ts` L252), the RPC logger prints every reply's payload (`rpcProtocol.ts` L404, `receiveReply:` with `value`, pretty-printed at `extensionHostManager.ts` L514–515) to the developer tools console. The input box's value would appear there. Nobody runs daily with that flag, but "never run VS Code with extension-host communication logging while using keyhole" is one true sentence.

Two more things the source settles that ADR-0001 does not say:

- **Escape discards.** Hiding the widget for any reason resolves the promise with `undefined`; a cancelled box leaves no value anywhere.
- **`validateInput` sees the value.** If keyhole validates as the person types (length, shape), that callback runs in the extension host with the plain value; it must never log or surface it, which is the same rule as for the result.

## 2. Git's two checks (ran, git 2.52.0)

The probe builds a repository with a root `.gitignore` (`.env`, then `*.env`), a nested `sub/.gitignore`, a global excludes file (`core.excludesFile`), an untracked ignored file, a file tracked despite a matching rule, and a path that does not exist.

| Case | `git check-ignore -v -- <path>` | `git ls-files --error-unmatch -- <path>` |
| --- | --- | --- |
| `.env`, `sub/.env`, `sub/deep/.env` (root rule) | exit 0, prints the rule | exit 1 |
| `sub/secret.txt`, `sub/deep/secret.txt` (nested rule) | exit 0, prints `sub/.gitignore:1` | exit 1 |
| `a.global` (global excludes) | exit 0, prints the excludes file's path and line | exit 1 |
| `untracked.txt` (no rule) | exit 1, nothing | exit 1 |
| `tracked.txt` | exit 1, nothing | exit 0, prints the path |
| **`sub/deep/tracked.env`, tracked though `*.env` matches** | **exit 1, nothing** (`--no-index` then shows the rule) | exit 0 |
| `missing.env` (does not exist) | exit 0, prints the rule | exit 1 |
| any path, outside a repository | exit 128, `fatal: not a git repository` | exit 128 |

What this means for keyhole's "ignored and untracked" gate:

1. **Order: tracked first.** A tracked file answers "not ignored" to `check-ignore` even when a rule matches it. If keyhole asked "ignored?" first and refused on "no", a tracked `.env` would be refused with the wrong reason; if it asked "ignored?" and trusted a "yes", it could never be wrong, but the fail-closed message should name the real cause. Ask `ls-files --error-unmatch` first: exit 0 means tracked, stop. Then `check-ignore -q`: exit 0 means ignored, proceed; exit 1 means not ignored, stop.
2. **Three exit codes, not two.** 128 is "no repository" (or git not installed, which is a different error on the spawn). Both must fail closed and say so; a project without git is a real novice case.
3. **Paths are relative to the current directory**, so run git with the workspace folder as `cwd` (or `git -C <folder>`), and pass the `.env` path relative to it.
4. **Checking before the file exists works**: `check-ignore` answers from the rules, so keyhole can refuse before creating a file that would not be ignored.
5. **Nested and global rules are honored**, so a person whose `.env` is ignored by `~/.gitignore_global` passes; the message on refusal can suggest the root `.gitignore` line, since that is the one that travels with the repository.

## 3. A variable in `settings.local.json`'s `env` reaches the commands a model runs

Claude Code is not in the clone; this section is from its published documentation (`code.claude.com/docs/en/settings`, `settings-reference`, `env-vars`, `permissions`), fetched 2026-10-20 by a documentation lookup; quotes are the documentation's wording.

| Claim | What the documentation says | Verdict |
| --- | --- | --- |
| The value reaches the commands the model runs | `env`: "Set environment variables for every session and for the subprocesses Claude Code starts from it" (settings-reference), and the subprocesses it names are "Bash commands, hooks, and stdio MCP servers" (env-vars, the scrub section). Values are copied "as written. No shell processes them" | **holds**, for Bash, hooks and stdio MCP servers; HTTP MCP servers are not documented |
| `settings.local.json` is the personal, per-project file | "Personal overrides for one project"; precedence, highest first: managed, `--settings`, project local, shared project, user. An `env` block "follows the levels above"; when several files set a variable, the highest-precedence one applies, per variable | holds |

Six facts the design should absorb, none of which ADR-0001 states yet:

1. **The file is git-ignored only when Claude Code creates it.** "Claude Code keeps it out of git when it creates the file; if you create it by hand, add it to `.gitignore` yourself", and it does so by adding `**/.claude/settings.local.json` to the **global** git excludes file, not the repository's `.gitignore`. A file keyhole creates is "by hand" in this sense. keyhole's `check-ignore` gate (section 2) honors the global excludes, so the check still answers truthfully; the refusal message should know that the usual ignore rule lives in the global file.
2. **The value applies only after the workspace is trusted**, and "a running session applies new and changed values to its environment when you save the file"; **removing** a variable "doesn't unset it in a running session; the removal takes effect the next time you launch `claude`". A rotated or withdrawn secret lingers in every running session until restart. One sentence for the manual's rotation page.
3. **The subprocess scrub can swallow the variable.** With `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1`, Claude Code strips "credentials from the environments of the subprocesses it starts", recognized "by its variable name or by the shape of its value". A person who turned that on will find keyhole's `settings.local.json` route does nothing visible for a token-shaped value. The manual should name the two as opposite choices; keyhole could detect the setting and say so.
4. **Some names are ignored from project and local files**, with a warning: `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_TMPDIR`, `HOME`, `TMPDIR`, the `XDG_*` family. They belong on keyhole's refused-names list beside `PATH` and `NODE_OPTIONS`.
5. **Nothing documented echoes the values.** `/status` and `claude doctor` list the names of dropped variables, "never values"; the Config tab "isn't a view of your `settings.json` contents". What a shell command prints is in the tool result, as always; that is the first law's whole point, and it is not keyhole's to fix.
6. **The deny rules Sounder's chapter needs are documented as written in ADR-0001.** `Read(./.env)` and `Read(./.env.*)` are the documentation's own example; a bare `Read(.env)` matches at any depth; rules "are evaluated in order: deny, then ask, then allow", and `deny` rules apply before trust. The scope: the built-in file tools, "file commands Claude Code recognizes in Bash, such as `cat`, `head`, `tail`, `sed`, and `tee`, and the targets of Bash redirections"; **not** "a Python or Node script that opens files itself", for which the documentation points to the sandbox. A `Bash(cat .env)` rule matches only that literal text and is the wrong tool; `Read(./.env)` already covers `cat .env`. Same for `Read(./.claude/settings.local.json)` if the chapter wants the harness file covered too.
