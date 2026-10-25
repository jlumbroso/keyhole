# Make the assistant handoff and MCP service guides explicit

* Status: Accepted
* Deciders: Jérémie Lumbroso (scope); Sounder 6 (delegated documentation)
* Date: 2026-10-24
* Iteration: 1

## TL;DR

Lead with the assistant initiating a credential handoff; document the exact preview commands and publish Render and Neon MCP guides with verified destinations, while keeping extension availability and unbuilt harness writers explicit.

## Context and Problem Statement

Jérémie reviewed the deployed sites and identified their missing centre: “It allows models to trigger the last mile.” The assistant can display instructions through Porthole and initiate a Keyhole request instead of leaving a novice to interpret vague setup instructions. He then narrowed the first demonstrations to Render and Neon credentials for MCPs, and requested support for Claude Code's `.claude/settings.local.json` under `env`, with equivalents for Codex, Gemini and Grok.

The initial site scope in ADR-0007 correctly bounded shipped behavior but obscured the product's intended workflow. Main currently supports manual entry to `.env`; the request URI, inbox and status MCP are implemented on `release-2-inbox`, pinned at `50d68037f398797643a4da39f59da4eb545c98e5`. Publishing documentation must not collapse that distinction.

## Decision Drivers

* An assistant needs executable contracts: how to display a local guide, submit names, and check status without receiving values.
* An MCP credential must reach its MCP server; a project's `.env` is not a universal loader.
* Vendor authentication differs. OAuth may avoid a copied token entirely; database connection strings and account-management API keys are different credentials.
* Preserve the existing static, all-mono design, Copy Page For LLM, Markdown exports and explicit publication allowlist.

## Considered Options

* Keep the current command-only site until a later extension release.
* Present all planned behavior as available now.
* Explain the assistant workflow centrally, with exact preview contracts and separately verified guide/configuration steps.

## Decision Outcome

Choose the third option. Extend the manual with four chapters: a model reference, Render MCP, Neon MCP, and assistant settings. Revise the product page and overview around the handoff. Label preview commands at their point of use and keep the manual-entry fallback visible.

Each service guide uses the same sequence: identify the task and credential; choose the authentication route; obtain/authorize access; select the actual destination; verify a harmless operation; revoke or rotate; record primary sources and what was checked. The first demonstrations use official documentation and placeholder-only examples. They are not authenticated account walkthroughs or completed installation claims.

The model reference distinguishes request registration, human submission, cached presence, application loading and provider acceptance. It documents only the committed preview names: `secret_status`, `.keyhole/inbox.json`, and `Keyhole: Show Inbox`. Porthole opens a local guide; it does not accept the public manual URL directly.

Harness destinations remain the modular target work accepted in ADR-0001. Sounder routes the renewed implementation request to Glazier while documenting actual current support. Claude's project-local JSON, Codex's TOML, Gemini's environment loading and Grok's configuration must each distinguish shell environment from MCP environment, restart behavior and project versus home scope. No invented common configuration file or implied writer.

## Questions

NOT: no open questions for this documentation scope — Jérémie explicitly requested the two initial services and model-facing contract. Implementation scheduling and the existing target decisions remain with ADR-0001 and the coordinator; this record does not authorize an extension release.

## Validation and Delivery

Before publication: build both sites, run the repository gates, check copied Markdown against all chapters, exercise links/layouts in a browser, and import only committed allowlisted manual sources. After publication: verify the public pages and their exports. Credential acquisition and authenticated MCP actions remain human-executed and unverified unless separately observed.

## Links

* [Founding targets and build order](0001-keyhole-founding-design-from-the-seed.md)
* [Request contract](0005-the-request-record-and-the-link-that-creates-it.md)
* [Site publication](0007-publish-the-keyhole-product-page-and-companion-manual.md)
* [Implementation coordination](../inbox/2026-10-25-0113-sounder-to-glazier-model-first-guides-and-harness-targets.md)
