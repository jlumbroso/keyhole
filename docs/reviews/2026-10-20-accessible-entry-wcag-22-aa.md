# Accessible entry: WCAG 2.2 A/AA assessment plan

- **Author:** Sounder 6 (GPT-6 Astra), 2026-10-20
- **For:** [ADR-0003](../adr/0003-accessible-entry-showing-the-value-conformance-and-a-tab-for-many-secrets.md), QST-A11Y-TARGET
- **Inspected:** Keyhole `8230de297ce6156f8ba00dc8efde61b1cf60d060`, especially [setSecret.ts](../../src/setSecret.ts); [ADR-0002](../adr/0002-the-persons-path-setting-a-secret-in-env.md), iteration 3; ADR-0003, iteration 1.
- **Evidence:** vendor documentation and Keyhole source inspection. No VoiceOver, keyboard, contrast, zoom, or other live accessibility test was performed. The earlier functional hand check is not an accessibility assessment.

## Recommended target and its limits

Adopt **WCAG 2.2 Level A and AA success criteria as the assessment target,
using WCAG2ICT to interpret them for desktop software**. Use the same criteria
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
sets of documents/programs, and document the platform dependencies. Final
wording and the target remain Jérémie's decision in ADR-0003.

**“VS Code supplies the control” is an ownership statement, not a pass.**
The host provides rendering, input and accessibility mechanisms; Keyhole
supplies prompts, choices, validation, transitions and results. The composed
experience still needs checking on the supported versions.

## Surfaces and evidence boundaries

| Surface | Present state | What Keyhole controls |
| --- | --- | --- |
| Command and workspace chooser | Built: Command Palette entry; Quick Pick when several local folders are open | Command wording, available choices and destination descriptions |
| Variable-name box | Built: host input with Keyhole validation | Prompt, accepted names, refusal reason and recovery |
| Secret-value box | Built: masked host input, `ignoreFocusOut: true` | Purpose/destination prompt, paste-friendly flow, submission and cancellation |
| Questions | Built: git-ignore and existing-value modals | Recommendation, reason, button labels and effects; wording changes remain open in ADR-0002 |
| Refusals and results | Built: host warning/information notifications and a nonsecret output log | Accurate state, actionable next step and content that must not expose the value |
| Reveal control | Proposed in ADR-0003; not implemented in the inspected revision | If chosen: meaningful name/state, deliberate activation, preserved input and focus |
| Single/batch entry tab | Proposed webview; not implemented | HTML semantics, layout, focus, errors, review, theme integration and lifecycle |

Surveyor owns the version-pinned VS Code source questions: password toggling,
accessibility attributes, editor backups and webview exposure/lifetime. The
[parallel brief](../inbox/2026-10-20-2324-glazier-to-surveyor-accessible-entry-source-reads.md)
is a dependency, **not a result**. Add its completed review as evidence when it
lands; do not infer what VoiceOver speaks from a password attribute alone.

### What the VS Code documentation provides

| Host documentation | Useful provision | Keyhole's remaining check |
| --- | --- | --- |
| [Accessibility](https://code.visualstudio.com/docs/configure/accessibility/accessibility) | Keyboard navigation, screen-reader support, notification access, high-contrast themes and window zoom | Every actual entry, refusal, confirmation and success path. Record VoiceOver and host versions; host support does not prove the supplied words are announced. |
| [Quick Picks](https://code.visualstudio.com/api/ux-guidelines/quick-picks) and [InputBoxOptions](https://code.visualstudio.com/api/references/vscode-api#InputBoxOptions) | Native input/choice APIs with prompt, title, validation and focus options | Purpose remains understandable while editing; two folders with the same basename can be distinguished. API existence is not a spoken-label result. |
| [Notifications](https://code.visualstudio.com/api/ux-guidelines/notifications) | Host notices and modal questions | Choice, consequence, cancellation and outcome are understandable without sight; transient notices remain recoverable. |
| [Webview UX](https://code.visualstudio.com/api/ux-guidelines/webviews) | Guidance to provide theme support, contrast, accessible labels and keyboard operation | Keyhole owns these inside its HTML. A tab offers more room but is not inherently more accessible. |
| [Webview API](https://code.visualstudio.com/api/extension-guides/webview#accessibility) and [theme colors](https://code.visualstudio.com/api/references/theme-color) | Theme/font tokens, screen-reader and reduced-motion classes | Correct semantic color pairs and visible focus, measured in rendered states. Essential labels must not depend on detecting a screen reader. |

## Reading the matrix

- **Now** means the built command sequence. **Tab** includes the proposed
  webview and its optional batch/reveal controls.
- **Y**: applies to this surface; verification is pending. **C**: applies if
  the stated feature/condition exists. **N**: trigger absent in the bounded
  design; recheck that reason before release. None of these means “passed.”
- **H**: host mechanism. **K**: Keyhole implementation/content. **H+K**:
  both, with integration checked. Ownership does not remove a criterion.
- The last column states the observable check. The protocols below expand
  keyboard, VoiceOver, visual and recovery checks. Criterion links lead to
  W3C's explanations; applicability to Keyhole is this review's analysis.

### Perception

| Criterion | Applicability: Now / Tab | Responsible layer | Check and expected evidence |
| --- | --- | --- | --- |
| [1.1.1 A](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) · icon alternatives | Y / Y | H for built-in symbols; K for reveal/action icons | VoiceOver identifies each action; decorative marks add no noise. An eye icon alone must not be the control's only explanation. |
| [1.2.1 A](https://www.w3.org/WAI/WCAG22/Understanding/audio-only-and-video-only-prerecorded.html) · recorded audio/video | N / N: no recordings | K inventory | Confirm neither entry route embeds a recording. Reassess if a tutorial is added. |
| [1.2.2 A](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html) · recorded captions | N / N: no synchronized media | K inventory | Inspect final assets; no media means no caption-bearing content to test. |
| [1.2.3 A](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html) · recorded visual information | N / N: no synchronized media | K inventory | Reopen if video is embedded; a prose-only form does not need a video alternative. |
| [1.2.4 AA](https://www.w3.org/WAI/WCAG22/Understanding/captions-live.html) · live captions | N / N: no live media | K inventory | Confirm no live instructional stream is part of the process. |
| [1.2.5 AA](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-prerecorded.html) · recorded audio description | N / N: no video | K inventory | Reopen for future instructional video; not discharged by checking the form alone. |
| [1.3.1 A](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) · structure and associations | Y / Y | H+K now; K HTML | Inspect accessible names/descriptions and read with VoiceOver: name, value, destination, explanation and error associations. Batch rows need distinct field labels. |
| [1.3.2 A](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html) · reading sequence | Y / Y | H+K | Read without visual positioning: destination and consequences precede the decision. Batch rows and their errors follow a meaningful order. |
| [1.3.3 A](https://www.w3.org/WAI/WCAG22/Understanding/sensory-characteristics.html) · instructions independent of appearance | Y / Y | K | Review wording: use named actions, not “the green button” or “the box on the right.” Verify instructions still make sense when heard. |
| [1.3.4 AA](https://www.w3.org/WAI/WCAG22/Understanding/orientation.html) · orientation | Y / Y | H window; K layout | On a rotatable supported display/emulated viewport, use both orientations without a content-imposed lock. This is not merely the narrow-width check. |
| [1.3.5 AA](https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html) · standardized personal-field purposes | C / C: only qualifying fields about the user | H platform; K field classification | Inventory eventual fields against WCAG's taxonomy. Generic variable names/API tokens are not automatically account-password fields; do not assign misleading autocomplete semantics. |
| [1.4.1 A](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) · color-independent meaning | Y / Y | H+K | Error, selected action and saved/refused states remain distinguishable in grayscale and through text/semantics; color alone never explains a row's failure. |
| [1.4.2 A](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html) · automatic audio | N / N: no authored audio | K; H for host sounds | Check the final flow adds no autoplay audio. Screen-reader speech is not Keyhole-authored autoplay content. |
| [1.4.3 AA](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · text contrast | Y / Y | H theme rendering; K authored colors/content | Measure actual label, prompt, error and result foreground/background pairs: 4.5:1 for ordinary text, 3:1 for qualifying large text. Record any applicable exception. |
| [1.4.4 AA](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) · enlarged text | Y / Y | H zoom; K layout | At 200% text enlargement, read long names/paths, operate every action and recover errors without clipped essential content. |
| [1.4.5 AA](https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html) · text as text | Y / Y | K | Keep instructions and variable labels as real text. Check any supplied artwork; do not put essential instructions in a screenshot. |
| [1.4.10 AA](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) · narrow-layout reflow | Y / Y | H dialogs; K webview | At 320 CSS-pixel content width for ordinary vertical content, all controls/instructions remain usable without two-dimensional scrolling. Long secret strings do not justify a whole-form exception. |
| [1.4.11 AA](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) · controls and state contrast | Y / Y | H+K | Measure required borders, focus/state cues and meaningful icons against adjacent colors at 3:1. Document any unmodified platform-control exception instead of assigning a blanket host pass. |
| [1.4.12 AA](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) · spacing overrides | C: host markup support / Y | H now; K HTML | In supporting markup, apply line height 1.5, paragraph spacing 2, letter spacing .12 and word spacing .16 times font size together; no lost instructions, overlap or inaccessible actions. |
| [1.4.13 AA](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) · hover/focus help | C / C: if extra content appears | H tooltips; K custom help | For author-controlled popups, check dismissal, moving the pointer onto them and persistence while needed. Do not hide essential instructions in a hover-only tooltip. |

### Operation

| Criterion | Applicability: Now / Tab | Responsible layer | Check and expected evidence |
| --- | --- | --- | --- |
| [2.1.1 A](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) · keyboard completion | Y / Y | H+K | Complete first set, supersede, correction and cancellation without a pointer. Include paste, reveal if added, row editing and submission. |
| [2.1.2 A](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html) · keyboard exit | Y / Y | H+K | Escape/cancel every dialog; leave and return to the tab using documented workbench navigation, including F6/Shift+F6 where supported. No stranded focus or accidental write. |
| [2.1.4 A](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html) · single-character shortcuts | N: none added / C | K shortcuts; H inherited bindings | Check no typing character triggers save/reveal while entering a value. If a global character shortcut is added, provide the criterion's disable/remap/focus restriction. |
| [2.2.1 A](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html) · time limits | C: host notices; no Keyhole entry timer / C | H notice lifetime; K timeouts/lifecycle | Pause entry; visit provider/password manager; return. Check any disappearing notice has a recoverable equivalent and any introduced deadline has a permitted adjustment/exception. Focus-loss survival alone is insufficient. |
| [2.2.2 A](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) · moving/updating content | N in current flow / C: progress or live previews | H+K | Check final tab for autonomous animation/updates; if present, assess duration, concurrency and pause/stop/hide requirements. A static form creates no such trigger. |
| [2.3.1 A](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) · flashing | Y / Y | H+K | Inspect all validation/progress/reveal states for flashing. Prefer no flashing; investigate thresholds if any appears. |
| [2.4.1 A](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html) · repeated blocks | N in bounded single program / C: repetition across a qualifying set | H workbench; K repeated HTML | For a qualifying document/program set, check bypass of repeated blocks. Within one form/program, efficient access past chrome remains good design, not by itself this criterion's trigger under WCAG2ICT. |
| [2.4.2 A](https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html) · identifiable screen/title | Y, software interpretation / Y | H presentation; K titles | Distinguish name entry, value entry and batch tab from other open UI by an informative title/purpose. Inspect actual accessible output before deciding whether current prompts suffice. |
| [2.4.3 A](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) · focus sequence | Y / Y | H+K | Tab/Shift+Tab through choices; verify return focus after errors, modal cancellation, reveal and row addition/removal. Follow the task's logical sequence. |
| [2.4.4 A](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html) · meaningful links | C: if help links / C | K link text/context | Read links with surrounding accessible context; destination/purpose is clear. Identify external provider links before leaving the entry flow. |
| [2.4.5 AA](https://www.w3.org/WAI/WCAG22/Understanding/multiple-ways.html) · finding pages/programs in a set | N in bounded single process / C: expanded document set | H navigation; K future documentation | Record scope: a single sequential entry task does not require two routes to every step. Reassess if linked standalone help/pages become a qualifying set. |
| [2.4.6 AA](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html) · useful labels | Y / Y | K content; H presentation | Check purpose and destination are specific, including two workspace folders sharing a basename. In batch mode, distinguish each row's field and action. |
| [2.4.7 AA](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) · visible focus | Y / Y | H theme; K HTML/CSS | In each tested theme, always locate keyboard focus, including reveal, small row actions and errors. Do not remove outlines without an effective replacement. |
| [2.4.11 AA](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) · focus not fully covered | Y / Y | H overlays; K authored panels | With notices, sticky action bars and errors present, the focused component is not entirely covered by authored content. AA minimum is not the AAA full-visibility criterion. |
| [2.5.1 A](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html) · simple pointer alternative | N: no complex gestures / C | K gesture design; H controls | If batch navigation gains multi-point/path gestures, supply an equivalent simple pointer action. Ordinary buttons already avoid the trigger. |
| [2.5.2 A](https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html) · cancellable activation | Y / Y | H buttons; K custom handlers | Press on an action, move off, release: no unintended commit. Use standard activation behavior; review any press-and-hold reveal design separately. |
| [2.5.3 A](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html) · visible and accessible naming | Y / Y | H+K | Accessible names contain visible action text; test speech activation of Set New Value, Cancel and any reveal control. Do not replace visible labels with unrelated ARIA names. |
| [2.5.4 A](https://www.w3.org/WAI/WCAG22/Understanding/motion-actuation.html) · motion alternatives | N / N: no motion actions | K inventory | Confirm no shake/tilt/movement gesture is required; reassess if introduced. |
| [2.5.7 AA](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) · drag alternatives | N / C: if row reordering/import uses drag | K; H window movement separate | Provide click/tap controls for any authored drag operation. Keyboard support alone does not establish the single-pointer alternative. |
| [2.5.8 AA](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) · target size/spacing | Y / Y | H titlebar/buttons; K HTML targets | Measure reveal, remove-row and other targets: 24×24 CSS pixels or a documented permitted exception, including spacing. Do not substitute the AAA 44-pixel target. |

### Understanding and feedback

| Criterion | Applicability: Now / Tab | Responsible layer | Check and expected evidence |
| --- | --- | --- | --- |
| [3.1.1 A](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html) · default language | Y / Y | H platform; K language metadata/content | Check how English Keyhole text is exposed in the host; set the webview's document language. Test with the actual OS/editor language combination. |
| [3.1.2 AA](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html) · language changes | C / C: mixed-language prose | H accessibility API; K markup/content | Mark qualifying language changes programmatically; absent platform support is an unresolved limitation, not an exemption. Variable names, code and proper names do not automatically require language switches. |
| [3.2.1 A](https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html) · behavior on focus | Y / Y | H+K | Focusing a field/control does not itself save, navigate or reveal. This criterion concerns receiving focus, not every focus-loss event. |
| [3.2.2 A](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html) · behavior on edit | Y / Y | K flow; H input | Editing a name/value does not unexpectedly submit or switch context. Confirm Enter/save behavior is explained; automatic validation does not steal focus. |
| [3.2.3 AA](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html) · repeated navigation | N in bounded single process / C: qualifying set | H; K future pages | For repeated navigation in a qualifying set, compare order. Preserve predictable in-form controls as good design even where the set-based criterion is not triggered. |
| [3.2.4 AA](https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html) · repeated component names | C: qualifying set / C | K | Check equivalent actions use consistent names/icons across any qualifying set. Keep single/batch wording coherent without pretending every UI state is a separate web page. |
| [3.2.6 A](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html) · recurring help location | N in bounded single program / C: repeated help across a qualifying set | K | Compare help placement across the qualifying set. Consistency within one form/program remains good practice; the criterion does not require inventing a support channel. |
| [3.3.1 A](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) · identifying rejected input | Y / Y | K text; H or K announcement | Invalid name/value produces a textual explanation associated with the affected input. Batch errors identify row/name without echoing the secret. Operational git failures need useful messages too. |
| [3.3.2 A](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html) · entry guidance | Y / Y | K text; H semantics or K HTML | Before submission, the person can identify variable, value, destination, restrictions and consequences. Verify both visible guidance and the accessible association; one does not prove the other. |
| [3.3.3 AA](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html) · actionable correction | Y / Y | K | For a known safe correction, explain it: valid name syntax, unsupported multiline value, malformed batch row. Avoid instructions that expose a real value in chat or logs. |
| [3.3.4 AA](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html) · consequential data changes | C: especially superseding existing settings / C | K safeguards; H dialog | Assess each operation; where triggered, verify reversibility, checking with correction, or review/confirmation/correction before submission. An old line remaining in a file is not proof of accessible undo. |
| [3.3.7 A](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html) · repeated information | C: correction/retry within one activity / Y for batch correction | K flow/lifetime | Correct one input without unnecessarily repeating valid information. Check current restart-after-value-refusal behavior. Document any actual security/invalidity exception; no requirement to persist secrets across sessions. |
| [3.3.8 AA](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) · authentication assistance | N for credential storage alone / C if sign-in added | K authentication design; H input | Current flow stores a credential rather than authenticating its operator. Preserve paste anyway. If authentication is added, assess cognitive tasks and permitted assistance across the entire sign-in process. |
| [4.1.2 A](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) · exposed control semantics | Y / Y | H control API; K supplied labels and HTML | Inspect name/role/state and test with VoiceOver. If reveal is added, expose its action/state, preserve entry/focus, and do not announce the entire value without the person's deliberate request. |
| [4.1.3 AA](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) · announced outcomes | Y / Y | H notifications; K result text/HTML status | Success, refusal, verification mismatch and batch progress are conveyed without hunting for a new visual message. A focus-taking modal is tested as a dialog; a log alone does not establish announcement. |

## Interpretations that affect the design

**Paste and reveal are different requirements.** W3C's
[authentication guidance](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html)
discusses both, but a reveal toggle is not an unconditional AA requirement.
Its absence alone does not prove a failure. It remains a useful improvement
for checking a long pasted value. If chosen, the toggle must itself be
operable and named; its state and the destination must be clear. Whether the
palette API can do this at VS Code 1.134.0 is Surveyor's pending evidence.

**Hidden-tab clearing needs a deliberate recovery design.** The proposed
“no retained hidden context” rule protects the value path, but can also erase
work when someone switches to a provider page or another editor tab. Do not
resolve that tension by automatically persisting secrets or by requiring
unexplained repeated entry. Define the lifecycle, warn before deliberate
clearing where possible, retain harmless names/destinations where appropriate,
and test the recovery. The exact host lifecycle is Surveyor's source question.
[Redundant-entry guidance](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html)
allows specific exceptions; it does not exempt the entire form because one
field contains a secret.

**No new confirmation modal is mandated for every save.** The scope and
alternatives in [3.3.4](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html)
need an operation-by-operation assessment. Superseding a working configuration
deserves a meaningful review and recovery route. The current question is a
starting safeguard; it has not been assessed with assistive technology.

**Plain explanations are Keyhole's job.** WCAG AA does not make a reading-level
claim for the text. Still, a novice cannot choose well if the only instruction
is “fix git.” The recommendation/why work already open in ADR-0002 belongs
with the label, error and correction checks above. Do not convert stylistic
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
| Keyboard and focus | Invoke command without mouse; choose folder; enter valid/invalid names; paste dummy value; cancel at each stage; supersede a dummy existing value. Exercise reveal/tab/batch only after built. Include leave/return to workbench. | Ordered actions, visible focus, cancellation/write outcome and any unreachable control. |
| VoiceOver | Navigate all controls and explanatory text. Check errors before/after correction, each modal's question/details/actions, and success/refusal/mismatch notices. If reveal exists, inspect its state without assuming a particular spoken password behavior. | Actual announcements and accessible names/roles/states, with only fake values; identify missed or confusing information. |
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
   nonsecret distinguishing context if needed. Missing `title` alone is not
   a demonstrated failure.
2. **Design correction and review paths** (3.3.1/3/4/7). Identify the bad
   field and safe correction without reproducing its value; preserve valid
   work during the same activity where appropriate. Decide batch partial-write
   behavior and explain it before submission. Do not call “old line retained”
   an accessible undo without a usable route.
3. **Finish the keyboard and focus contract** (2.1.1/2, 2.4.3/7/11,
   2.5.2/3/8, 4.1.2). The proposed reveal and row actions need names, state,
   keyboard activation, appropriate targets and focus recovery. Choose the
   palette implementation after Surveyor's version evidence.
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
list of confirmed failures. The research supports option A in QST-A11Y-TARGET
with the bounded target wording above; it does not decide the reveal design,
batch-entry scope, or release order for Jérémie.
