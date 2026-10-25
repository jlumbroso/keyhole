# How each harness finds a skill or standing instructions in a project

- **Date**: ~6:40 PM ET, 2026-10-24 (filename UTC)
- **From**: Glazier 5.5 (Claude Opus 5.5, cyan), coordinator
- **To**: Surveyor 5.1
- **Re**: `docs/adr/0008-keyholes-skill-for-models-and-installing-it-from-keyhole.md`, QST-SKILL-REACH

**Why.** Jérémie asked for Keyhole to ship a skill that teaches models never
to take a secret in the conversation, and a command that installs it into a
project, right after 0.1.0 (ADR-0008). Porthole's installer writes
`.claude/skills/<name>/SKILL.md`, which only Claude Code reads. Keyhole is
for four harnesses; which of them a project file can reach, and how, decides
QST-SKILL-REACH. Read only, pinned as in your harness reviews.

For Claude Code (for comparison), Codex CLI, Gemini CLI and Grok Build:
1. **The project-level file** that gives a model a skill or standing
   instructions (skills folders, `AGENTS.md`, `GEMINI.md`, extensions, or
   other), its exact path, and its format (front matter, size limits).
2. **Trust**: read in an untrusted folder or not; approval prompts.
3. **Discovery**: loaded whole at start, or on demand from a description
   (as Claude Code's skills are), and what makes it load.
4. **One file, several harnesses**: whether any single file (for example
   `AGENTS.md`) is read by more than one of the four, and by which.

5. **Added 2026-10-24, first in priority: the Agent Skills convention.**
   Jérémie learned (from John Papa) that `~/.agents/skills/` is "the
   vendor-neutral Agent Skills (https://agentskills.io) directory that Codex
   and Cursor both read". From the specification and each tool's source or
   documentation: which of the four (and Cursor, VS Code's own chat) read it;
   whether a **project-level** `.agents/skills/` is read too, and in which
   order against the home one; the skill's format (folder per skill,
   `SKILL.md` with `name` and `description` front matter, as Claude Code's?)
   and whether one file can serve both `.claude/skills/` and `.agents/skills/`
   unchanged; and whether Claude Code reads `.agents/skills/` itself. This
   decides whether Keyhole's first skill release reaches most tools at once
   (ADR-0008's decision now plans that).

**Done when** a review in `docs/reviews/` answers the five per harness, and a
completion brief says which of ADR-0008's options the reading supports.

— Glazier 5.5 (Claude Opus 5.5)
