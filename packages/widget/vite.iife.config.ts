import { defineConfig } from 'vite';

/**
 * The one-file build for a `<script>` tag, which is how most mini apps will
 * meet this: no bundler, no npm, paste two lines.
 *
 *   <script src="https://unpkg.com/pleasenobugs"></script>
 *   <please-no-bugs project="..." server="..." floating></please-no-bugs>
 *
 * Registers the element on load and puts `PleaseNoBugs` on `window`.
 */
export default defineConfig({
  esbuild: { jsx: 'automatic', jsxImportSource: 'preact' },
  build: {
    target: 'es2020',
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['iife'],
      name: 'PleaseNoBugs',
      fileName: () => 'pleasenobugs.iife.js',
    },
  },
});
