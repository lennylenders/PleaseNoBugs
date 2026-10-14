import { defineConfig } from 'vite';

/**
 * The ES module build: `import 'pleasenobugs'` and `import ... from
 * 'pleasenobugs/client'`.
 *
 * Everything is bundled in, Preact and core included. A host app on React 18,
 * Vue or Svelte then never has to reconcile a second copy of anything, and the
 * widget cannot break because the host upgraded a shared dependency. Preact is
 * 4 kB of the result.
 */
export default defineConfig({
  esbuild: { jsx: 'automatic', jsxImportSource: 'preact' },
  build: {
    target: 'es2020',
    emptyOutDir: true,
    lib: {
      entry: { index: 'src/index.ts', client: 'src/client.ts' },
      formats: ['es'],
    },
    rollupOptions: { output: { entryFileNames: '[name].js', chunkFileNames: 'chunks/[name]-[hash].js' } },
  },
});
