<!-- adr template version: "adr 3.12.0" -->
<!--
adr teaching map: the example is not the teaching — these are the up-links from this file to what teaches its form; load them rather than winging it. (Sibling: the template-version marker dates the mold this file was minted from.)
  skill: adr-authoring
  mcp: adrs-for-ai
  plugin: adr@adrs4ai
-->

# Requests and drafts: an inbox for secrets, and instructions shown in Porthole

- **Date**: 2026-10-21
- **Iteration**: 2
- **Status**: Draft
- **Deciders**: Jérémie Lumbroso; Glazier 5.5 (Claude Opus 5.5); the crew as each part is built

**TL;DR**: Nothing in Keyhole is now-or-never: a model's request for a secret, or a person's own draft, waits in an inbox as a record of names, reasons and instructions, never a value, and the value is typed only when the person is ready; reviewed instructions for each service open beside it as a Porthole; four questions decide where records live, where instructions come from, how a model's own words are shown, and the build order.

---

## Originating Context

**Source**: Jérémie's answers to ADR-0003's QST-SHOW-VALUE and QST-ENTRY-TAB (2026-10-21), quoted whole:

> It would be nice if this could all be tab-able, and also I realize one of the ways we can make it easier is also in terms of cognitive load, for nothing to be "now or never" — for requests to be queued in an inbox of requests and user-initiated drafts. It would be nice to create a neat decoupling of every step of this chain from, model sending a request (presumably with a variable name, an ORRCF — i.e., why they are asking for this, where to get it, why, etc., alternatives), and the user to follow the directions and fill out the secret. But the user could also use it to add environment variables in this trusted way — in which case, they would start an empty draft, and type variable name (or select it, or has us guide them based on our records, or curation of standard environment variable names), and then get instructions from our records somewhere (on the side, collapsible?), and then the key/password, etc.. We should also allow for sequences of variables (like SMTP server + username + password for instance). Each draft/record would be deep-linkable, such that a model can: (a) reopen the extension to that draft for editing and (b) iterate with the record with ease. This part is optional, and power users might not see it, but it may help make this more easy to scaffold for new comers, who are the most targeted audience.

> […] to be composed with the idea of the broader inbox possibly; this is a complementary part of a broader set of tools to help. The mass entry its role is: This is not something the transformers could help with for security reasons, so we are proposing a mechanized, automatic way of doing a simple version of structuring a mass of keys. The other proposal was to help structure the cognitive load around going around to get secrets. In particular, it helped Keyhole become the attention sorting yard, to take all instructions for how and where to go get a token. In fact, per the example we documented in screenshots for Porthole, we could have Keyhole have instructions for some platforms (like Render, Neon, etc., and maybe these instructions are in a public repo and publically editable), that can be spawned as Portholes when the model requests "The Render API key" for instance. Bringing all things together so it doesn't rely on the user having a massive amounts of executive functioning is also a way to be accessible.

**Agency Grant**: design; the build follows the answers.

---

## Explicitation

**What I understand**:

1. **A record, decoupled from its value.** A *request* (from a model, through the link) or a *draft* (started by the person) is a record: the variable's name, or a sequence of names (SMTP host, user, password); why it is needed; where to get it; alternatives. It never holds a value. The value is typed in the masked box or the tab only when the person is ready, and goes straight to the file. This is the first law's split (ADR-0001: request path, value path) given a home: the inbox is all request path.
2. **Nothing is now-or-never.** A request waits; the person can leave to fetch a token, come back tomorrow, reopen the draft. This also answers Sounder's interruption question for the tab (ADR-0003): what survives an interruption is the record, which holds nothing secret, so nothing secret needs to be kept to spare re-entry.
3. **The attention sorting yard.** Keyhole holds the instructions for getting each service's token (Render, Neon, GitHub…) and opens them as a Porthole beside the work when a model asks for "the Render API key", so a newcomer follows one page at a time instead of holding the whole errand in mind. Less executive function needed is accessibility too.
4. **Mass entry is mechanical by design**: a model must never see the values, so it cannot help structure a pile of pasted keys; Keyhole does that part itself (ADR-0003's B).
5. **Deep links to each record**, so a model can reopen a draft for the person and read back its outcome (set or not, length, keyprint), never the value.
6. **Optional**: a power user can keep using the command alone.

**Doubts**:

- **A request record is a richer `.env.example`.** A project's requests (names, reasons, where to get each) are exactly what a newcomer to the project needs and contain nothing secret; they may belong *in* the project, committed, which would make Keyhole the keeper of the project's map of secrets (QST-RECORD-HOME).
- **A model's reasons are untrusted text shown to a novice.** A model steered by something it read could write "get your key at <a look-alike site>" into a request. Keyhole would then show a phishing instruction in its own trusted frame. Model-written words must look different from reviewed instructions, and their links must not be one click away (QST-MODEL-TEXT).
- **Publicly editable instructions are a supply chain.** An edit that points a token page somewhere else reaches every user who trusts Keyhole. Edits by pull request with review, shipped inside each release, keep that edit visible and reviewed; fetching them live would also lift the package check's ban on network calls (QST-INSTRUCTIONS-SOURCE).
- **Porthole opens local `.html` files** (its link, `vscode://jlumbroso.porthole/v1/open?file=…`, ADR-0013 there). Keyhole would ship each service's instructions as a page in its package, opened in Porthole when Porthole is installed and in the tab's side panel when it is not; the package check's file list grows by one folder.

**Read through Simon's *Architecture of Complexity*** (the skill, loaded 2026-10-21 at Jérémie's call):

- **The inbox is the watchmaker parable, for the person.** Tempus assembles a thousand parts at once and an interruption sends him back to zero; Hora builds stable subassemblies, so an interruption costs only the one in hand. Today's command is Tempus for a newcomer: the whole errand (find the service, sign in, mint the token, come back, paste) must finish in one sitting or start over. With the inbox, each record is a stable subassembly, a sequence (SMTP host, user, password) is a module of them, and each variable once set stays set: an interruption costs one value, never the errand. Jérémie's "nothing now or never" is Hora's rule, applied to a person's attention instead of a watch.
- **Near-decomposability puts a wall through the middle of the tab.** The inbox is all request path (names, reasons, instructions, outcomes); the value field is value path. If the tab is one module, the value path grows to the size of a whole webview. So the tab is two subsystems with one narrow interface: the inbox view, which never holds a value, and a sealed entry component whose only output is one message type to the file writer, where the value becomes a `Secret` at once. The boundary test (`src/test/secret.test.ts`) grows to name that one module, and no other.
- **Process and state, reviewed differently.** A service's instructions are a *process* description (how to mint a token; a page a person follows); its facts are a *state* description (the token's public prefix, the variable's name, the target), and facts change Keyhole's behavior: a prefix decides what a keyprint shows. ADR-0001 already keeps the two apart in each service card. So in a public repository (QST-INSTRUCTIONS-SOURCE), a recipe edit and a fact edit are different risks: a recipe edit is reviewed as prose and links; a fact edit is reviewed as code, with a test.
- **The empty world, kept empty.** What must stay unconnected: the instructions and the network (QST-INSTRUCTIONS-SOURCE); a model's words and Keyhole's trusted frame (QST-MODEL-TEXT); Keyhole and Porthole, joined only by Porthole's public link, with Keyhole working when Porthole is absent (ADR-0001: copy the link code, do not share it). One connection already made should stay a leaf: `src/secret.ts` imports the prefix table (`src/prefixes.ts`, built 2026-10-21); when service cards arrive, the cards must feed that table, never `Secret` import the cards, or the value path's core would depend on the most-edited part of Keyhole.
- **Hora inside the build order.** The inbox's data (records, their home, the link that creates them) is a stable form *before* its webview: a list of requests in VS Code's own Quick Pick, each opening today's masked box, works and can be released on its own. The tab then becomes a better view of the same records, not a precondition for them. This changes my recommendation on QST-ORDER-INBOX (option D, below).

**Confirm**: Jérémie, that a request never holding a value is the line, and that the inbox is optional beside the command.

---

## Questions

### QST-RECORD-HOME: Where do requests and drafts live?
- Status: answered
- Why asking: A request or draft is a record of names, reasons and instructions, never a value (this ADR's Explicitation). Where it is kept decides who can see it: only this person on this machine, or everyone who clones the project, and whether a model reads it by a file or only through Keyhole's link. A project's requests are, in effect, a richer `.env.example`: the variables it needs, why, and where to get each.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — VS Code's storage for the workspace**: private to this person and machine, outside the project; a model learns a record's outcome only through Keyhole's link.
- **B — a file in the project, committed**: for example `.keyhole/requests.json`, the project's map of the secrets it needs, shared with everyone who clones it, readable by a model; never a value, and Keyhole's tests check that.
- **C — both, split by owner**: the project's requests in the project (B), shared; the person's own drafts and their progress (which are set, when) in VS Code's storage (A), private.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-21)
**C — both, split by owner.** *Rationale*: what a project needs is the project's knowledge and helps the next newcomer (B's strength), while which of them this person has set, and the drafts they started for themselves, are theirs (A's strength); one store for both would either publish personal progress or hide the project's needs. *Confidence*: 0.55 — because a committed file is a new kind of thing for Keyhole to write, and some projects will not want it. *If wrong*: A, if Jérémie wants nothing of Keyhole's in the project; B, if personal progress is better shown than hidden.

**ANS:** (by Jérémie Lumbroso)
Agreed with Option C. (For actual keys, etc., they should only be stored where they won't be committed and/or read by models accidentally, so we must still stick to that.)

---

### QST-INSTRUCTIONS-SOURCE: Where do the instructions for each service come from, and how is an edit trusted?
- Status: answered
- Why asking: Jérémie proposed instructions "in a public repo and publically editable", opened as Portholes. They tell a newcomer where to go and what to copy, so a bad edit is a phishing page shown in Keyhole's trusted frame. Keyhole's package check also forbids network calls today (ADR-0001), so fetching instructions live would be a change of principle.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — written by the crew, inside Keyhole**: reviewed like code, shipped with each release; nobody outside can edit them.
- **B — a public repository, edited by pull request with review, shipped inside each release**: anyone can propose an edit; a reviewer merges it; the release bundles the pages, so Keyhole still makes no network call and every page a person sees was reviewed and released.
- **C — a public repository, fetched live**: an edit reaches everyone at once; needs the network ban lifted and a way to trust what was fetched.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-21)
**B — a public repository, by pull request, shipped inside each release.** *Rationale*: it keeps Jérémie's "publicly editable" (anyone can propose, so the instructions grow with the services) and puts a reviewer and a release between an edit and a newcomer, which is the whole defense against a look-alike link; and it keeps the network ban that the first law's package check enforces. *Confidence*: 0.7 — because the cost is a release for each instruction change, which services' pages may outpace. *If wrong*: C, if instructions go stale faster than releases, and then with signed pages; A, if no outside contributor appears.

**ANS:** (by Jérémie Lumbroso)
Option B sounds like a reasonable compromise. This can be implemented with "shipped" meaning "actually shipped" or "versioned URL."

---

### QST-MODEL-TEXT: How does Keyhole show the reasons and directions a model writes into a request?
- Status: answered
- Why asking: Jérémie's design has the model send its reasons with a request ("why they are asking for this, where to get it, why, etc., alternatives"). Those words come from a model, which can be steered by anything it read, so they may be wrong or hostile, and Keyhole would show them inside its own trusted frame to the newcomer it protects. Keyhole's own reviewed instructions (QST-INSTRUCTIONS-SOURCE) are different in kind.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — shown, marked as the assistant's**: under a heading such as "Your assistant says", visually apart from Keyhole's reviewed instructions; any address in it shown as text, not a link, with Keyhole's own link for that service beside it when Keyhole knows the service.
- **B — not shown**: the request carries only names; Keyhole shows only its own instructions.
- **C — shown plainly**, links clickable, the same as Keyhole's own words.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-21)
**A — shown, marked as the assistant's.** *Rationale*: the model's reasons are the part of Jérémie's design that turns a bare name into something a newcomer understands, so B loses the point; but a model's address must never borrow Keyhole's trust, so it is labeled, kept apart, and not clickable, and where Keyhole knows the service its reviewed link sits beside it, which is also how a person notices a mismatch. *Confidence*: 0.65 — because "not clickable" costs every honest request a copy and paste. *If wrong*: B, if a labeled assistant's words still read as Keyhole's to newcomers in a hand check; C never, by this ADR's doubt.

**ANS:** (by Jérémie Lumbroso)
Option A sounds good.

---

### QST-ORDER-INBOX: In what order are the inbox, the link, the tab and the instructions built?
- Status: answered
- Why asking: ADR-0001's order is the person's path, then the link, the cards (instructions) and the harness targets, one release each, each release a stable form even if work stopped there. This ADR adds the inbox and the tab. The person's path is now complete (ADR-0002, Implemented) and needs one hand check (ADR-0003, QST-CHECK-EYE) and the naming review's words for the eye button before a first release.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — release the person's path, then link, inbox and tab, then instructions**: 0.1.0 is the command as it is; next, the link creates a request in the inbox, and the tab shows the inbox, drafts, sequences and mass entry; then the instruction pages, opened in Porthole.
- **B — nothing released until the inbox and tab exist**: one larger first release.
- **C — release the person's path, then link and instructions, then inbox and tab**: a model can ask, and Keyhole can show the page for the service, before there is an inbox to queue in.
- **D — release the person's path, then link and inbox as a list, then the tab, then instructions**: like A, with the inbox split from its view. The second release is the link creating a request record and a "requests" list in VS Code's own Quick Pick, each item opening today's masked box (so a model's request waits instead of interrupting); the third is the tab (a better view of the same records, plus sequences and mass entry); the fourth, the instruction pages in Porthole.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-21)
**A — release the person's path, then link, inbox and tab, then instructions.** *Rationale*: the watchmaker's test (ADR-0001): each release must stand if work stopped there; the person's path already does, and a link without an inbox would bring back the now-or-never Jérémie wants gone, so the link and the inbox belong together; instructions are most useful once there is a request to attach them to. *Confidence*: 0.7 — because the link-with-inbox release is the largest step and could be split. *If wrong*: C, if seeing a model ask for a token with its instructions is the demonstration Keyhole needs first; B, if a first release should already show the whole idea.

**Recommendation**: (by Glazier 5.5, Claude Opus 5.5, 2026-10-21 — a walk-back from A, after reading the design through Simon; see the Explicitation)
**D — the inbox as a list before the tab.** *Rationale*: I called A's second release "the largest step" and said it "could be split"; Simon says where: the inbox's records are a stable form before any webview shows them. A Quick Pick of requests, each opening the masked box that is already built and hand-checked, gives the first release in which a model's request waits rather than interrupts, without the webview's new value path; the tab then arrives on records that have been used. Each of D's releases stands if work stopped there; A's second does not until the tab is done. *Confidence*: 0.75 — because the list reuses only built, checked parts, and its one new piece (the record and its home) is needed by every option. *If wrong*: A, if a list of requests in the palette is too poor a view to teach newcomers anything, so the tab must come with the link; C, as above.

**ANS:** (by Jérémie Lumbroso)
Agreed with Option D, with the inbox as a stable form.

---

## Decision

Not yet: four questions.

---

## Action Items

- [ ] Answer QST-RECORD-HOME, QST-INSTRUCTIONS-SOURCE, QST-MODEL-TEXT, QST-ORDER-INBOX — Owner: Jérémie
- [ ] Read Porthole's link handler for what Keyhole must ship for an instruction page to open in it (a file in Keyhole's own extension folder, the allowlist, a page with links) — Owner: Surveyor 5.1, once QST-INSTRUCTIONS-SOURCE is answered
- [ ] Name the inbox, the records and the deep links' verbs — Owner: the naming review, once the design is answered

---

## Iterations

### Iteration 1 (2026-10-21)
- Trigger: Jérémie's answers to ADR-0003's QST-SHOW-VALUE and QST-ENTRY-TAB
- Contributors: Jérémie Lumbroso, Glazier 5.5 (Claude Opus 5.5)
- Changes: the design restated; four doubts; four questions
- Outcome: `Draft`

### Iteration 2 (2026-10-21)
- Trigger: Jérémie invoked the architecture-of-complexity skill
- Contributors: Jérémie Lumbroso, Glazier 5.5 (Claude Opus 5.5)
- Changes: the design read through Simon (the inbox as Hora's subassemblies; a wall through the tab; recipes and facts reviewed differently; the prefix table kept a leaf); QST-ORDER-INBOX gains option D, and my recommendation walks back from A to D
- Outcome: `Draft`

---

## Links

- The answers that opened this: [ADR-0003](0003-accessible-entry-showing-the-value-conformance-and-a-tab-for-many-secrets.md), QST-SHOW-VALUE and QST-ENTRY-TAB
- The first law's split and the build order: [ADR-0001](0001-keyhole-founding-design-from-the-seed.md)
- The person's path, which a draft's value goes through: [ADR-0002](0002-the-persons-path-setting-a-secret-in-env.md)
- Porthole's link: `jlumbroso/porthole`, its ADR-0013
