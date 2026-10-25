# Changelog

All notable changes to Keyhole are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

## [0.1.0] - 2026-10-25

First release.

- Founded: the design and its decisions (ADR-0001); the build, the tests and the gate; the `Secret`
  type, which prints as `[redacted]` by every route a string is made and refuses to serialize, so the
  first law (a secret never enters the conversation) is a checked fact.
- The person's path (ADR-0002): **Keyhole: Set a Secret in .env…** asks for a variable's name, checks
  with git that `.env` is ignored and not tracked (and offers to add it to `.gitignore`), takes the
  value in a masked box and appends it to `.env` under a comment line. Setting a value that is already
  set asks first (**Set New Value**); the old line stays, and the new comment says which line it
  supersedes. Its words are the naming review's: every question says what Keyhole recommends and why,
  and every refusal says how to go on.
- The keyprint: the log and the questions name a value by its public prefix and a short hash, and a
  value of 32 characters or more also shows its last four, as the service's own page does, so you
  can recognize it: `<keyprint:ghp_…f9c2#06c47309/>`. A shorter value shows none of its characters.
- The masked box has an eye button to show what you typed; the value is hidden again when you switch
  to another app. Both boxes are named for screen readers.
- Keyhole refuses, and says why, rather than write where it cannot check: in a git repository that
  VS Code's Git extension did not open (git refuses some, for example a folder owned by another user),
  and when `.env` exists but cannot be read, which it leaves untouched.
