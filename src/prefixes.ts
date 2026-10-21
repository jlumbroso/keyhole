// The public tags services put at the start of their tokens. They are the same
// for every token of a kind and published by the service, so a keyprint always
// shows them (Jérémie's invariant, ADR-0002, QST-KEYPRINT-LEGIBLE). Until the
// service cards exist (ADR-0001's build order), this list stands in for the
// "format" fact each card will carry; only prefixes read in the services' own
// documentation belong here, longest first within a family.

export const PUBLIC_PREFIXES: readonly string[] = [
  'github_pat_', 'ghp_', 'gho_', 'ghu_', 'ghs_', 'ghr_', // GitHub
  'glpat-', // GitLab
  'sk-ant-', // Anthropic
  'sk-proj-', // OpenAI, project keys
  'sk_live_', 'sk_test_', 'rk_live_', 'rk_test_', // Stripe, secret and restricted keys
  'xoxb-', 'xoxp-', 'xapp-', // Slack
  'npm_', // npm
  'hf_', // Hugging Face
  'sk-', // OpenAI and others, last: the shortest
];

/** The public prefix a value starts with, if any; never the whole value. */
export function publicPrefixOf(value: string): string {
  const found = [...PUBLIC_PREFIXES].sort((a, b) => b.length - a.length).find(prefix => value.startsWith(prefix));
  return found !== undefined && value.length > found.length ? found : '';
}
