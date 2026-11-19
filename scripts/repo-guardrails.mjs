// The release guardrails a repository needs before its Open VSX workflow can
// publish by trusted publishing (porthole ADR-0012, "The GitHub settings, as
// commands"; applied there by hand on 2026-10-19, and missing here until this
// recipe). Asserts a destination, as `just release` does: each guardrail is
// read first, created only when missing, and read back. Run it again and it
// changes nothing.
//
//   just repo-guardrails            # apply what is missing, then read back
//   just repo-guardrails --check    # read only: say what is in place and what is not
//
// The four guardrails, each undoable in GitHub's Settings, Rules and Environments:
//   1. ruleset "release tags: only an admin creates": only an admin creates a v* tag
//   2. ruleset "release tags: never moved or deleted": nobody moves or deletes a v* tag
//   3. environment "open-vsx": no reviewers, deployments only from chosen refs
//   4. that environment's deployment rule: v* tags only
//
// It runs `gh` with the person's own login; a seat's session may be refused by
// its permission layer (repository security settings), so Jérémie runs it.

import { execFileSync } from 'node:child_process';

const check = process.argv.includes('--check');
const repo = execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'], { encoding: 'utf8' }).trim();

function gh(args, input) {
  const out = execFileSync('gh', ['api', ...args, ...(input ? ['--input', '-'] : [])], { encoding: 'utf8', input: input ? JSON.stringify(input) : undefined, stdio: ['pipe', 'pipe', 'pipe'] });
  return out.trim() ? JSON.parse(out) : undefined;
}
function ghOrMissing(args) {
  try { return gh(args); } catch (err) { if (/HTTP 404/.test(String(err.stderr ?? err.message))) { return undefined; } throw err; }
}

const TAGS = { ref_name: { include: ['refs/tags/v*'], exclude: [] } };
const RULESETS = [
  { name: 'release tags: only an admin creates', target: 'tag', enforcement: 'active', conditions: TAGS,
    bypass_actors: [{ actor_id: 5, actor_type: 'RepositoryRole', bypass_mode: 'always' }], rules: [{ type: 'creation' }] },
  { name: 'release tags: never moved or deleted', target: 'tag', enforcement: 'active', conditions: TAGS,
    bypass_actors: [], rules: [{ type: 'update' }, { type: 'deletion' }] },
];

const report = [];
let missing = 0;
const note = (ok, text) => { report.push(`${ok ? '✓' : '✗'} ${text}`); if (!ok) { missing++; } };

// 1 and 2: the rulesets, matched by name.
const existing = gh([`repos/${repo}/rulesets`]) ?? [];
for (const ruleset of RULESETS) {
  let found = existing.find(candidate => candidate.name === ruleset.name);
  if (!found && !check) { found = gh(['-X', 'POST', `repos/${repo}/rulesets`], ruleset); report.push(`+ created ruleset "${ruleset.name}" (id ${found.id})`); }
  const live = found ? gh([`repos/${repo}/rulesets/${found.id}`]) : undefined;
  note(Boolean(live) && live.enforcement === 'active', `ruleset "${ruleset.name}"${live ? ` (id ${live.id}, ${live.enforcement})` : ': missing'}`);
}

// 3: the environment, no reviewers, deployments only from chosen refs.
let environment = ghOrMissing([`repos/${repo}/environments/open-vsx`]);
const restricted = env => env?.deployment_branch_policy?.custom_branch_policies === true;
const reviewers = env => (env?.protection_rules ?? []).filter(rule => rule.type === 'required_reviewers').length;
if ((!environment || !restricted(environment) || reviewers(environment) > 0) && !check) {
  environment = gh(['-X', 'PUT', `repos/${repo}/environments/open-vsx`], { reviewers: [], deployment_branch_policy: { protected_branches: false, custom_branch_policies: true } });
  report.push('+ set environment "open-vsx": no reviewers, deployments only from chosen refs');
}
note(Boolean(environment) && restricted(environment) && reviewers(environment) === 0,
  `environment "open-vsx"${environment ? `: ${restricted(environment) ? 'restricted to chosen refs' : 'any branch may deploy'}, ${reviewers(environment)} reviewer rule(s)` : ': missing'}`);

// 4: the environment's one rule: v* tags.
const policies = environment ? (ghOrMissing([`repos/${repo}/environments/open-vsx/deployment-branch-policies`])?.branch_policies ?? []) : [];
let tagRule = policies.find(policy => policy.name === 'v*' && policy.type === 'tag');
if (!tagRule && environment && !check) {
  tagRule = gh(['-X', 'POST', `repos/${repo}/environments/open-vsx/deployment-branch-policies`], { name: 'v*', type: 'tag' });
  report.push('+ added the deployment rule: v* tags');
}
note(Boolean(tagRule), `"open-vsx" deploys from v* tags${tagRule ? '' : ': rule missing'}`);

console.log(`${repo} — release guardrails${check ? ' (check only)' : ''}`);
console.log(report.map(line => `  ${line}`).join('\n'));
if (missing > 0) {
  console.log(check ? `${missing} missing: run \`just repo-guardrails\` to apply them.` : `${missing} still missing after applying: read the lines above.`);
  process.exit(1);
}
console.log('All four in place.');
