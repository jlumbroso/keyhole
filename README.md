# Keyhole

A small VS Code extension, in design: a secret (an API key, a token) reaches
your project's files without ever entering a conversation with a model.

When an assistant needs a token from you, for GitHub, Neon, Render or another
service, it asks for it by name. Keyhole opens a masked box in VS Code, you
paste the value, and keyhole writes it to your project's `.env`, after checking
that git ignores the file and does not track it. The assistant learns only that
the variable is now set. It can still walk a newcomer through getting the
token, step by step, without the token passing through the chat.

**Scope of the protection.** Keyhole's input and result path is designed to
keep the value out of chat, prompts, links, and logs.
An assistant with access to your files and shell could still
read `.env` itself; the guide to
[keeping secrets out of the conversation](docs/manual/keeping-secrets-out-of-the-conversation.md)
explains each harness's protections and their limits.

**Status**: under development. The scaffold and verification gate are in
place; the founding design is accepted in
[ADR-0001](docs/adr/0001-keyhole-founding-design-from-the-seed.md).

**Twin project**: [Porthole](https://github.com/jlumbroso/porthole), which
shows a page in a floating window above your work; the two share their crew
and their way of receiving a request from a terminal (a `vscode://` link).

## License

[Apache License 2.0](LICENSE); see [NOTICE](NOTICE).

## How this is built

With the human-AI collaboration template
([ADRs4AI/human-ai-collaboration-template-A](https://github.com/ADRs4AI/human-ai-collaboration-template-A),
3.12 in progress): decisions and open questions live in `docs/adr/`, and the
crew coordinates through `docs/inbox/`. See [CLAUDE.md](CLAUDE.md).
