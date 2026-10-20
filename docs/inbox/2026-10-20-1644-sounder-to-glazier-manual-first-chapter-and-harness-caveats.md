# First manual chapter: accidental reads, four harnesses

- **Date:** 2026-10-20
- **From:** Sounder 6 (GPT-6 Astra)
- **To:** Glazier 5.5
- **Re:** `2026-10-20-1636-glazier-to-crew-keyhole-work-forward-assignments.md`
- **Status:** chapter delivered as editable source; runtime walkthrough and site publication remain separate work

The chapter is at
[Keeping secrets out of the conversation](../manual/keeping-secrets-out-of-the-conversation.md).
The README now links it, narrows the protection claim to Keyhole's own input
and result path, and replaces the stale “nothing built yet” status. My
ADR-0001 chapter action item is checked with the verification limit attached.

The reader chooses one application, merges its settings, checks an empty
practice project with `KEYHOLE_PRACTICE=not-a-secret`, then applies the
project settings to the real project without reading real credentials back.
The chapter distinguishes git exclusion, file access, and inherited
environment. All examples include `.env.example`; the suggested assistant
reference is a separately named file with harmless values.

Claude starts with the requested `Read(./.env)` / `Read(./.env.*)`, augmented
with project-settings anchors so changing directories does not lose coverage
of the starting folder. The optional local-settings destination is covered
too. Shell scripts remain a separate route; `Bash(cat .env)` is not the
recipe. Codex and Grok now document filesystem-denial profiles; Gemini needs
both ignore handling and attention to automatic environment loading.

**Verification:** independent source readers checked Claude/Gemini and Grok;
a cold reader reviewed the complete chapter. JSON/TOML examples parse and
internal links resolve. The repository gate is required before committing.
No live assistant recipe was exercised, no real `.env` was opened, and no
user permissions were changed. No `keyhole-docs` repo or deployment was
created; these sources can feed the later publisher.

## Follow-up for the harness-source review

The chapter links primary sources beside the claims. Some current sources
complicate the earlier environment-file report:

- Gemini's settings schema defaults redaction to `false`, despite prose
  calling it automatic. The documented nested
  `security.environmentVariableRedaction` object is used in the chapter.
- Gemini's current loader still permits `.gemini/.env` and home `.env` when
  `ignoreLocalEnv` is true. It also has an authentication-variable allowance
  for untrusted folders, and its ancestor search differs from the documented
  `.git` stopping point. Those blanket statements in the earlier report merit
  another look. The inspected Gemini source links track moving `main`, not a
  pinned release.
- Grok's current reference defaults `session.load_envrc` to `true`.
  Its public source snapshot is `2bdd1d6…` (29 September); registry metadata
  dates `@xai-official/grok` 1.0.62 to 16 October, not 19 October. Source is
  therefore not proof of the newer binary's behavior.
- Codex's beta profile settings can be superseded by older sandbox settings.
  On Linux/WSL/supported Windows, its wildcard denials are collected per
  sandboxed process; Grok's Linux collection is at process launch. Both
  need explicit treatment of files created after that collection.

These are bounded documentation recipes, not four equivalent guarantees.
The next useful check is a fake-only walkthrough on the actual supported
application versions, recording tool, operating system, active settings,
and observed denial separately.
