// A model's request for a secret, by name (ADR-0005): a link such as
//   vscode://jlumbroso.keyhole/v1/request?name=NEON_API_KEY&why=…&where=…
// opened from any terminal. The link never carries a value: every key not on
// the list is refused, and the refusal says why. Copied from Porthole's
// `src/outsideLinks.ts`, not shared (ADR-0001); one change: `name` may repeat,
// in order, for a sequence (an SMTP host, user and password). The verb and the
// keys are provisional until the naming review rules.

export const REQUEST_PATHS = ['/v1/request'];
export const LINK_KEYS = ['name', 'why', 'where', 'repo'];
/** Keys a value could hide behind: refused with the first law's reason rather than "unknown". */
const VALUE_LIKE = /^(value|val|v|secret|token|key|apikey|api_key|password|pass|pwd|credential|credentials)$/i;

export interface LinkRequest {
  names: string[];
  why?: string;
  where?: string;
  repo?: string;
}

export type ParsedLink = { request: LinkRequest } | { refused: string };

/**
 * The parameters of a query VS Code has already percent-decoded (Porthole's
 * reading of VS Code's `uri.ts`): nothing is decoded again, so `+` and `%` in
 * the assistant's words survive, and a parameter starts only where `&key=`
 * does. Text containing `&` followed by letters and `=` cannot be sent.
 */
export function readQuery(query: string): Array<[string, string]> {
  const params: Array<[string, string]> = [];
  const starts = [...query.matchAll(/(?:^|&)([A-Za-z_]+)=/g)];
  for (const [index, start] of starts.entries()) {
    const from = start.index + start[0].length;
    const to = index + 1 < starts.length ? starts[index + 1].index : query.length;
    params.push([start[1], query.slice(from, to)]);
  }
  return params;
}

/** Reads a link VS Code handed to Keyhole; only the shape is checked here, the record checks the rest. */
export function parseRequestLink(uri: { path: string; query: string }): ParsedLink {
  if (!REQUEST_PATHS.includes(uri.path)) {
    return { refused: /^\/v\d+\//.test(uri.path) && !uri.path.startsWith('/v1/')
      ? `this link is for a newer version of Keyhole (${uri.path})`
      : `Keyhole does not understand ${uri.path}; it can record a request for a secret by name (/v1/request?name=…)` };
  }
  const params = readQuery(uri.query);
  const valueLike = params.find(([key]) => VALUE_LIKE.test(key));
  if (valueLike) {
    return { refused: `the link has a "${valueLike[0]}" parameter, and a link never carries a value: it passes through the conversation and the shell's history. Ask for the name only; the person types the value in Keyhole's masked box` };
  }
  const unknown = params.map(([key]) => key).filter(key => !LINK_KEYS.includes(key));
  if (unknown.length > 0) { return { refused: `the link has ${unknown.join(', ')}, which Keyhole does not know; it takes ${LINK_KEYS.join(', ')}` }; }
  for (const single of ['why', 'where', 'repo']) {
    if (params.filter(([key]) => key === single).length > 1) { return { refused: `the link gives ${single} twice` }; }
  }
  const names = params.filter(([key]) => key === 'name').map(([, value]) => value);
  if (names.length === 0) { return { refused: 'the link names no variable (expected ?name=…)' }; }
  const get = (key: string) => params.find(([k]) => k === key)?.[1];
  return { request: { names, why: get('why'), where: get('where'), repo: get('repo') } };
}
