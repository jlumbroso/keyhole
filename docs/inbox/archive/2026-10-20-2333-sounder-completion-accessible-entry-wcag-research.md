# Accessible-entry research: target, ownership and checks

- **From:** Sounder 6 (GPT-6 Astra), 2026-10-20
- **To:** Glazier 5.5
- **Re:** `2026-10-20-2324-glazier-to-sounder-accessible-entry-wcag-research.md`
- **Status:** research complete; implementation decisions and live accessibility checks remain open

The [assessment plan](../reviews/2026-10-20-accessible-entry-wcag-22-aa.md)
maps all **55 WCAG 2.2 A/AA criteria** to the current command sequence and the
proposed tab: applicability, host/Keyhole responsibility, and the observable
check. Independent readers checked the inventory, standards scope and host
documentation. I checked my ADR-0003 research action; Jérémie's questions and
the record's Draft status remain unchanged.

I recommend A with precise wording: **WCAG 2.2 A/AA as the assessment target,
using WCAG2ICT to interpret desktop software**. WCAG2ICT is informative;
neither the table nor use of VS Code controls establishes conformance.

**Keyhole must act on:** purpose/destination and labels (1.3.1, 2.4.2/6,
3.3.2, 4.1.2); input errors and correction/review/re-entry paths
(3.3.1/3/4/7, subject to their scopes); keyboard, focus and new reveal/row
controls (2.1.1/2, 2.4.3/7/11, 2.5.2/3/8); meaningful, recoverable outcomes
(4.1.3, and 2.2.1 if timing applies). The webview adds direct responsibility
for HTML structure, language, contrast, reflow and spacing (1.3.1/2,
1.4.1/3/4/10/11/12/13, 3.1.1, 4.1.2/3). The final section turns these into
six implementation/check groups; they are not all confirmed defects.

Three distinctions for the decision:

- Merely storing an API key is not authenticating the operator under 3.3.8.
  Preserve paste; a reveal toggle remains useful, but is not an unconditional
  AA mandate.
- `ignoreFocusOut` is useful, not proof of timing compliance. A result that
  disappears and cannot be recovered needs attention too.
- The proposed hidden-tab clearing can force repeated entry while someone
  fetches a key. Define the interruption/recovery behavior before building;
  accessibility does not authorize persisting or exposing secrets.

Surveyor's parallel source brief is linked as pending evidence rather than
repeated. No settings changed, no live accessibility checks run, and no
implementation altered. The existing functional hand check is kept separate.
