import { readFile } from 'node:fs/promises';
import { serve } from './server';

// The process a model's harness starts (bundled to dist/mcp-server.js; ADR-0005).
// Everything it does is in ./server.ts, which the tests drive directly. The
// one file it reads is Keyhole's cache; see the wall described there.

void serve(process.stdin, process.stdout, { readFile: path => readFile(path, 'utf8'), env: process.env, cwd: process.cwd() })
  .then(() => process.exit(0));
