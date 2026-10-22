import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// The MCP server's own bundle, dist/mcp-server.js (ADR-0005), built after the
// extension's. A separate build, not a second entry in vite.config.mts:
// two entries would share `names.ts` through a chunk file, which the package
// allowlist (scripts/check-package-contents.mjs) would rightly refuse.
export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/mcp/main.ts'),
      formats: ['cjs'],
      fileName: () => 'mcp-server.js',
    },
    rollupOptions: {
      external: [/^node:/],
      output: { entryFileNames: 'mcp-server.js' }, // ssr mode ignores lib.fileName
    },
    outDir: 'dist',
    emptyOutDir: false, // dist/extension.js was built first and stays
    sourcemap: false,
    minify: false,
    target: 'node20',
    ssr: true,
  },
});
