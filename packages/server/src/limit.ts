import type express from 'express';

/**
 * Rate limiting: how often one caller may knock.
 *
 * A fixed window per key rather than a token bucket, because the point is a
 * ceiling on automation, not smooth traffic shaping. Hand-rolled and in memory:
 * a dependency that reaches for Redis to count to thirty is more machinery than
 * the job needs. It resets on a restart and is per process, which is fine for
 * what it is: a brake on scripts. The rules that matter (one vote per wallet,
 * posts per day) are counted from stored rows and survive both.
 *
 * @example
 * app.use(rateLimit({ windowMs: 60_000, max: 300, name: 'all' }));
 * router.post('/posts', rateLimit({ windowMs: 900_000, max: 10, name: 'post', by: wallet }), handler);
 */

type Window = { count: number; resetAt: number };

const SWEEP_MS = 60_000;

export function rateLimit({
  windowMs,
  max,
  name,
  by,
}: {
  windowMs: number;
  max: number;
  /** Shown in the log line when somebody hits it. */
  name: string;
  /**
   * What to count per. Defaults to the caller's IP. A limiter runs before the
   * proof is verified, so a wallet read from a header here is the caller's own
   * word: this brakes a script, it does not decide anything.
   */
  by?: (req: express.Request) => string | undefined;
}): express.RequestHandler {
  const windows = new Map<string, Window>();
  let sweptAt = 0;

  return (req, res, next) => {
    const now = Date.now();
    if (now - sweptAt > SWEEP_MS) {
      sweptAt = now;
      for (const [key, w] of windows) if (w.resetAt <= now) windows.delete(key);
    }

    const key = (by ? by(req) : undefined) ?? req.ip ?? 'unknown';
    const window = windows.get(key);
    if (!window || window.resetAt <= now) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    window.count += 1;
    if (window.count > max) {
      const retryAfter = Math.ceil((window.resetAt - now) / 1000);
      // Once per window per key, or a flood would take the logs with it.
      if (window.count === max + 1) {
        console.warn(`[limit] ${name} tripped by ${key} (${max} per ${windowMs}ms)`);
      }
      res.setHeader('retry-after', String(retryAfter));
      return res.status(429).json({ error: 'rate_limited', retryAfter });
    }
    next();
  };
}
