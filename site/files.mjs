/**
 * Where every published path of the site comes from, shared by `serve.mjs`
 * (while working on it) and `build.mjs` (for GitHub Pages).
 *
 * The widget is this repo's own build, not npm's: the site shows the widget as
 * it is on this commit. The code it hands out points at npm instead, at the
 * version in the widget's package.json (see {@link fill}).
 */
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

export const ROUTES = [
  // [published prefix, folder on disk]
  ['widget/', here('../packages/widget/dist/')],
  ['fonts/', here('../node_modules/@fontsource-variable/mulish/files/')],
  ['', here('./src/')],
];

/** The files under a prefix that the published site needs; everything for `src`. */
export const ONLY = {
  'widget/': ['pleasenobugs.iife.js'],
  'fonts/': ['mulish-latin-wght-normal.woff2'],
};

/** The widget version the copied code loads from unpkg. */
export const VERSION = JSON.parse(readFileSync(here('../packages/widget/package.json'), 'utf8')).version;

/**
 * `%VERSION%` in the site's own pages and scripts, filled in as they are
 * served or built. So the code on the site always names the version that is
 * released with it, never one somebody forgot to change.
 */
export function fill(path, body) {
  if (!['.html', '.js'].includes(extname(path)) || path.includes('pleasenobugs.iife')) return body;
  return Buffer.from(body.toString('utf8').replaceAll('%VERSION%', VERSION));
}
