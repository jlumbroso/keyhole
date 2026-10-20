#!/usr/bin/env bash
# Purpose: Surveyor 5.1, 2026-10-20. ADR-0001 asks whether Claude Code accepts comments in
# .claude/settings.local.json (keyhole would like to leave a standard comment beside a
# variable it writes). This builds two throwaway projects under the session scratchpad, one
# with a JSON-with-comments settings.local.json and one with strict JSON, and runs
# `claude doctor` in each, which reads the settings files without starting a conversation.
# It prints each run's output. Nothing here touches a real project or a real secret.
#
# Usage: bash scripts/ephemeral/2026-10-20-claude-settings-comments-probe.sh [scratch-dir]
set -u
BASE="${1:-/private/tmp/claude-501/-Users-jlumbroso-Programming-porthole/9aa888fb-6cbc-44ee-8a1b-c5e87e556ead/scratchpad}"
for variant in jsonc strict; do
  D="$BASE/settings-probe-$variant"
  rm -rf "$D"; mkdir -p "$D/.claude"
  if [ "$variant" = jsonc ]; then
    cat > "$D/.claude/settings.local.json" <<'EOF'
{
  // keyhole wrote KEYHOLE_PROBE_VAR on 2026-10-20 (a comment, to see whether Claude Code accepts one)
  "env": {
    "KEYHOLE_PROBE_VAR": "probe-not-a-secret" /* trailing comment */
  }
}
EOF
  else
    cat > "$D/.claude/settings.local.json" <<'EOF'
{
  "env": {
    "KEYHOLE_PROBE_VAR": "probe-not-a-secret"
  }
}
EOF
  fi
  echo "=== $variant: claude doctor (first 40 lines) ==="
  # macOS has no `timeout`; use GNU coreutils' gtimeout when present, else run bare.
  TO=""; command -v gtimeout >/dev/null 2>&1 && TO="gtimeout 90"
  ( cd "$D" && $TO claude doctor < /dev/null 2>&1 | head -40 )
  echo "exit ${PIPESTATUS[0]:-?}"
done

# --- Outcome (Surveyor 5.1, 2026-10-20, Claude Code native 2.1.304, darwin-arm64) ---------
# jsonc variant: `claude doctor` reports
#   Invalid settings
#   - <project>/.claude/settings.local.json: Invalid or malformed JSON
# strict variant: no "Invalid settings" section; "No installation issues found."
# Conclusion: a `//` or `/* */` comment makes the WHOLE settings.local.json invalid, so a
# comment keyhole left beside a variable would switch off every variable in that file.
# keyhole's standard comment goes in its log only; the JSON file gets no comment.
# Recorded in docs/reviews/2026-10-20-env-loaders-duplicates-and-settings-comments.md.
