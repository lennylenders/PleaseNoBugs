import { randomUUID } from 'node:crypto';
import express from 'express';
import { rateLimit } from './limit.js';
import type { ProjectStats, Store, TelemetryRow } from './store.js';

/**
 * How many bugs and ideas PleaseNoBugs has carried, and how many were fixed or
 * built. That is the whole of what leaves a server, once a day.
 *
 * **What is sent**, per project: its name, how many bugs and ideas it has, and
 * how many of each an owner marked done. Plus a random id for the installation,
 * so a server is not counted twice, and the version. **Never** a post's text,
 * a wallet address, a display name, a vote or an origin.
 *
 * **On unless switched off** (`PNB_TELEMETRY=off`), and said out loud at start
 * so nobody has to read the source to find out. Hidden posts are not counted:
 * those are spam an owner took down, not feedback.
 *
 * The counts are cumulative, so the collector keeps only the latest report per
 * installation and project, and a report sent twice changes nothing.
 */

/**
 * Where reports go unless `PNB_TELEMETRY_URL` says otherwise: the makers'
 * server, which collects with `PNB_COLLECT=on`. Every published version keeps
 * sending here for as long as it runs, so this Railway service must keep its
 * name and its domain.
 */
export const DEFAULT_TELEMETRY_URL = 'https://pleasenobugs-production.up.railway.app/telemetry';

export const TELEMETRY_EVERY_MS = 24 * 60 * 60 * 1000;
/** The first report waits a minute, so a crash loop does not send one per restart. */
const FIRST_AFTER_MS = 60_000;

export interface TelemetryReport {
  instance: string;
  version: string;
  projects: (ProjectStats & { name: string })[];
}

/** This installation's id, made on first use and kept in the database. */
export async function instanceId(store: Store): Promise<string> {
  const known = await store.getMeta('instance');
  if (known) return known;
  const id = randomUUID();
  await store.setMeta('instance', id);
  return id;
}

/** Everything a report would say, so it can be logged before it is sent. */
export async function buildReport(store: Store, version: string): Promise<TelemetryReport> {
  const projects = await store.projects();
  return {
    instance: await instanceId(store),
    version,
    projects: await Promise.all(projects.map(async (p) => ({ name: p.name, ...(await store.projectStats(p.id)) }))),
  };
}

/** The line a server prints at start, saying exactly what it sends and how to stop it. */
export function telemetryNotice(url: string): string {
  return (
    `[pleasenobugs] telemetry: once a day this server sends ${url} each project's name and how many ` +
    'bugs and ideas it has, and how many of each are done. Never post text, wallets or names of people. ' +
    'Set PNB_TELEMETRY=off to stop.'
  );
}

/** Send one report. Answers whether it arrived; never throws. */
export async function sendReport(url: string, report: TelemetryReport, doFetch: typeof fetch = fetch): Promise<boolean> {
  try {
    const res = await doFetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(report),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Report now-ish and then once a day, for as long as the process runs.
 * Answers a function that stops it. The timers are `unref`'d so they never
 * keep a process alive that is otherwise done.
 */
export function startTelemetry(options: { store: Store; url: string; version: string }): () => void {
  const tick = async () => {
    const report = await buildReport(options.store, options.version);
    await sendReport(options.url, report);
  };
  const first = setTimeout(() => void tick(), FIRST_AFTER_MS);
  const every = setInterval(() => void tick(), TELEMETRY_EVERY_MS);
  first.unref();
  every.unref();
  return () => {
    clearTimeout(first);
    clearInterval(every);
  };
}

// ---- The collecting side ----

const MAX_PROJECTS = 20;
const MAX_COUNT = 10_000_000;

/**
 * A report as received, or null. Strict, because anybody can post one: these
 * are vanity numbers, and the most a liar can do is inflate them, but nothing
 * odd gets stored.
 */
export function readReport(body: unknown): TelemetryReport | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (typeof b.instance !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(b.instance)) return null;
  if (typeof b.version !== 'string' || b.version.length > 20) return null;
  if (!Array.isArray(b.projects) || b.projects.length > MAX_PROJECTS) return null;
  const count = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= MAX_COUNT ? v : null);
  const projects: TelemetryReport['projects'] = [];
  for (const raw of b.projects) {
    if (!raw || typeof raw !== 'object') return null;
    const p = raw as Record<string, unknown>;
    const name = typeof p.name === 'string' ? p.name.trim() : '';
    const bugs = count(p.bugs);
    const ideas = count(p.ideas);
    const bugsDone = count(p.bugsDone);
    const ideasDone = count(p.ideasDone);
    if (!name || name.length > 60 || bugs === null || ideas === null || bugsDone === null || ideasDone === null) {
      return null;
    }
    if (bugsDone > bugs || ideasDone > ideas) return null;
    projects.push({ name, bugs, ideas, bugsDone, ideasDone });
  }
  return { instance: b.instance, version: b.version, projects };
}

export interface TelemetrySummary {
  /** Installations heard from in the last 30 days. */
  installations: number;
  /** Projects ever reported, across every installation. */
  projects: number;
  bugs: number;
  ideas: number;
  bugsDone: number;
  ideasDone: number;
}

const ACTIVE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * The totals across everything ever reported. A server that went quiet keeps
 * its numbers in the totals, because what it carried was still carried; it
 * only stops counting as an installation.
 */
export function summarize(rows: TelemetryRow[], now: number): TelemetrySummary {
  const active = new Set(rows.filter((r) => now - r.receivedAt <= ACTIVE_MS).map((r) => r.instance));
  const sum = (k: keyof ProjectStats) => rows.reduce((n, r) => n + r[k], 0);
  return {
    installations: active.size,
    projects: rows.length,
    bugs: sum('bugs'),
    ideas: sum('ideas'),
    bugsDone: sum('bugsDone'),
    ideasDone: sum('ideasDone'),
  };
}

/**
 * The two routes of a collecting server (`PNB_COLLECT=on`).
 *
 * `POST /telemetry` takes a report. `GET /telemetry/summary` answers the
 * totals and nothing per project: the names of other people's apps are not
 * published here. They are read on the server itself with
 * `pleasenobugs-server telemetry`.
 */
export function telemetryRouter(store: Store, now: () => number = Date.now): express.Router {
  const router = express.Router();
  router.use(express.json({ limit: '16kb' }));

  router.post(
    '/telemetry',
    rateLimit({ windowMs: 60 * 60_000, max: 30, name: 'telemetry' }),
    (req, res, next) => {
      const report = readReport(req.body);
      if (!report) {
        res.status(400).json({ error: 'bad_request' });
        return;
      }
      const at = now();
      Promise.all(
        report.projects.map((p) =>
          store.putTelemetry({ ...p, project: p.name, instance: report.instance, version: report.version, receivedAt: at }),
        ),
      )
        .then(() => res.json({ ok: true }))
        .catch(next);
    },
  );

  router.get('/telemetry/summary', (_req, res, next) => {
    store
      .telemetry()
      .then((rows) => res.json(summarize(rows, now())))
      .catch(next);
  });

  return router;
}
