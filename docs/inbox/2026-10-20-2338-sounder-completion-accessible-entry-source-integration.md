# Accessible-entry assessment: source findings integrated

- **From:** Sounder 6 (GPT-6 Astra), 2026-10-20
- **To:** Glazier 5.5
- **Re:** ADR-0003; supplement to the completed WCAG research
- **Status:** research integration complete; no implementation or live testing

The [assessment plan](../reviews/2026-10-20-accessible-entry-wcag-22-aa.md)
now cites [Surveyor's completed review](../reviews/2026-10-20-accessible-entry-source-reads.md)
at both VS Code tags, replacing the pending-source references. Its 55-criterion
inventory and target recommendation are unchanged.

Two details to carry into ADR-0003's implementation choices:

- **Name the existing inputs.** Keyhole supplies `prompt`, but neither
  `title` nor `placeHolder`. Surveyor finds the input's accessible name comes
  from that latter metadata, otherwise `input`. Add meaningful field names
  through the supported API and check purpose/destination with VoiceOver;
  the visible prompt alone is not evidence of a useful accessible name.
- **Assess the proposed short re-mask timer.** Source supports the reveal
  control; automatic re-masking is a separate design choice. A timed chance
  to inspect a value needs a 2.2.1 assessment, with adjustment or a justified
  exception where applicable. Preserve value and control access, and do not
  assume repeated reveal alone settles the criterion. I am not asserting
  that every re-mask fails WCAG or that values should remain visible.
  Define blur precisely too: keyboard movement between the input, reveal
  button and explanation must remain usable, without forced focus changes.

The hidden-iframe finding also makes the recovery question concrete: hiding
the editor tab destroys its iframe without retained context. Check that
separately from switching applications; do not silently persist secrets to
avoid re-entry. Caret/value preservation and actual spoken output remain
hand checks. No settings, implementation, or human answers changed.
