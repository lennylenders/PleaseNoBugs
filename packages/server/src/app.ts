import express from 'express';
import { rateLimit } from './limit.js';
import { createRouter, type RouterOptions } from './router.js';

export interface AppOptions extends RouterOptions {
  /**
   * How many proxies sit in front of the server, for Express's `trust proxy`.
   * Behind Railway, Fly or a load balancer this is 1, or every caller shares
   * the router's IP and the rate limiter throttles everybody at once.
   */
  trustProxy?: number | boolean;
}

/**
 * A complete server: the router plus a health check, an app-wide rate limit
 * and JSON errors. What `pleasenobugs-server` runs. A developer adding the
 * board to an Express app they already have wants {@link createRouter} instead.
 *
 * @example
 * import { createApp, MemoryStore } from '@pleasenobugs/server';
 * createApp({ store: new MemoryStore() }).listen(8787);
 */
export function createApp(options: AppOptions): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', options.trustProxy ?? false);

  // Well above anything the widget does on its own: it reads the board when
  // it opens and after every write. This is a ceiling on scripts.
  app.use(rateLimit({ windowMs: 60_000, max: 300, name: 'all' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use(createRouter(options));

  app.use((_req, res) => {
    res.status(404).json({ error: 'not_found' });
  });

  // A body that is not JSON, or is too big, is the caller's mistake and says
  // so. Anything else is ours, logged and answered without detail.
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const type = (err as { type?: string } | null)?.type;
    if (type === 'entity.parse.failed' || type === 'entity.too.large') {
      res.status(400).json({ error: 'bad_request' });
      return;
    }
    console.error('[server]', err);
    res.status(500).json({ error: 'internal' });
  });

  return app;
}
