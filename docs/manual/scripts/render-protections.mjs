// Rebuild only the existing Markdown chapter's HTML fragment.
// Run from the Keyhole repository: node docs/manual/scripts/render-protections.mjs
// Uses marked already installed by the extension's locked development tooling.
// The publisher has no Node dependency; it checks this snapshot against the Markdown.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('keeping-secrets-out-of-the-conversation.md', root), 'utf8');
const fragment = marked.parse(source).replace(/^<h1>[^]*?<\/h1>\s*/, '').replace(/<h([2-4])>([^]*?)<\/h\1>/g, (_, level, text) => {
  const id = text.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return '<h' + level + ' id="' + id + '">' + text + '</h' + level + '>';
});
const destination = new URL('content/keeping-secrets-out-of-the-conversation.html', root);
writeFileSync(destination, '<!-- Generated from the sibling Markdown chapter; edit that source, then run render-protections.mjs. -->\n' + fragment);
console.log(fileURLToPath(destination));
