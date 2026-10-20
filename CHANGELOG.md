# Changelog

All notable changes to Keyhole are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

- Founded: the design and its decisions (ADR-0001); the build, the tests and the gate; the `Secret`
  type, which prints as `[redacted]` by every route a string is made and refuses to serialize, so the
  first law (a secret never enters the conversation) is a checked fact. Nothing is installable yet.
- The person's path (ADR-0002): **Keyhole: Set a Secret in .env…** asks for a variable's name, checks
  with git that `.env` is ignored and not tracked (and offers to add it to `.gitignore`), takes the
  value in a masked box and appends it to `.env` under a comment line. Setting a value that is already
  set asks first (**Set New Value**); the old line stays, and the new comment says which line it
  supersedes. The log names a value only by its keyprint, `<keyprint:ghp_…#3fa7a3c1/>`. Its words are
  the naming review's.
