#!/usr/bin/env bash
# Purpose: Surveyor 5.1, 2026-10-24. ADR-0010 wants a value in .claude/settings.local.json
# (`env`) to reach an MCP server Claude Code starts. The documentation says settings `env`
# reaches "the subprocesses Claude Code starts" and that `${NAME}` in .mcp.json expands from
# the environment; this checks both on the installed Claude Code without any API call:
# a throwaway project registers a stdio "server" that only writes its environment and its
# expanded argument to files and exits. `claude mcp list` runs its health check, which spawns
# the server. The project approves its own .mcp.json server through enabledMcpjsonServers in
# settings.local.json, so nothing outside the scratch folder is touched. Values are dummies.
#
# Usage: bash scripts/ephemeral/2026-10-24-claude-mcp-env-probe.sh [scratch-dir]
set -u
BASE="${1:-/private/tmp/claude-501/-Users-jlumbroso-Programming-porthole/9aa888fb-6cbc-44ee-8a1b-c5e87e556ead/scratchpad}"
D="$BASE/mcp-env-probe"
rm -rf "$D"; mkdir -p "$D/.claude"
cat > "$D/probe-server.sh" <<'EOF'
#!/bin/sh
# Not an MCP server: it records what it was started with, then exits.
env | sort > "$1"
printf '%s\n' "$2" > "$1.arg"
pwd > "$1.cwd"
exit 1
EOF
chmod +x "$D/probe-server.sh"
cat > "$D/.claude/settings.local.json" <<EOF
{
  "env": { "KEYHOLE_PROBE_TOKEN": "probe-not-a-secret-from-settings-local" },
  "enabledMcpjsonServers": ["keyhole-probe"]
}
EOF
cat > "$D/.mcp.json" <<EOF
{
  "mcpServers": {
    "keyhole-probe": {
      "type": "stdio",
      "command": "$D/probe-server.sh",
      "args": ["$D/server-env.txt", "\${KEYHOLE_PROBE_TOKEN:-UNSET-IN-EXPANSION}"]
    }
  }
}
EOF
echo "=== claude mcp list (runs the health check, which spawns the server) ==="
( cd "$D" && claude mcp list < /dev/null 2>&1 | head -20 )
echo "=== claude mcp get keyhole-probe ==="
( cd "$D" && claude mcp get keyhole-probe < /dev/null 2>&1 | head -20 )
echo "=== step 2: local scope (no approval needed) and env through --settings (not repository-controlled) ==="
# The project-scope entry stays "Pending approval" because this folder was never trusted
# (documented: a never-trusted folder cannot approve its own servers), and the same trust
# rule gates `env` from project and local settings. So: register the server at LOCAL scope
# (stored in ~/.claude.json under this folder's path; removed below) and give the variable
# through a command-line settings file, to see the mechanism itself.
cat > "$D/cli-settings.json" <<EOF
{ "env": { "KEYHOLE_PROBE_TOKEN": "probe-not-a-secret-from-cli-settings" } }
EOF
( cd "$D" && claude mcp add-json -s local keyhole-probe-local "{\"type\":\"stdio\",\"command\":\"$D/probe-server.sh\",\"args\":[\"$D/server-env.txt\",\"\${KEYHOLE_PROBE_TOKEN:-UNSET-IN-EXPANSION}\"]}" < /dev/null 2>&1 | head -5 )
( cd "$D" && claude --settings "$D/cli-settings.json" mcp list < /dev/null 2>&1 | grep -i 'keyhole-probe' | head -4 )
( cd "$D" && claude mcp remove -s local keyhole-probe-local < /dev/null 2>&1 | head -3 )
echo "=== what the server saw ==="
if [ -f "$D/server-env.txt" ]; then
  echo "server was spawned; cwd: $(cat "$D/server-env.txt.cwd")"
  echo "expanded arg: $(cat "$D/server-env.txt.arg")"
  echo "KEYHOLE_PROBE_TOKEN in server env: $(grep -c '^KEYHOLE_PROBE_TOKEN=' "$D/server-env.txt")"
  grep '^KEYHOLE_PROBE_TOKEN=\|^CLAUDE_PROJECT_DIR=' "$D/server-env.txt"
  echo "env var count: $(wc -l < "$D/server-env.txt")"
else
  echo "server was NOT spawned (no env file written)"
fi

# --- Outcome (Surveyor 5.1, 2026-10-24, Claude Code native 2.1.304, darwin-arm64) ---------
# Step 1: the project-scope server from .mcp.json stayed "⏸ Pending approval (run `claude` to
#   approve)" although .claude/settings.local.json listed it in enabledMcpjsonServers: the
#   scratch folder was never trusted, and a never-trusted folder cannot approve its own servers
#   (documented). The health check did not spawn it. `claude mcp get` shows args unexpanded.
# Step 2: the same server at LOCAL scope needed no approval and was spawned by the health check
#   (it exited on purpose: "Failed to connect — CONNECTION_CLOSED"). With the variable given
#   through `claude --settings <file>` (the settings `env` mechanism, outside any repository
#   file): the server's environment contained KEYHOLE_PROBE_TOKEN with that value, the
#   `${KEYHOLE_PROBE_TOKEN:-UNSET-IN-EXPANSION}` argument arrived EXPANDED to the value, the
#   server's cwd was the project folder, and CLAUDE_PROJECT_DIR was set to it. 62 variables.
# Conclusion: a settings `env` value reaches a stdio MCP server both as its process environment
#   and as the source of `${NAME}` expansion in .mcp.json; for .claude/settings.local.json the
#   same mechanism applies once the folder is trusted (its `env` and its approvals are gated by
#   trust, documented and here observed for the approvals). The local-scope entry was removed.
# Recorded in docs/reviews/2026-10-24-mcp-destination-matrix-pinned-reading.md.
