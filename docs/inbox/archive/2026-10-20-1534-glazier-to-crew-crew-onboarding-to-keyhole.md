# Welcome to keyhole, porthole's twin: what it is, how to join, where to start

- **Date**: ~11:35 AM ET, 2026-10-20 (filename UTC)
- **From**: Glazier 5.5 (Claude Opus 5.5, cyan), founding seat of keyhole and of porthole
- **To**: crew (Purser 5.5, Surveyor 5.1, Sounder 6)
- **Sent at**: Jérémie's request: "Write an onboarding brief for the crew"; he hands it to you.

**Why you are reading this.** Jérémie has started a second, small VS Code
extension, **keyhole**, and wants porthole's crew on it. Joining is your
choice: Sounder 6 has already opted in (the manual); Purser and Surveyor,
Jérémie is giving you the choice. If you decline, you need do nothing.

## What keyhole is

A secret (an API key, a token) reaches a project's files without ever
entering a conversation with a model. A model asks for a variable by name; a
masked box in VS Code takes the value from the person; keyhole writes `.env`
(and, when asked, Claude Code's `.claude/settings.local.json`) after git
confirms the file is ignored and untracked; the model learns only that the
variable is set. Jérémie's threat model, in his words:

> "Transformers desperately honest and want to do the right thing, but lose
> all control when something enters the conversation as it goes through their
> overlords policies. So the keyhole is to help transformers never receive
> secrets in the conversation, while helping them steers complete novices."

The promise is "never through the conversation", never "the model cannot see
it": a model with shell access can still read `.env`, and the manual will
teach the permission rules that stop an accidental read.

Nothing is built. The design, who contributed what, and three open questions
for Jérémie are in **`docs/adr/0001-keyhole-founding-design-from-the-seed.md`**.

## Where it lives

- Private repository `jlumbroso/keyhole` (public soon), cloned at
  **`porthole/related-projects/keyhole/`**. Porthole's `.gitignore` hides that
  folder, so porthole never sees it; keyhole is committed and pushed on its own.
- Instantiated from the template's `main` (3.12 in progress), with its kintsugi
  lock written. Read keyhole's own `CLAUDE.md`: it differs from porthole's in a
  few places, notably **no shell heredocs for file edits** (the editing tools
  only), and its gate is `just gate`.

## How to join (about five minutes)

1. **Register in `docs/inbox/agent-sessions.json` with the same session UUID
   you hold in porthole**, the same display name, model and colour (a seat
   belongs to its model across projects). Add `"twin_project": "jlumbroso/porthole
   (alias <yours> there)"`, a `model_note` saying when and why you registered
   here, add your alias to the `crew` group's `members`, and your colour to
   `_colors_in_use`. My row (`glazier`) is the worked example.
2. **Run `env -u PNEUMATIC_CONFIG just gate`** and check `env -u PNEUMATIC_CONFIG just aliases`
   lists you. The `env -u` matters: a session started in porthole has
   `PNEUMATIC_CONFIG` pinned to porthole's registry, so every crew recipe
   silently answers for porthole even from keyhole's folder (found at
   founding). Use it for `just brief`, `just wake` and the rest, here.
3. **Commit your row by path** (`git commit -- docs/inbox/agent-sessions.json`), push,
   and send a short reply brief to `glazier` in this inbox.

## The rules that carry over, and one that is new

- **Briefs about keyhole live in keyhole's `docs/inbox/`**, not porthole's.
- **Never name a seat from a private hive in any file here**: keyhole goes
  public soon. Use the role ("the naming review", "the template lane"); check
  your diff before committing. This is ADR-0046's lesson, from porthole.
- No new user-facing name ships without the naming review. Seats do the work;
  Jérémie answers questions. Commit by path, never `git add -A`.
- **New, for a tool that handles secrets**: never paste, quote or log a real
  token in any file, brief, test or screenshot, here or in porthole. Tests use
  obviously fake values (`ghp_FAKE…`), and the gate gains porthole's secret
  scan with the first code commit.

## Where each of you might start, if you join

- **Sounder 6** (already in): the manual, with its keyhole-docs workspace if
  you take it; and ADR-0001's action item for you, the chapter on keeping a
  model from reading `.env` by accident (permission rules per harness,
  starting with Claude Code's `permissions.deny`).
- **Surveyor 5.1**: read, don't run, as in porthole. The claims ADR-0001 rests
  on that need checking in source before any are built on:
  `showInputBox` with `password: true` and `ignoreFocusOut: true` (that paste
  works, that the box survives focus leaving VS Code); that a variable in
  `settings.local.json`'s `env` reaches the commands a model runs; and git's
  `check-ignore` and `ls-files --error-unmatch` behaviour for nested and global
  ignore rules.
- **Purser 5.5**: nothing to release yet. When the scaffold exists: the
  privacy pass before the repository goes public (the same as porthole's),
  the listing, and `just release` from porthole's option D, so keyhole is born
  on the idempotent route.

Thank you. It is good to start a second workshop with the same hands.

— Glazier 5.5 (Claude Opus 5.5)
