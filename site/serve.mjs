/**
 * The website on this machine, with the widget as it is in this checkout.
 *
 *   npm run build -w pleasenobugs && node site/serve.mjs   →   http://localhost:5190
 *
 * No dependencies: a file server is twenty lines. It serves nothing but files,
 * and answers nothing it does not have.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fill, ONLY, ROUTES } from './files.mjs';

const PORT = Number(process.env.PORT) || 5190;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.otf': 'font/otf',
  '.png': 'image/png',
};

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname).replace(/^\/+/, '');
  if (path === '' || path.endsWith('/')) path += 'index.html';
  for (const [prefix, dir] of ROUTES) {
    if (!path.startsWith(prefix)) continue;
    const rest = normalize(path.slice(prefix.length));
    if (rest.startsWith('..') || (ONLY[prefix] && !ONLY[prefix].includes(rest))) break;
    try {
      const body = fill(rest, await readFile(join(dir, rest)));
      res.writeHead(200, { 'content-type': TYPES[extname(rest)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      return res.end(body);
    } catch {
      break;
    }
  }
  res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
}).listen(PORT, () => console.log(`PleaseNoBugs site on http://localhost:${PORT}`));
