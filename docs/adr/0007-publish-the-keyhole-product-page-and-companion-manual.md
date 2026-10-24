# Publish the Keyhole product page and companion manual

* Status: accepted
* Deciders: Jérémie Lumbroso (site creation); Sounder 6 (delegated implementation)
* Date: 2026-10-23
* Iteration: 1

## TL;DR

Build the product page in Keyhole's `site/` and publish a four-chapter manual through a private, template-generated `jlumbroso/keyhole-docs` repository. Both use GitHub Pages, static HTML, and Berkeley Mono. State that the first extension release is still in preparation; creating these sites does not publish the extension.

## Context and Problem Statement

Jérémie asked Sounder: “Would you like to create the keyhole-docs manual site and hte product page/”. His earlier direction supplies the audience: people who have never programmed, now working with coding assistants. Porthole supplies the established publication model and the requested Copy Page For LLM, Markdown, editing, and correction affordances.

As of this decision, Keyhole is private and its first release awaits the separate naming/icon and publishing process. The existing assistant-protections chapter records a documentation/source review dated 20 October, not exercised assistant sessions. Neither state becomes stronger by appearing on a website.

## Decision Drivers

* A newcomer must be able to distinguish a setting's name from its secret value, then practice without a real credential.
* The main branch's command-only behavior defines the scope; future inbox links are not shipped features.
* Preserve the human's no-Meta/no-React and all-mono preferences.
* Publish only intentionally public site artifacts, never the private repository's inbox, design deliberations, credentials, or font purchase files.
* GitHub must record that the publisher was generated from the collaboration template.

## Considered Options

* Keep all documentation in the extension README.
* Publish both surfaces from one repository.
* Keep canonical manual sources in Keyhole and use a separate private publisher, following Porthole.

## Decision Outcome

Choose the separate publisher. The product page lives at `https://jlumbroso.github.io/keyhole/`; the manual at `https://jlumbroso.github.io/keyhole-docs/`. The publisher is created with `gh repo create --private --template ADRs4AI/human-ai-collaboration-template-A`, with source and generated-tree provenance recorded.

Canonical manual content and build assets remain under Keyhole's `docs/manual/`. Because the source repository is private, publication initially imports a locally verified, allowlisted snapshot with commit and file hashes. CI builds that snapshot without a cross-repository credential. Future imports must remain explicit; a Keyhole commit alone does not update the manual.

The initial chapters are overview, first secret, keeping secrets out of the conversation, and troubleshooting. The existing protections text retains its checked date and limitations. Provider-specific guides are later work, requiring actual vendor research rather than empty navigation entries.

The design uses warm paper, all-mono typography, and a provisional indigo accent. It does not settle the icon/colour questions in ADR-0006. A labeled interface illustration can explain the steps without exposing internal desktop screenshots. Purchased font binaries remain in their existing private font repository; the sites reference the already-published web stylesheet.

The public product page leads to the manual while the extension is unreleased. It makes no installation-availability or full-accessibility claim. Public GitHub links explain that source access currently requires a repository invitation. Both repositories stay private. Only their allowlisted Pages artifacts are public.

### Consequences

The manual works without JavaScript for reading, navigation, and Markdown downloads. JavaScript adds theme choice and copying, with an explicit fallback when clipboard access is unavailable. Every chapter links to its editable source and a correction route; those GitHub routes presently require access.

The two publication workflows require explicit coordination. Snapshot hashes make drift detectable, but do not automatically synchronize the sites. When the first release lands, replace the preparation notice and add verified marketplace links in both surfaces.

## Questions

NOT: no open questions in this implementation record — the human requested the two sites and delegated their design. Icon and extension-release decisions remain in their existing records, not answered here.

## Validation

Before publication: build and allowlist checks; inspect HTML at desktop and narrow widths; exercise theme/copy/fallback behavior; preserve chapter code examples; run the project gate. After publication: check actual Pages responses and links. Static checks and browser inspection do not establish full accessibility conformance.

## Links

* [Icon decision, still pending](0006-keyholes-icon-which-concept-carries-forward.md)
* [Existing assistant-protections chapter](../manual/keeping-secrets-out-of-the-conversation.md)
