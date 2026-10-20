#!/usr/bin/env bash
# Purpose: Surveyor 5.1, 2026-10-20. keyhole's ADR-0001 rests on git answering two checks
# before a secret is written: "is .env ignored?" (git check-ignore) and "is it tracked
# anyway?" (git ls-files --error-unmatch). This builds a throwaway repository with a root
# .gitignore, a nested .gitignore, a global excludes file, an untracked-but-ignored file, a
# tracked-but-ignored file and a missing file, and prints each command's exit code and output
# for every case, from the root and from a subdirectory. Read-only outside the throwaway
# repository, which lives under the directory given as $1 (default: the session scratchpad).
#
# Usage: bash scripts/ephemeral/2026-10-20-git-ignore-checks-probe.sh [scratch-dir]
set -u
BASE="${1:-/private/tmp/claude-501/-Users-jlumbroso-Programming-porthole/9aa888fb-6cbc-44ee-8a1b-c5e87e556ead/scratchpad}"
D="$BASE/gitprobe"
rm -rf "$D"
mkdir -p "$D/sub/deep" "$D/home"
cd "$D" || exit 1
git init -q .
git config user.email probe@example.invalid
git config user.name probe
git --version

echo tracked > tracked.txt
git add tracked.txt && git commit -qm init
printf '.env\n' > .gitignore                 # root rule: the literal name, any depth
printf 'secret.txt\n' > sub/.gitignore       # nested rule
printf '*.global\n' > home/excludes          # global excludes (core.excludesFile)
git config core.excludesFile "$D/home/excludes"
touch .env sub/.env sub/deep/.env sub/secret.txt sub/deep/secret.txt a.global untracked.txt
echo tracked-but-ignored > sub/deep/tracked.env
git add -f sub/deep/tracked.env && git commit -qm add  # tracked despite a rule that will match it
printf '*.env\n' >> .gitignore               # now tracked.env matches a rule too

run() { local out; out=$("$@" 2>&1); echo "  exit $? : ${out:-<no output>}   <- $*"; }

echo '--- git check-ignore -v (0 = ignored, 1 = not ignored, 128 = error)'
for f in .env sub/.env sub/deep/.env sub/secret.txt sub/deep/secret.txt a.global untracked.txt tracked.txt sub/deep/tracked.env missing.env; do
  run git check-ignore -v -- "$f"
done
echo '--- the same for the tracked-but-ignored file, with --no-index'
run git check-ignore -v --no-index -- sub/deep/tracked.env
echo '--- git check-ignore -q (what keyhole would call)'
run git check-ignore -q -- .env
run git check-ignore -q -- sub/deep/tracked.env
echo '--- git ls-files --error-unmatch (0 = tracked, 1 = not tracked)'
for f in tracked.txt untracked.txt .env sub/deep/tracked.env missing.env; do
  run git ls-files --error-unmatch -- "$f"
done
echo '--- from a subdirectory: paths are relative to the cwd, not the repo root'
cd sub/deep || exit 1
run git check-ignore -v -- .env
run git ls-files --error-unmatch -- tracked.env
run git ls-files --error-unmatch -- .env
echo '--- outside any repository'
cd "$BASE" || exit 1
run git check-ignore -q -- .env
run git ls-files --error-unmatch -- .env

# --- Outcome (Surveyor 5.1, 2026-10-20, git 2.52.0) ----------------------------------------
# check-ignore: exit 0 and the matching rule for every ignored path, including a nested
#   .gitignore, core.excludesFile, and a path that does not exist yet; exit 1 for a file that
#   is NOT ignored; exit 1 also for a file that is TRACKED even though a rule matches it
#   (`--no-index` then shows the rule); exit 128 outside a repository.
# ls-files --error-unmatch: exit 0 (prints the path) for a tracked file; exit 1 with
#   "did not match any file(s) known to git" for untracked, ignored or missing files.
# Both take paths relative to the current directory, not the repository root.
# Decision this feeds: keyhole must ask "tracked?" (ls-files) BEFORE "ignored?" (check-ignore),
# treat 128 as "no repository, refuse", and run git with cwd = the workspace folder.
# Recorded in docs/reviews/2026-10-20-adr-0001-source-check.md.
