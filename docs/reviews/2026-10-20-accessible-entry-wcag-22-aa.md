# Accessible entry: WCAG 2.2 A/AA assessment plan

- **Author:** Sounder 6 (GPT-6 Astra), 2026-10-20; updated 2026-10-21
- **For:** [ADR-0003](../adr/0003-accessible-entry-showing-the-value-conformance-and-a-tab-for-many-secrets.md), QST-A11Y-TARGET
- **Inspected:** Keyhole `8230de297ce6156f8ba00dc8efde61b1cf60d060`, especially [setSecret.ts](../../src/setSecret.ts); [ADR-0002](../adr/0002-the-persons-path-setting-a-secret-in-env.md), iteration 3; ADR-0003, iteration 1.
- **Source integration:** Surveyor's review at `021b530` and ADR-0003 iteration 2, read later the same evening; source findings sharpen the checks without changing the assessment target.
- **2026-10-21 update:** inspected Keyhole `306c449` (implementation `912b821`, including the earlier labels in `685bafd`), ADR-0003 iteration 3 and ADR-0004 through iteration 2. Adds the adopted host-practice comparison and a proposed release scaffold; live documentation checked on this date is not version-pinned host evidence.
- **Evidence:** vendor documentation, Keyhole source inspection, and Surveyor's version-pinned VS Code source review (linked below). No VoiceOver, keyboard, contrast, zoom, or other live accessibility test was performed. The earlier functional hand check is not an accessibility assessment.

## Adopted target and its limits

Jérémie adopted **WCAG 2.2 Level A and AA success criteria as the assessment target,
using WCAG2ICT to interpret them for desktop software**, together with a separate
comparison of VS Code's practices (ADR-0003, QST-A11Y-TARGET, 2026-10-21). Use the same criteria
for the proposed HTML webview. This table is a verification plan, not a claim
that Keyhole conforms, and not a declaration of legal compliance.

The baseline is the [WCAG 2.2 Recommendation, 12 December 2024](https://www.w3.org/TR/2024/REC-WCAG22-20241212/).
Level AA includes A. The inventory below contains all 55 current A/AA criteria;
4.1.1 was removed in 2.2. AAA criteria such as 2.4.13 are not silently added to
the AA target. A public conformance claim also requires an identified scope,
complete processes, and supported technologies; an isolated passing control
is insufficient. [WCAG conformance requirements](https://www.w3.org/TR/WCAG22/#conformance-reqs)

[WCAG2ICT](https://www.w3.org/TR/2025/NOTE-wcag2ict-22-20251211/)
is informative guidance, not another certification standard. An embedded HTML
form does not turn the entire desktop extension into an ordinary website.
Use its software interpretations, including titles and criteria concerning
sets of documents/programs, and document the platform dependencies. The target
is decided; release order remains proposed in ADR-0004. Describe completed
checks as “assessed against” with their scope and results; before execution,
say “assessment planned.” This document does not authorize “conforms.”

**“VS Code supplies the control” is an ownership statement, not a pass.**
The host provides rendering, input and accessibility mechanisms; Keyhole
supplies prompts, choices, validation, transitions and results. The composed
experience still needs checking on the supported versions.

## Surfaces and evidence boundaries

| Surface | Present state | What Keyhole controls |
| --- | --- | --- |
| Command and workspace chooser | Built: Command Palette entry; Quick Pick when several local folders are open | Command wording, available choices and destination descriptions |
| Variable-name box | Built: titled host input with Keyhole validation | Title/prompt, accepted names, refusal reason and recovery |
| Secret-value box | Built: titled `createInputBox`, masked initially, `ignoreFocusOut: true` | Purpose/destination prompt, paste-friendly flow, submission and cancellation |
| Questions | Built: git-ignore and existing-value modals; ADR-0002 wording implemented | Recommendation, explanation, button labels and effects |
| Refusals and results | Built: host warning/information notifications and a nonsecret output log | Accurate state, actionable next step and content that must not expose the value |
| Reveal control | Built: eye button, re-mask on window focus loss, dispose on hide; no timer. QST-CHECK-EYE unanswered | Meaningful name/state, deliberate activation, preserved input and focus; keyboard reach still unverified |
| Request inbox, drafts and single/batch entry tab | Chosen direction in ADR-0003; ADR-0004 storage, trust and release choices unanswered; not implemented | Record/value separation, HTML semantics, layout, focus, errors, review, theme integration and lifecycle |
| Service instructions in Porthole or fallback panel | Proposed in ADR-0004; not implemented | Reviewed content, meaningful navigation, reading order, return to the request and accessible fallback |

Surveyor's completed [VS Code source review](2026-10-20-accessible-entry-source-reads.md)
covers tags **1.134.0 and 1.141.0**. It reports a live `password` setter and
eye-button API at both versions; an input accessible name composed from
`placeholder` and `title`, falling back to `input`; validation-message
announcements; and destruction of a hidden webview's iframe when
`retainContextWhenHidden` is false. Its editor-backup findings also support
excluding editable text documents as secret-entry surfaces. These are source
findings, not runtime observations. Caret/value preservation, actual speech
and the complete interruption/recovery flow still need hand checks; do not
infer what VoiceOver speaks from a password attribute alone.

### What the VS Code documentation provides

The second matrix column is the requested host comparison, not a claim that
VS Code passes the criterion. **Documented mechanism**, **author guidance**,
**version-pinned source finding** and **observed result** are different evidence.
No hand-check result is recorded here. “No provision/result identified” means
the linked material did not establish one; it does not establish a host defect.
Current docs may describe features absent from the minimum supported version.

| Host documentation | Useful provision | Keyhole's remaining check |
| --- | --- | --- |
| [Accessibility][U] | Screen-reader mode, Accessible View/Help, keyboard navigation, high contrast and zoom | Test each entry/result path. Help and Accessible View support documented contexts; neither automatically covers arbitrary extension content. |
| [Quick Picks](https://code.visualstudio.com/api/ux-guidelines/quick-picks) and [InputBoxOptions](https://code.visualstudio.com/api/references/vscode-api#InputBoxOptions) | Native input/choice APIs with prompt, title, validation and focus options | Purpose remains understandable while editing; two folders with the same basename can be distinguished. API existence is not a spoken-label result. |
| [Notifications](https://code.visualstudio.com/api/ux-guidelines/notifications) | Host notices and modal questions | Choice, consequence, cancellation and outcome are understandable without sight; transient notices remain recoverable. |
| [Webview UX](https://code.visualstudio.com/api/ux-guidelines/webviews) | Guidance to provide theme support, contrast, accessible labels and keyboard operation | Keyhole owns these inside its HTML. A tab offers more room but is not inherently more accessible. |
| [Webview API](https://code.visualstudio.com/api/extension-guides/webview#accessibility) and [theme colors](https://code.visualstudio.com/api/references/theme-color) | Theme/font tokens, screen-reader and reduced-motion classes | Correct semantic color pairs and visible focus, measured in rendered states. Essential labels must not depend on detecting a screen reader. |

## Reading the matrix

- **Now** means the built command sequence at the 2026-10-21 update, including
  reveal. **Tab** includes the planned inbox/draft/batch webview. Instruction
  pages add a separate document set, addressed in the release scaffold.
- **Y**: applies to this surface; verification is pending. **C**: applies if
  the stated feature/condition exists. **N**: trigger absent in the bounded
  design; recheck that reason before release. None of these means “passed.”
- **H**: host mechanism. **K**: Keyhole implementation/content. **H+K**:
  both, with integration checked. Ownership does not remove a criterion.
- **Work** is a planning classification, not measured cost: **R** reuse a host
  mechanism and verify the integration; **A** author Keyhole content/behavior;
  **Inspect** resolve an evidence/platform question before choosing a remedy;
  **Inventory** confirm the feature is absent. Combinations are intentional.
  A webview can turn reused native behavior into Keyhole-authored work.
- The last column states the observable check. The protocols below expand
  keyboard, VoiceOver, visual and recovery checks. Criterion links lead to
  W3C's explanations; applicability to Keyhole is this review's analysis.

[U]: https://code.visualstudio.com/docs/configure/accessibility/accessibility
[W]: https://code.visualstudio.com/api/ux-guidelines/webviews
[M]: https://code.visualstudio.com/api/extension-guides/webview#supported-media-formats
[V]: https://code.visualstudio.com/api/extension-guides/webview
[A]: https://code.visualstudio.com/api/references/vscode-api#InputBox
[B]: https://code.visualstudio.com/api/references/vscode-api#QuickInputButton
[Q]: https://code.visualstudio.com/api/ux-guidelines/quick-picks
[N]: https://code.visualstudio.com/api/ux-guidelines/notifications
[T]: https://code.visualstudio.com/api/references/theme-color
[K]: https://code.visualstudio.com/docs/configure/keybindings
[C]: https://code.visualstudio.com/api/references/when-clause-contexts
[P]: https://code.visualstudio.com/api/ux-guidelines/command-palette
[L]: https://code.visualstudio.com/docs/configure/locales
[S]: 2026-10-20-accessible-entry-source-reads.md

### Perception

| Criterion | VS Code practice and evidence limit | Applicability: Now / Tab | Responsible layer · work | Check and expected evidence |
| --- | --- | --- | --- | --- |
| [1.1.1 A](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) · icon alternatives | [Webview UX][W] requires labels; [button API][B] offers tooltips, without establishing spoken names. | Y / Y | H for built-in symbols; K for reveal/action icons · **R+A** | VoiceOver identifies each action; decorative marks add no noise. An eye icon alone must not be the control's only explanation. |
| [1.2.1 A](https://www.w3.org/WAI/WCAG22/Understanding/audio-only-and-video-only-prerecorded.html) · recorded audio/video | [Media guide][M] documents playback; no automatic equivalent alternative identified. | N / N: no recordings | K inventory · **Inventory** | Confirm neither entry route embeds a recording. Reassess if a tutorial is added. |
| [1.2.2 A](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html) · recorded captions | No automatic captions documented in the reviewed [media guide][M]. | N / N: no synchronized media | K inventory · **Inventory** | Inspect final assets; no media means no caption-bearing content to test. |
| [1.2.3 A](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html) · recorded visual information | No automatic description/media alternative identified in the [media guide][M]. | N / N: no synchronized media | K inventory · **Inventory** | Reopen if video is embedded; a prose-only form does not need a video alternative. |
| [1.2.4 AA](https://www.w3.org/WAI/WCAG22/Understanding/captions-live.html) · live captions | No live-caption provision identified in the reviewed [media guide][M]. | N / N: no live media | K inventory · **Inventory** | Confirm no live instructional stream is part of the process. |
| [1.2.5 AA](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-prerecorded.html) · recorded audio description | No automatic audio description documented in the reviewed [media guide][M]. | N / N: no video | K inventory · **Inventory** | Reopen for future instructional video; not discharged by checking the form alone. |
| [1.3.1 A](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) · structure and associations | [Input API][A] supplies title/prompt/validation; [source review][S] traces names. [Webview labels][W] remain authored. | Y / Y | H+K now; K HTML · **R+A** | Inspect accessible names/descriptions and read with VoiceOver: name, value, destination, explanation and error associations. Batch rows need distinct field labels. |
| [1.3.2 A](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html) · reading sequence | [Host Tab order][U] is documented; reading order still needs checking. | Y / Y | H+K · **R+A** | Read without visual positioning: destination and consequences precede the decision. Batch rows and their errors follow a meaningful order. |
| [1.3.3 A](https://www.w3.org/WAI/WCAG22/Understanding/sensory-characteristics.html) · instructions independent of appearance | [Quick Pick guidance][Q] uses textual titles, hints and details; wording remains Keyhole's. | Y / Y | K · **A** | Review wording: use named actions, not “the green button” or “the box on the right.” Verify instructions still make sense when heard. |
| [1.3.4 AA](https://www.w3.org/WAI/WCAG22/Understanding/orientation.html) · orientation | No orientation result identified in reviewed [webview guidance][W]; host behavior unresolved. | Y / Y | H window; K layout · **R+Inspect** | On a rotatable supported display/emulated viewport, use both orientations without a content-imposed lock. This is not merely the narrow-width check. |
| [1.3.5 AA](https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html) · standardized personal-field purposes | [Input API][A] masking is not a personal-field-purpose taxonomy contract. | C / C: only qualifying fields about the user | H platform; K field classification · **A+Inspect** | Inventory eventual fields against WCAG's taxonomy. Generic variable names/API tokens are not automatically account-password fields; do not assign misleading autocomplete semantics. |
| [1.4.1 A](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) · color-independent meaning | [Host signals][U] provide some nonvisual cues; Keyhole meanings still need checking. | Y / Y | H+K · **R+A** | Error, selected action and saved/refused states remain distinguishable in grayscale and through text/semantics; color alone never explains a row's failure. |
| [1.4.2 A](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html) · automatic audio | [Host sounds][U] are configurable; authored audio remains separate. | N / N: no authored audio | K; H for host sounds · **Inventory** | Check the final flow adds no autoplay audio. Screen-reader speech is not Keyhole-authored autoplay content. |
| [1.4.3 AA](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · text contrast | [Theme tokens][T] and [webview contrast guidance][W] support implementation, not measured ratios. | Y / Y | H theme rendering; K authored colors/content · **R+A** | Measure actual label, prompt, error and result foreground/background pairs: 4.5:1 for ordinary text, 3:1 for qualifying large text. Record any applicable exception. |
| [1.4.4 AA](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) · enlarged text | [Window zoom][U] and [webview font variables][V] exist; test content loss. | Y / Y | H zoom; K layout · **R+A** | At 200% text enlargement, read long names/paths, operate every action and recover errors without clipped essential content. |
| [1.4.5 AA](https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html) · text as text | [Input API][A] renders supplied text; Keyhole chooses whether instructions become images. | Y / Y | K · **R+A** | Keep instructions and variable labels as real text. Check any supplied artwork; do not put essential instructions in a screenshot. |
| [1.4.10 AA](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) · narrow-layout reflow | [Window zoom][U] does not establish whole-form reflow. | Y / Y | H dialogs; K webview · **R+A+Inspect** | At 320 CSS-pixel content width for ordinary vertical content, all controls/instructions remain usable without two-dimensional scrolling. Long secret strings do not justify a whole-form exception. |
| [1.4.11 AA](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) · controls and state contrast | [Theme colors][T] include contrast and focus borders; measure actual states. | Y / Y | H+K · **R+A** | Measure required borders, focus/state cues and meaningful icons against adjacent colors at 3:1. Document any unmodified platform-control exception instead of assigning a blanket host pass. |
| [1.4.12 AA](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) · spacing overrides | [Webview CSS/font hooks][V] exist; native-input spacing support/result remains unverified. | C: host markup support / Y | H now; K HTML · **A+Inspect** | In supporting markup, apply line height 1.5, paragraph spacing 2, letter spacing .12 and word spacing .16 times font size together; no lost instructions, overlap or inaccessible actions. |
| [1.4.13 AA](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) · hover/focus help | [Host hover aids][U] include persistence and Accessible View; not every tooltip is covered. | C / C: if extra content appears | H tooltips; K custom help · **R+A** | For author-controlled popups, check dismissal, moving the pointer onto them and persistence while needed. Do not hide essential instructions in a hover-only tooltip. |

### Operation

| Criterion | VS Code practice and evidence limit | Applicability: Now / Tab | Responsible layer · work | Check and expected evidence |
| --- | --- | --- | --- | --- |
| [2.1.1 A](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) · keyboard completion | [Keyboard navigation][U] exists; [webview guidance][W] requires author support. Eye-button reach untested. | Y / Y | H+K · **R+A** | Complete first set, supersede, correction and cancellation without a pointer. Include paste, the built reveal control, submission, and row editing once the tab exists. |
| [2.1.2 A](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html) · keyboard exit | [Host Tab navigation][U] documents a webview exception; test entry and exit. | Y / Y | H+K · **R+A** | Escape/cancel every dialog; leave and return to the tab using documented workbench navigation, including F6/Shift+F6 where supported. No stranded focus or accidental write. |
| [2.1.4 A](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html) · single-character shortcuts | [Keybinding editor][K] supports removal/remapping; [when clauses][C] scope extension bindings. | N: none added / C | K shortcuts; H inherited bindings · **R+A** | Check no typing character triggers save/reveal while entering a value. If a global character shortcut is added, provide the criterion's disable/remap/focus restriction. |
| [2.2.1 A](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html) · time limits | [Notification access][U] supports reading; retention and timing remain unverified. | C: host notices; no Keyhole entry timer / C | H notice lifetime; K timeouts/lifecycle · **R+A** | Pause entry; visit provider/password manager; return. Check any disappearing notice has a recoverable equivalent and any introduced deadline has a permitted adjustment/exception. Focus-loss survival alone is insufficient. |
| [2.2.2 A](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) · moving/updating content | [Webview reduced-motion class][V] is a hook, not pause/stop behavior. | N in current flow / C: progress or live previews | H+K · **A+Inspect** | Check final tab for autonomous animation/updates; if present, assess duration, concurrency and pause/stop/hide requirements. A static form creates no such trigger. |
| [2.3.1 A](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) · flashing | No flash-threshold result identified in reviewed [webview guidance][W]. | Y / Y | H+K · **R+A+Inspect** | Inspect all validation/progress/reveal states for flashing. Prefer no flashing; investigate thresholds if any appears. |
| [2.4.1 A](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html) · repeated blocks | [F6 navigation][U] traverses host regions; authored document bypass remains separate. | N in bounded single program / C: repetition across a qualifying set | H workbench; K repeated HTML · **R+A** | For a qualifying document/program set, check bypass of repeated blocks. Within one form/program, efficient access past chrome remains good design, not by itself this criterion's trigger under WCAG2ICT. |
| [2.4.2 A](https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html) · identifiable screen/title | [Quick Pick titles][Q] and [input title][A] identify native steps; panel titles need authorship. | Y, software interpretation / Y | H presentation; K titles · **R+A** | Distinguish name entry, value entry and batch tab from other open UI by an informative title/purpose. Inspect actual accessible output before deciding whether current prompts suffice. |
| [2.4.3 A](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) · focus sequence | [Host Tab order][U] helps; webview order and dynamic focus remain authored. | Y / Y | H+K · **R+A** | Tab/Shift+Tab through choices; verify return focus after errors, modal cancellation, reveal and row addition/removal. Follow the task's logical sequence. |
| [2.4.4 A](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html) · meaningful links | [Notification guidance][N] includes detail links; their purpose comes from Keyhole. | C: if help links / C | K link text/context · **A** | Read links with surrounding accessible context; destination/purpose is clear. Identify external provider links before leaving the entry flow. |
| [2.4.5 AA](https://www.w3.org/WAI/WCAG22/Understanding/multiple-ways.html) · finding pages/programs in a set | [Command Palette][P] finds commands; it does not provide navigation for a document set. | N in bounded single process / C: expanded document set | H navigation; K future documentation · **R+A** | Record scope: a single sequential entry task does not require two routes to every step. Reassess if linked standalone help/pages become a qualifying set. |
| [2.4.6 AA](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html) · useful labels | [Quick Pick guidance][Q] covers meaningful titles and details; Keyhole supplies them. | Y / Y | K content; H presentation · **R+A** | Check purpose and destination are specific, including two workspace folders sharing a basename. In batch mode, distinguish each row's field and action. |
| [2.4.7 AA](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) · visible focus | [Theme focusBorder][T] supports visible focus; [webview keyboard guidance][W] still needs implementation. | Y / Y | H theme; K HTML/CSS · **R+A** | In each tested theme, always locate keyboard focus, including reveal, small row actions and errors. Do not remove outlines without an effective replacement. |
| [2.4.11 AA](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) · focus not fully covered | No unobscured-focus result identified in reviewed [webview guidance][W]; inspect overlays. | Y / Y | H overlays; K authored panels · **R+A+Inspect** | With notices, sticky action bars and errors present, the focused component is not entirely covered by authored content. AA minimum is not the AAA full-visibility criterion. |
| [2.5.1 A](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html) · simple pointer alternative | [Webview UX][W] does not supply alternatives for an author's complex gestures. | N: no complex gestures / C | K gesture design; H controls · **Inventory/A** | If batch navigation gains multi-point/path gestures, supply an equivalent simple pointer action. Ordinary buttons already avoid the trigger. |
| [2.5.2 A](https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html) · cancellable activation | [Input button event API][A] exposes activation, not a criterion-level cancellation result. | Y / Y | H buttons; K custom handlers · **R+A+Inspect** | Press on an action, move off, release: no unintended commit. Use standard activation behavior; review any press-and-hold reveal design separately. |
| [2.5.3 A](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html) · visible and accessible naming | [Button tooltip][B] and [input title][A] are supplied by authors; matching names need inspection. | Y / Y | H+K · **R+A** | Accessible names contain visible action text; test speech activation of Set New Value, Cancel and any reveal control. Do not replace visible labels with unrelated ARIA names. |
| [2.5.4 A](https://www.w3.org/WAI/WCAG22/Understanding/motion-actuation.html) · motion alternatives | No Keyhole motion control; reviewed [webview guidance][W] supplies no motion-action equivalence. | N / N: no motion actions | K inventory · **Inventory** | Confirm no shake/tilt/movement gesture is required; reassess if introduced. |
| [2.5.7 AA](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) · drag alternatives | [Webview UX][W] does not add single-pointer alternatives to authored dragging. | N / C: if row reordering/import uses drag | K; H window movement separate · **Inventory/A** | Provide click/tap controls for any authored drag operation. Keyboard support alone does not establish the single-pointer alternative. |
| [2.5.8 AA](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) · target size/spacing | [Button API][B] offers no target-size result; native geometry and exceptions need checking. | Y / Y | H titlebar/buttons; K HTML targets · **R+A+Inspect** | Measure reveal, remove-row and other targets: 24×24 CSS pixels or a documented permitted exception, including spacing. Do not substitute the AAA 44-pixel target. |

### Understanding and feedback

| Criterion | VS Code practice and evidence limit | Applicability: Now / Tab | Responsible layer · work | Check and expected evidence |
| --- | --- | --- | --- | --- |
| [3.1.1 A](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html) · default language | [Display language][L] is configurable; Keyhole prose and HTML language remain its responsibility. | Y / Y | H platform; K language metadata/content · **R+A** | Check how English Keyhole text is exposed in the host; set the webview's document language. Test with the actual OS/editor language combination. |
| [3.1.2 AA](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html) · language changes | [Display language][L] does not identify language changes within Keyhole text. | C / C: mixed-language prose | H accessibility API; K markup/content · **A+Inspect** | Mark qualifying language changes programmatically; absent platform support is an unresolved limitation, not an exemption. Variable names, code and proper names do not automatically require language switches. |
| [3.2.1 A](https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html) · behavior on focus | [Input API][A] separates acceptance from editing; Keyhole event handlers determine side effects. | Y / Y | H+K · **R+A** | Focusing a field/control does not itself save, navigate or reveal. This criterion concerns receiving focus, not every focus-loss event. |
| [3.2.2 A](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html) · behavior on edit | [Input API][A] offers change/accept events and validation; surprise transitions remain an author concern. | Y / Y | K flow; H input · **R+A** | Editing a name/value does not unexpectedly submit or switch context. Confirm Enter/save behavior is explained; automatic validation does not steal focus. |
| [3.2.3 AA](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html) · repeated navigation | [Quick Pick guidance][Q] encourages familiar flows; no document-set navigation is supplied. | N in bounded single process / C: qualifying set | H; K future pages · **R+A** | For repeated navigation in a qualifying set, compare order. Preserve predictable in-form controls as good design even where the set-based criterion is not triggered. |
| [3.2.4 AA](https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html) · repeated component names | [Command guidance][P] encourages grouped naming; authored names/icons require comparison. | C: qualifying set / C | K · **A** | Check equivalent actions use consistent names/icons across any qualifying set. Keep single/batch wording coherent without pretending every UI state is a separate web page. |
| [3.2.6 A](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html) · recurring help location | [Accessibility Help][U] covers documented host contexts; Keyhole-specific help is not automatic. | N in bounded single program / C: repeated help across a qualifying set | K · **R+A** | Compare help placement across the qualifying set. Consistency within one form/program remains good practice; the criterion does not require inventing a support channel. |
| [3.3.1 A](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) · identifying rejected input | [Input validation][A] supplies messages/severity; [source review][S] finds alerts, not tested Keyhole speech. | Y / Y | K text; H or K announcement · **R+A** | Invalid name/value produces a textual explanation associated with the affected input. Batch errors identify row/name without echoing the secret. Operational git failures need useful messages too. |
| [3.3.2 A](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html) · entry guidance | [Quick Pick guidance][Q] and [input API][A] provide prompt/title mechanisms; Keyhole writes guidance. | Y / Y | K text; H semantics or K HTML · **R+A** | Before submission, the person can identify variable, value, destination, restrictions and consequences. Verify both visible guidance and the accessible association; one does not prove the other. |
| [3.3.3 AA](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html) · actionable correction | [Notification guidance][N] favors actionable messages; Keyhole must know the safe correction. | Y / Y | K · **A** | For a known safe correction, explain it: valid name syntax, unsupported multiline value, malformed batch row. Avoid instructions that expose a real value in chat or logs. |
| [3.3.4 AA](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html) · consequential data changes | [Modal notifications][N] support choices; Keyhole owns review, correction and reversal semantics. | C: especially superseding existing settings / C | K safeguards; H dialog · **R+A** | Assess each operation; where triggered, verify reversibility, checking with correction, or review/confirmation/correction before submission. An old line remaining in a file is not proof of accessible undo. |
| [3.3.7 A](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html) · repeated information | [Input value API][A] does not supply workflow-level retry retention; Keyhole owns it. | C: correction/retry within one activity / Y for batch correction | K flow/lifetime · **A** | Correct one input without unnecessarily repeating valid information. Check current restart-after-value-refusal behavior. Document any actual security/invalidity exception; no requirement to persist secrets across sessions. |
| [3.3.8 AA](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) · authentication assistance | [Input API][A] documents masking, not an accessible authentication process. | N for credential storage alone / C if sign-in added | K authentication design; H input · **Inventory/A** | Current flow stores a credential rather than authenticating its operator. Preserve paste anyway. If authentication is added, assess cognitive tasks and permitted assistance across the entire sign-in process. |
| [4.1.2 A](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) · exposed control semantics | [Screen-reader mode][U], [webview class][V] and [source findings][S] provide mechanisms; inspect actual controls. | Y / Y | H control API; K supplied labels and HTML · **R+A** | Inspect name/role/state and test with VoiceOver. For the built reveal control, expose its action/state, preserve entry/focus, and do not announce the entire value without the person's deliberate request. |
| [4.1.3 AA](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) · announced outcomes | [Accessible View][U] supports notifications; recovery is distinct from automatic announcement. [Notices][N] still need testing. | Y / Y | H notifications; K result text/HTML status · **R+A** | Success, refusal, verification mismatch and batch progress are conveyed without hunting for a new visual message. A focus-taking modal is tested as a dialog; a log alone does not establish announcement. |

## Interpretations that affect the design

**Paste and reveal are different requirements.** W3C's
[authentication guidance](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html)
discusses both, but a reveal toggle is not an unconditional AA requirement.
Its absence alone does not prove a failure. It remains a useful improvement
for checking a long pasted value. The chosen, now-built toggle must itself be
operable and named; its state and the destination must be clear.
[Surveyor's section 1](2026-10-20-accessible-entry-source-reads.md#1-flipping-password-on-an-open-box-buttons-ignorefocusout)
supports implementing it in the palette at the 1.134.0 floor. Test the value,
caret, focus and announcements across the flip before treating it as usable.
The earlier short-timer proposal was withdrawn; `912b821` re-masks on window
focus loss, disposes on hide, and has no timer. If a timer returns, assess
its reading deadline under 2.2.1 rather than treating repeated reveal as proof
of compliance. The built window-focus boundary distinguishes switching apps
from moving between the input and its eye button. Test both: moving focus
to the reveal button or explanatory text must remain usable. Do not move focus
unexpectedly to shorten exposure. If live length/keyprint text is added,
test whether its announcements interrupt typing or obscure other guidance.

**Hidden-tab clearing needs a deliberate recovery design.** The proposed
“no retained hidden context” rule protects the value path, but can also erase
work when someone switches to a provider page or another editor tab. Do not
resolve that tension by automatically persisting secrets or by requiring
unexplained repeated entry. Define the lifecycle, warn before deliberate
clearing where possible, retain harmless names/destinations where appropriate,
and test the recovery. [Surveyor's section 4](2026-10-20-accessible-entry-source-reads.md#4-what-a-webviews-content-is-visible-to)
reports that without `retainContextWhenHidden` the iframe is destroyed on
hide; retaining it keeps the live iframe in memory. Hiding an editor tab and
switching to another application need separate checks. This source finding
narrows the design choice; it does not authorize retaining or serializing
secret values to avoid re-entry.
[Redundant-entry guidance](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html)
allows specific exceptions; it does not exempt the entire form because one
field contains a secret. ADR-0004 proposes keeping requests/drafts as metadata
only. That can preserve the task and instructions across days; it does not
settle what happens to a partially entered value when its form is hidden.

**No new confirmation modal is mandated for every save.** The scope and
alternatives in [3.3.4](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html)
need an operation-by-operation assessment. Superseding a working configuration
deserves a meaningful review and recovery route. The current question is a
starting safeguard; it has not been assessed with assistive technology.

**Plain explanations are Keyhole's job.** WCAG AA does not make a reading-level
claim for the text. Still, a novice cannot choose well if the only instruction
is “fix git.” The recommendation/why wording now implemented under ADR-0002
belongs in the label, error and correction checks above. Do not convert stylistic
preferences into asserted WCAG failures.

## Checks to run later, with harmless values only

These are proposed checks, not steps executed during this research. Use a
throwaway project and invented values that resemble no actual credential.
Record extension commit, VS Code build (minimum 1.134.0 and the 1.141.0
reference build where available), macOS and VoiceOver version, language, theme, zoom,
input method and any accessibility mode. Never put real values in a recording
or accessibility-tree dump. A macOS result alone cannot substantiate a claim
covering Windows and Linux.

| Protocol | Procedure | Evidence to retain |
| --- | --- | --- |
| Keyboard and focus | Invoke command without mouse; choose folder; enter valid/invalid names; paste dummy value; cancel at each stage; supersede a dummy existing value. Exercise the built reveal control now; add tab/batch checks when built. Include leave/return to workbench. | Ordered actions, visible focus, cancellation/write outcome and any unreachable control. |
| VoiceOver | Navigate all controls and explanatory text. Check errors before/after correction, each modal's question/details/actions, and success/refusal/mismatch notices. Inspect the built reveal control's state without assuming a particular spoken password behavior. | Actual announcements and accessible names/roles/states, with only fake values; identify missed or confusing information. |
| Color and contrast | Repeat the flow in built-in light, dark, high-contrast dark and high-contrast light themes. Measure relevant foreground/background and state pairs; inspect focus and errors. | Theme/color pairs, measured ratios, component/state, and any justified exception. Theme names alone are not measurements. |
| Zoom, reflow and spacing | Enlarge text to 200%; test 320 CSS-pixel content width (often 400% zoom from 1280px, but measure the available webview width); apply all four spacing overrides in supporting markup. Exercise long folder/name text and batch errors. | Dimensions/settings and whether every label, error, explanation and action remains available. |
| Recovery and pacing | Pause, change application, retrieve a fake token, return; revisit a dismissed notice. Submit an unsupported fake value and correct it. In batch mode fix one row, cancel review, and test hidden-tab recovery. | What was retained/lost, what the person was told, whether a value was written, and whether valid information had to be re-entered. |
| Conditional features | Inventory media, animations, timeouts, gestures, dragging, help, links and personal/authentication fields in the final UI. | Confirm or revise each N/C row; add the corresponding test before claiming that criterion is satisfied. |

Automated HTML/accessibility checks can assist the eventual webview review.
They cannot establish VoiceOver usability, correct focus recovery, clear
instructions, complete-process coverage, or confidentiality. The repository
gate is a build/regression check, not an accessibility result.

For each applicable row, retain: **surface/version; setup; action; expected
result; observed result; pass/fail/not tested; evidence; owner/follow-up**.
For an exclusion, retain the missing trigger and scope. Repeat affected checks
after changes to controls, wording, focus, layout or supported host versions.

## What Keyhole itself must act on

1. **Make purpose and destination unambiguous** (1.3.1, 2.4.2/6, 3.3.2,
   4.1.2). Audit prompts, step identity and same-basename folder choices. The
   present folder picker uses only `folder.name`; check the ambiguity and add
   nonsecret distinguishing context if needed. Both input boxes now carry
   `Keyhole: Set a Secret in .env` as their title (`685bafd`, retained by
   `912b821`), closing the missing-metadata finding.
   [Surveyor's section 2](2026-10-20-accessible-entry-source-reads.md#2-what-a-screen-reader-hears-in-a-password-box)
   traces the title into the input's name. The shared title alone does not
   prove that the name step, value step and destination can be distinguished:
   record the actual name/description and speech in QST-CHECK-EYE. The source
   change is implemented; its accessibility outcome is not yet observed.
2. **Design correction and review paths** (3.3.1/3/4/7). Identify the bad
   field and safe correction without reproducing its value; preserve valid
   work during the same activity where appropriate. Decide batch partial-write
   behavior and explain it before submission. Do not call “old line retained”
   an accessible undo without a usable route.
3. **Finish the keyboard and focus contract** (2.1.1/2, 2.4.3/7/11,
   2.5.2/3/8, 4.1.2). The built eye button and future row actions need names,
   state, keyboard activation, appropriate targets and focus recovery.
   QST-CHECK-EYE starts the palette check; a working mouse click or a mocked
   button event does not establish a keyboard route.
4. **Make outcomes perceivable and recoverable** (4.1.3; 2.2.1 if timing
   applies). State whether nothing was written, saving succeeded, or a write
   happened but verification failed. Ensure the result can be found after a
   notice disappears. Verify host announcements rather than inferring them
   from the notification API call.
5. **Own the webview's semantics and visual behavior** (1.3.1/2,
   1.4.1/3/4/10/11/12/13, 3.1.1, 4.1.2/3). Use real labels and controls,
   theme/font tokens, coherent reading order and status/error associations;
   measure contrast and test layout. Preserve paste, avoid forced transcription,
   and classify any true authentication/personal-data fields accurately.
6. **Resolve interruption and value-lifetime behavior before building the
   tab** (2.2.1 when timed, 3.3.7, and the product's confidentiality contract).
   Leaving to get a credential must not create a surprise loss/re-entry loop.
   Accessibility does not authorize wider secret persistence or exposure.

These are Keyhole-owned acceptance conditions and identified checks, not a
list of confirmed failures. ADR-0003 now chooses the reveal control, both
assessment columns and the batch tab/inbox direction. The following scaffold
applies those choices without answering ADR-0004's remaining questions.

## Proposed release scaffold

This follows **option A in ADR-0004's QST-ORDER-INBOX**, which is still
unanswered. It is an assessment/build scaffold, not a new release decision.
That option couples the link with an inbox and tab so a request can wait;
the link is an implementation checkpoint inside that release, not a separate
transient-prompt release. Only **0.1.0** is assigned a version here.

**Update while this assessment was being written:** ADR-0004 iteration 2
adds **D**, now Glazier's recommendation: command → link/inbox in a native
Quick Pick → tab → instructions. The human answer remains open. The option-A
scaffold requested by the brief is retained below; the D split is explicit
after the tab stage, so neither recommendation silently becomes a decision.

Each release inherits the preceding release's applicable criteria. A new
surface activates its checks before it ships. “Deferred” below means the
surface/feature is absent from that release, never that an applicable failure
becomes a pass. Resolve current failures or record their affected users,
workaround, owner and release disposition; keep them visibly unmet. A host
limitation remains a dependency with evidence, not a WCAG exemption.

### 0.1.0: the person's command, including reveal

Start with [QST-CHECK-EYE](../adr/0003-accessible-entry-showing-the-value-conformance-and-a-tab-for-many-secrets.md#qst-check-eye-can-a-person-see-what-they-typed-by-mouse-and-by-keyboard-and-what-does-voiceover-say).
It is posed and unanswered. Record both inputs' actual names/descriptions,
keyboard reach and activation of the eye, value/caret preservation, window
blur and return behavior. If keyboard reach fails, the reveal function needs
a usable keyboard route in this release; the future tab does not discharge
the current command's 2.1.1 assessment. Determine the host mechanism before
choosing a workaround.

The five-minute eye check is not the whole release assessment. Use the
protocols above for first set, same-basename workspace choices, invalid name,
unsupported fake value, git questions/refusals, superseding, cancellation,
successful write and verification mismatch. Retain actual outcomes rather
than treating the presence of a modal or notification as success.

| Criterion set in the current matrix | Work due for 0.1.0 |
| --- | --- |
| **30 definite Now rows:** 1.1.1; 1.3.1–1.3.4; 1.4.1, 1.4.3–1.4.5, 1.4.10–1.4.11; 2.1.1–2.1.2; 2.3.1; 2.4.2–2.4.3, 2.4.6–2.4.7, 2.4.11; 2.5.2–2.5.3, 2.5.8; 3.1.1; 3.2.1–3.2.2; 3.3.1–3.3.3; 4.1.2–4.1.3 | Assess every row on the shipped native surfaces. Keyboard/VoiceOver checks cover the full sequence, not just the eye. Measure contrast and targets; check high-contrast themes, enlargement, reflow, focus, language and unintended side effects. |
| **9 conditional Now rows:** 1.3.5, 1.4.12–1.4.13, 2.2.1, 2.4.4, 3.1.2, 3.2.4, 3.3.4, 3.3.7 | Establish each trigger, then test or record its absence/exception. In particular, assess superseding safeguards, retry after refused values, notice recovery, tooltip behavior and supported spacing changes now. No reveal timer does not settle notification timing. |
| **16 absent-trigger Now rows:** 1.2.1–1.2.5, 1.4.2, 2.1.4, 2.2.2, 2.4.1, 2.4.5, 2.5.1, 2.5.4, 2.5.7, 3.2.3, 3.2.6, 3.3.8 | Confirm the bounded inventory: no authored media/audio, added character shortcuts, autonomous updates, qualifying document set, complex gestures, motion actions, authored dragging or operator authentication. If the release changes that inventory, activate the affected row immediately. |

**May wait:** inbox/draft persistence, deep-link navigation, authored HTML
layout and batch-row checks, because those implementations are absent. The
same criteria still apply to current controls where their triggers exist.
Record macOS/VoiceOver and VS Code versions; other platforms or versions
without results remain untested rather than inheriting this result.

### Next release: link, inbox/drafts and single/batch tab

Work in three checkpoints, with one complete request-to-outcome assessment
before publication:

1. **Request arrival and reopening.** A link identifies a nonsecret record,
   waits without forcing entry, and reopens the intended draft. Test arrival
   during another task, duplicate requests and return to the inbox. Preserve
   user control of context/focus and make status understandable: 2.1.1/2,
   2.2.1 if timed, 2.4.2/3/4/6/7/11, 3.2.1/2 and 4.1.2/3.
2. **Single-entry form.** Own HTML labels, structure and reading order;
   language, theme/contrast, zoom/reflow/spacing; names/states and keyboard
   entry/exit: 1.1.1, 1.3.1–1.3.4, 1.4.1/3/4/5/10/11/12/13,
   2.1.1/2, 2.4.2/3/6/7/11, 2.5.2/3/8, 3.1.1 and 4.1.2/3.
   Some are inherited criteria with new HTML work, not newly invented
   requirements. Recheck conditional rows, including mixed-language content.
3. **Sequences and mass entry.** Add/remove/correct a row, review the
   destination and proposed write, cancel, handle partial failures, and
   return after hiding the tab or switching apps. Assess 3.3.1/2/3/4/7,
   dynamic focus and status changes; assess 2.5.7 if row dragging is offered.
   Names and row errors must remain distinct without revealing values.

Repeat keyboard, VoiceOver, theme/contrast, zoom/spacing and recovery checks
on these new surfaces. Saving names/reasons/instructions in a draft does not
prove that partially entered secret values can be corrected without needless
repetition. Define that boundary and test it with harmless values. Distinguish
assistant-provided text from reviewed directions through headings and words,
not only color; the actual trust/storage choices remain ADR-0004 questions.

**May wait:** service-instruction pages and Porthole integration, because they
are not yet shipped. Media, complex gestures, motion, dragging and sign-in
remain conditional on their actual introduction. Deferred surfaces do not
justify deferring the tab's own labels, keyboard operation or visual checks.

### If option D is selected: split the native inbox from the tab

Keep 0.1.0's assessment unchanged. The next release takes checkpoint 1 above
plus the native request list: check distinct request names/destinations,
selection and cancellation, waiting/reopening across sessions, focus return,
and understandable status without exposing a value. Reuse the native-control
checks, but assess the newly composed list-to-entry flow: especially 1.3.1/2,
2.1.1/2, 2.2.1 if timed, 2.4.2/3/4/6/7/11, 2.5.2/3/8,
3.2.1/2, 3.3.1/2/3/4/7 and 4.1.2/3. Add the same theme/zoom checks to
the new list; reuse does not establish its accessibility outcome.

The subsequent tab release takes checkpoints 2 and 3, including authored HTML,
batch/sequence controls and their recovery checks. Those can wait while the
tab is absent; native-list failures cannot. Instructions follow afterward.
This split preserves a waiting request without requiring the webview first.

### Following release: service instructions in Porthole and a fallback

Assess the instruction documents and the whole transition: open the correct
guide, follow it to a provider with a dummy example, return to the intended
draft, enter a value, understand the result. Test both Porthole and the
fallback when Porthole is absent. Record the Porthole version as an additional
host dependency; a passing entry form does not establish the guide's result.

Inherit the applicable perception, keyboard, focus, language, naming and
feedback checks. Add document-specific link purpose (2.4.4), meaningful
headings (2.4.6) and any image alternatives (1.1.1). Reassess **2.4.1, 2.4.5,
3.2.3, 3.2.4 and 3.2.6** for the qualifying instruction-page set: bypass,
multiple ways to find pages, consistent navigation, identification and help.
Test long instructions, collapsed sections, zoom/narrow widths, leaving and
returning without losing the task, and distinguishable reviewed/model text.

**May remain inapplicable:** the five media criteria while pages contain no
media; motion/dragging criteria while those actions are absent; authentication
while Keyhole does not authenticate its operator. Reopen them when introduced.
Provider sign-in and token-creation pages are external dependencies: record
obstacles and alternative instructions separately, and do not imply our
assessment establishes those sites' accessibility.

## Measuring work beyond VS Code

The row-level work codes show where implementation effort is likely to sit;
they do not establish that Keyhole exceeds VS Code's accessibility. Measure
the actual cost by surface and change, so one fix or hand check covering many
criteria is counted once. Begin each entry with **not measured**; do not turn
these planning categories into invented estimates.

| Work to record | Host contribution | Keyhole increment to measure |
| --- | --- | --- |
| Titles, prompts, modal reasons, outcomes | Native controls and presentation APIs | Writing/configuration time; integration-check time. Labels and reveal are implemented, not yet live-verified. |
| Eye-button keyboard/focus behavior | Native title-bar button/event machinery | Investigation and any workaround time, separately from the eye's implementation; QST-CHECK-EYE result pending. |
| Native contrast, zoom, spacing and target geometry | Host rendering, theme and zoom mechanisms | Measurement time; host issue/reproduction time if a failure is actually observed. |
| Inbox/tab form and batch recovery | Webview container, theme/font hooks | HTML/interaction implementation, correction/lifecycle design and regression-check time. |
| Guides and Porthole/fallback transitions | Two host surfaces and their navigation | Content/markup work and cross-surface checks; provider obstacles tracked separately. |

For each evidence entry use: **release + commit; surface/flow; criterion IDs;
host/version/platform; documented baseline; Keyhole change; implementation
time; verification time; host-investigation time; observed result; remaining
issue + owner**. A minimal reproduction must precede a “host blocked” result.
Then choose whether to reuse a working route, add a bounded workaround or
track the upstream limitation; do not rebuild an entire host control merely
because its documentation lacks a criterion-specific claim.

The resulting release note can say: “Assessed against the listed WCAG 2.2
A/AA criteria on [versions/platform], using [methods]; [results and untested
or unmet rows].” Until those checks run, the accurate state is **assessment
planned; documentation/source review complete**.
