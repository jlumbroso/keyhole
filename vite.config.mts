import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// One file for both the bundle and the tests, after vscode-adrs-for-ai (ADR-0002).
export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/extension.ts'),
      formats: ['cjs'],
      fileName: () => 'extension.js',
    },
    rollupOptions: {
      // `vscode` must stay an unresolved require: the real VS Code host injects it at runtime.
      external: ['vscode', /^node:/],
    },
    outDir: 'dist',
    emptyOutDir: true, // tsc-only builds left stale files in dist/ that later shipped (ADR-0002)
    sourcemap: false, // source maps leaked into the house's other VSIX (ADR-0002)
    minify: false,
    target: 'node20',
    ssr: true,
  },
  test: {
    include: ['src/test/**/*.test.ts'],
    // The mock is aliased HERE, in the test block only, never in a top-level
    // `resolve.alias`, so it can never leak into `vite build`.
    alias: {
      vscode: resolve(import.meta.dirname, 'src/test/helpers/vscodeMock.ts'),
    },
    // `npm run test:coverage`, and the Vitest extension's "Run with Coverage".
    // The provider is a pinned devDependency (@vitest/coverage-v8, same version
    // as vitest): without it, a coverage run dies with MISSING DEPENDENCY.
    // Measured: the extension's own code. Not measured: the tests and the
    // mock, which would only inflate the number.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/test/**'],
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
    },
  },
});
