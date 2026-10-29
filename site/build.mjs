/**
 * The website as plain files in `site/_site`, which GitHub Pages publishes.
 *
 *   npm run build && node site/build.mjs
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fill, ONLY, ROUTES, VERSION } from './files.mjs';

const out = fileURLToPath(new URL('./_site/', import.meta.url));
await rm(out, { recursive: true, force: true });

for (const [prefix, dir] of ROUTES) {
  const files = ONLY[prefix] ?? (await readdir(dir, { recursive: true, withFileTypes: true }))
    .filter((e) => e.isFile())
    .map((e) => relative(dir, join(e.parentPath ?? e.path, e.name)));
  for (const f of files) {
    const to = join(out, prefix, f);
    await mkdir(dirname(to), { recursive: true });
    await writeFile(to, fill(f, await readFile(join(dir, f))));
  }
}
console.log(`Site written to ${out}, handing out pleasenobugs@${VERSION}`);
