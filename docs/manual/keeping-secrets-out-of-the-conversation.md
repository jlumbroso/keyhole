# Keeping secrets out of the conversation

An API key lets a program use an account or service. Your assistant can help
you obtain one and explain where it belongs without seeing the value.

Keyhole's **Set a Secret in .env…** command in VS Code's Command Palette
writes that value to your project folder's `.env` through a masked input box.
After it is saved, the assistant may still be able to read the file with its
other tools. This chapter helps you reduce those accidental reads.

**Choose the application running your assistant**, sometimes called its
*harness*: [Claude Code](#claude-code), [Codex](#codex),
[Gemini CLI](#gemini-cli), or [Grok Build](#grok-build).
The model's name alone does not tell you which settings apply.

**Checked: 20 October 2026.** The instructions below were checked against
vendor documentation and, where noted, source code. None of these recipes has
yet been exercised here in a running assistant. Start with the
[harmless check](#check-with-a-harmless-value), using your installed version.

## Before adding a real key

Your project's `.env` is a text file containing named settings, often including
secrets. A setting's name, such as `DATABASE_URL`, can be discussed in chat;
its value should stay out.

Three different controls matter:

| Control | What it does |
| --- | --- |
| Git ignore rules | Help keep a file out of future source-code commits; they do not prevent a program from reading it. |
| File permissions in your assistant | Restrict particular tools or sandboxed programs from opening the file. Coverage depends on the application. |
| Command environment settings | Control values handed directly to programs the assistant runs, even without opening a file. |

Git also keeps tracking a file that was already added, despite a later ignore
rule. For a destination in a Git repository, Keyhole checks both whether
the file is ignored and whether it is already tracked. Neither check removes a value
from existing history. [Git's ignore documentation](https://git-scm.com/docs/gitignore)

For the examples below:

1. Open the project's top-level folder in VS Code. Paths beginning with a dot,
   such as `.claude`, are ordinary folder names.
2. Make the changes in the editor. If a settings file already exists, keep its
   other settings and merge the additions into the existing sections. JSON
   files must not contain duplicate keys; TOML files must not repeat a table.
3. Keep the real key out of chat, commands, screenshots, and copied settings.
   The assistant can explain a change using an empty example.

The patterns below include `.env.local`, `.env.production`, and
`.env.example`. If the assistant needs a sample, give it a separate file such
as `environment-example.txt`, containing names and empty or invented values.
Avoid creating an exception for a file that could later acquire real values.

## Claude Code

Start Claude Code in the project's top-level folder. Open or create
`.claude/settings.json` inside that folder. For a new file,
use this JSON. For an existing file, add these entries to its
`permissions.deny` list:

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(/**/.env)",
      "Read(/**/.env.*)",
      "Read(/.claude/settings.local.json)"
    ]
  }
}
```

The first pair works below the current directory. The second anchors coverage
to the session's starting folder, including subfolders, even after a directory
change. In this project settings file, `/` means that starting folder, not
your disk's root. Start at the project root; files above that boundary need
their own rules.

The last rule protects Claude's local settings file, which can itself contain
secrets. Do not copy it into chat. Keyhole 0.1.0 writes to `.env` only.

Open `/permissions` and check that the deny rules appear with the expected
settings source. Claude Code reloads permission edits; if the rules do not
appear, check for invalid JSON and use `claude doctor` to diagnose rejected
settings. [Claude Code settings](https://code.claude.com/docs/en/settings#when-edits-take-effect)

These rules cover Claude's built-in file tools and recognized shell
operations that name a file. They do not cover every program that can open
it: a Python script or recursive shell search can take another route.
`Bash(cat .env)` is not an adequate substitute; blocking one command spelling
does not protect the file. Deny rules take precedence over allow rules.
[Claude Code file permissions](https://code.claude.com/docs/en/permissions#read-and-edit)

**Checkpoint:** the practice-file Read calls should be denied. If you also
need to restrict scripts, follow Anthropic's
[sandbox filesystem guidance](https://code.claude.com/docs/en/sandboxing)
and configure denied paths. Enabling a sandbox alone does not hide `.env`;
its default read access is broad.

A variable placed under `env` in `.claude/settings.local.json` is deliberately
made available to commands. Blocking tool reads of that file does not remove
those inherited values. Put a variable there only when Claude's commands need
the credential. [Claude Code environment settings](https://code.claude.com/docs/en/env-vars#set-variables-in-settings-files)

## Codex

These instructions concern local Codex command execution. Open your personal
`~/.codex/config.toml` (`~` means your home folder). In the Codex IDE
extension, the settings menu offers **Open config.toml**. Project
`.codex/config.toml` overrides are loaded only for trusted projects; command
line overrides can take precedence. [OpenAI configuration guide](https://learn.chatgpt.com/docs/config-file/config-basic)

Codex's current **beta permission profiles** can deny filesystem access.
The following example extends the built-in workspace profile:

```toml
default_permissions = "keyhole"

[permissions.keyhole]
extends = ":workspace"

[permissions.keyhole.filesystem]
glob_scan_max_depth = 6

[permissions.keyhole.filesystem.":workspace_roots"]
".env" = "deny"
".env.*" = "deny"
"**/.env" = "deny"
"**/.env.*" = "deny"
```

Place `default_permissions` at the top level, before table headings. If you
already use a custom permission profile, add the file rules to that profile
instead. Older `sandbox_mode` settings or a launch-time `--sandbox` can
override profile selection: reconcile them before relying on these rules.
`deny` prevents writes as well as reads. The scan depth is bounded; use exact
paths for files deeper than the chosen scan.

This governs sandboxed commands, not every connector or external tool.
On Linux, WSL, and supported native Windows sandboxes, glob matches are
collected when each sandboxed process starts. An already-running shell,
script, watcher, or development server may miss matching files created
afterward. Restart those processes after adding secret files.
[OpenAI permission profiles](https://learn.chatgpt.com/docs/permissions)

On macOS, Seatbelt checks the denied paths when they are accessed, so matching
files created after the sandbox starts are covered too. This follows the
[Codex 0.163.0 implementation](https://github.com/openai/codex/blob/rust-v0.163.0/codex-rs/sandboxing/src/seatbelt.rs#L624-L662);
we have not run that check here.

For variables the assistant's commands do not need, merge this separate
setting into the same configuration:

```toml
[shell_environment_policy]
ignore_default_excludes = false
```

It filters inherited names containing `KEY`, `SECRET`, or `TOKEN`. It does
not catch every secret: `DATABASE_URL`, for instance, needs an explicit
filter. Values supplied through `set` can restore excluded variables. Keep
existing environment filters and review them together; a program that needs
a removed variable will no longer receive it.
[OpenAI shell environment policy](https://learn.chatgpt.com/docs/config-file/config-advanced#shell-environment-policy)

Start a fresh session. Use `/permissions` to inspect the selected profile,
then run the harmless check. An approval to execute outside the sandbox can
remove the protection for that command; do not approve a request to work
around a secret-file denial. Ordinary **read-only** mode still allows reads.
[OpenAI sandbox and approval guide](https://learn.chatgpt.com/docs/sandboxing)

## Gemini CLI

Open or create `.geminiignore` in the project's top-level folder. Keep any
existing lines and append:

```gitignore
**/.env
**/.env.*
```

Restart Gemini CLI after editing this file. It excludes matching paths from
participating file tools and `@` file inclusion. It does not prevent an
allowed shell program from opening them.
[Gemini ignore files](https://geminicli.com/docs/cli/gemini-ignore/)

Gemini also loads environment files itself. In a project you trust, merge
these settings into `.gemini/settings.json`:

```json
{
  "context": {
    "fileFiltering": {
      "respectGitIgnore": true,
      "respectGeminiIgnore": true
    }
  },
  "advanced": {
    "ignoreLocalEnv": true
  },
  "security": {
    "environmentVariableRedaction": {
      "enabled": true
    }
  }
}
```

The first section enables ignore-file handling. `ignoreLocalEnv` skips generic
`.env` files except the one in your home folder; redaction makes a best-effort
attempt to filter sensitive environment variables passed to tools. It does not identify every
credential. Existing `allowed` and `blocked` lists affect the result.
Restart afterward. Project settings require trust
and can be overridden by system settings. These changes can leave development
commands without credentials they previously received.
[Gemini configuration](https://geminicli.com/docs/reference/configuration/)

Do not assume redaction is already enabled: the current settings schema
defaults it to `false`, despite prose elsewhere calling it automatic.
The nested JSON above follows that
[settings schema](https://github.com/google-gemini/gemini-cli/blob/main/packages/cli/src/config/settingsSchema.ts).

`ignoreLocalEnv` still permits `.gemini/.env` in trusted folders, including
`~/.gemini/.env`, and does not remove variables inherited from the launching
shell. Gemini CLI 0.64.0 searches upward as far as the filesystem root,
stopping at the first eligible file; a `.git` folder does not stop the search.
With `ignoreLocalEnv` off, a stray `.env` in a parent folder can therefore be
loaded. File exclusions and environment loading are separate. These details
come from the [0.64.0 environment loader](https://github.com/google-gemini/gemini-cli/blob/v0.64.0/packages/cli/src/config/settings.ts#L561-L598),
not a walkthrough of the installed release.

**Checkpoint:** `read_file` should report that the practice file is ignored.
Current [read-file source](https://github.com/google-gemini/gemini-cli/blob/main/packages/core/src/tools/read-file.ts)
checks both the supplied and resolved paths. A shell or script is a separate
route: this recipe does not claim to block it.

## Grok Build

This section is for xAI's **official Grok Build on macOS or Linux**. Other
programs named `grok` may use different settings.

Quit Grok. Open or create `.grok/sandbox.toml` in your project and add this
profile, preserving other profiles:

```toml
[profiles.protect-env]
extends = "workspace"
deny = ["**/.env", "**/.env.*"]
```

From the project's top-level folder, start a **new process and session**:

```sh
grok --sandbox protect-env
```

The profile adds filesystem denials to the ordinary workspace sandbox.
Plain `workspace` and `read-only` profiles do not by themselves hide `.env`.
A same-named profile in your user settings can override the project profile;
check startup warnings. An explicit custom profile should refuse startup if
it cannot be enforced.
[Grok sandbox documentation](https://docs.x.ai/build/features/sandbox),
[sandbox source guide](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-pager/docs/user-guide/18-sandbox.md)

**On Linux, create the file before launching Grok.** Denial patterns are
expanded at process launch. Before Keyhole creates another environment file,
quit Grok; launch a new Grok process after the file exists. The source guide describes
runtime matching on macOS and requires bubblewrap for Linux read denial.
Resuming an old session preserves its sandbox selection, so do not use resume
to switch an earlier session into this profile.
[Grok's sandbox source guide](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-pager/docs/user-guide/18-sandbox.md)

For command-environment filtering, the configuration belongs in your
**personal** `~/.grok/config.toml`, not the project's config file:

```toml
[shell_environment_policy]
inherit = "core"
ignore_default_excludes = false
```

Quit and relaunch Grok after changing the policy. This reduces inherited
variables and filters names containing `KEY`,
`SECRET`, or `TOKEN`. It can remove credentials commands need; it does not
detect every secret. Explicit `set` values are applied after exclusions.
[Grok configuration scope](https://docs.x.ai/build/settings),
[environment-policy source](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-tools/src/util/shell_env_policy.rs)

Grok can also load `.envrc`, a file containing shell instructions.
`session.load_envrc` is enabled by default in the documentation and published
source; that source permits loading only in a folder Grok trusts.
[Published trust check](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-workspace/src/envrc.rs#L45-L60)

If you do not use that feature, set `load_envrc = false` under `[session]` in
the same personal config. Restart afterward. Shell startup files remain another way variables
can enter a command's environment.
[Grok settings reference](https://docs.x.ai/build/settings/reference),
[sandbox source guide](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-pager/docs/user-guide/18-sandbox.md)

**Checkpoint:** both file-tool and shell/script reads should be denied.
This is a documentation-based recipe, not a tested native-Windows procedure.
The public source snapshot predates Grok Build 1.0.62, whose behavior has not
been exercised here, making the harmless check particularly important.

## Check with a harmless value

Do this in a **new, empty practice folder**, before working with real keys.
Do not overwrite your actual `.env` or test by asking the assistant to reveal
a real credential.

1. Apply the instructions for your application in the practice folder,
   including any personal settings they require.
2. In VS Code, create a file named `.env` containing only
   `KEYHOLE_PRACTICE=not-a-secret`. Create `.env.local` with the same harmless
   line. If your project uses nested folders, repeat there too.
3. Start a fresh assistant session in that folder, using the intended
   permission or sandbox profile. For Grok, quit and restart the process;
   starting another conversation within it or resuming an earlier session
   is insufficient.
4. For Claude, ask it to use **Read** on the practice files; for Gemini, use
   **read_file**; for Grok, use its file-reading tool. Ask it to stop on a
   denial, without trying another route. Inspect the actual denied or
   ignored-path tool result. A conversational promise does not test the
   setting. For Codex, proceed to the command check below.
5. For Codex or Grok's filesystem sandbox, also test a shell read and a small
   script that opens the practice file. Both should be denied under the
   selected sandbox. Claude's file-tool rules and Gemini's ignore rules
   alone do **not** promise this result.
6. Confirm it can still read an ordinary file in the practice folder. If it
   cannot read anything, that does not establish that your secret-file
   pattern is correct.

If an expected denial does not occur, keep using the harmless folder while
you check the version, active settings, paths, and tool involved. A passing
check establishes those tested routes in that setup; it is not proof about
other tools, plugins, or future versions.

Once the practice check works, apply the same project settings in your actual
project and confirm the active configuration there. Personal settings may
carry across; files created in the practice folder do not. **Do not repeat
the read test on real credentials.**

## Continue without reading the value back

The useful question after saving is “Is the setting available where the
program needs it?” A file can be saved while a running program still needs
to reload it. Ask for a result such as “setting present” or “connection
succeeded,” without printing the value.

Do not use a dump of `.env`, `env`, `printenv`, or a configuration object as
the diagnostic. A file-read restriction cannot hide a value that was
already handed to a program through its environment, copied elsewhere,
or included in an error message.

Tell the assistant the variable's **name**, the destination, and a
secret-free description of the failure. If a real value has already entered
the conversation, use its provider's instructions to revoke or rotate it;
adding a deny rule afterward does not undo that exposure.
