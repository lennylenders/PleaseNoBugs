import cors from 'cors';
import express from 'express';
import {
  DASHBOARD_PROJECT,
  DAY_MS,
  NAME_MAX,
  POST_ID_MAX,
  cleanContext,
  decodeProof,
  isPostKind,
  isPostStatus,
  normalizeAddress,
  normalizeOrigin,
  type ErrorCode,
  type Me,
  type Project,
} from '@pleasenobugs/core';
import { checkProof } from './auth.js';
import { publicProject, toVisible } from './board.js';
import { rateLimit } from './limit.js';
import {
  cleanName,
  cleanOrigins,
  cleanOwners,
  mergeRules,
  newProject,
  newProjectId,
} from './projects.js';
import type { PostPatch, Store } from './store.js';

export interface RouterOptions {
  store: Store;
  /**
   * Where the dashboard runs. A proof signed for `Project: dashboard` is only
   * accepted from these origins, and only on the project routes. Empty means
   * no dashboard at all, which is the right default for a self-hoster, who
   * creates projects with the CLI.
   */
  dashboardOrigins?: string[];
  /** The clock, so tests can move it. */
  now?: () => number;
}

/** How many answers `GET /answers` hands back. More than anybody will have. */
const ANSWERS_MAX = 10;

/**
 * Everything under `/v1`, as one Express router a developer can mount wherever
 * they like:
 *
 * ```ts
 * app.use('/feedback', createRouter({ store }));   // → /feedback/v1/...
 * ```
 *
 * It brings its own CORS and body parsing, so it works mounted into an app
 * that has neither. The routes and what they answer are `docs/api-v1.md`; the
 * comments here are about *why* each one is the way it is.
 */
export function createRouter(options: RouterOptions): express.Router {
  const { store } = options;
  const now = options.now ?? Date.now;
  const dashboardOrigins = (options.dashboardOrigins ?? []).map(normalizeOrigin);
  const router = express.Router();

  // Any origin may call, and that is safe for one reason: nothing here uses
  // cookies. Who you are is the proof in the Authorization header, and a page
  // cannot borrow somebody else's. The origin rules that *do* matter (which
  // sites may post on which board) are enforced on the proof itself.
  router.use(cors({ origin: true, allowedHeaders: ['content-type', 'authorization'], maxAge: 600 }));
  router.use(express.json({ limit: '32kb' }));

  /** Express 4 does not catch a rejected promise; this hands it to the error handler. */
  const h =
    (fn: (req: express.Request, res: express.Response) => Promise<unknown>): express.RequestHandler =>
    (req, res, next) => {
      fn(req, res).catch(next);
    };

  const fail = (res: express.Response, status: number, error: ErrorCode, extra?: object) =>
    res.status(status).json({ error, ...extra });

  /** The project in the URL, or a 404 already sent. */
  async function project(req: express.Request, res: express.Response): Promise<Project | null> {
    const p = await store.getProject(String(req.params.pid));
    if (!p) fail(res, 404, 'no_project');
    return p;
  }

  type Reader =
    | { kind: 'stranger' }
    | { kind: 'wallet'; address: string; owner: boolean }
    | { kind: 'refused'; status: number; error: ErrorCode };

  /**
   * Who is reading this project's board.
   *
   * No header is a stranger. A header that does not hold up is a refusal, even
   * on a route a stranger could use: the client sent it believing it worked,
   * and silently treating them as a stranger would show them a board where
   * their own posts are not theirs.
   */
  async function reader(req: express.Request, p: Project): Promise<Reader> {
    const check = await checkProof(req.header('authorization'), p.id, req.header('origin'), now());
    if (!check.ok) {
      return check.reason === 'missing'
        ? { kind: 'stranger' }
        : { kind: 'refused', status: 401, error: 'unauthorized' };
    }
    if (!p.origins.includes(check.origin)) {
      return { kind: 'refused', status: 403, error: 'origin_not_allowed' };
    }
    return { kind: 'wallet', address: check.address, owner: p.owners.includes(check.address) };
  }

  /** A signed-in reader, or an error already sent. */
  async function wallet(req: express.Request, res: express.Response, p: Project) {
    const r = await reader(req, p);
    if (r.kind === 'wallet') return r;
    if (r.kind === 'stranger') fail(res, 401, 'unauthorized');
    else fail(res, r.status, r.error);
    return null;
  }

  /** The dashboard's wallet, or an error already sent. */
  async function dashboard(req: express.Request, res: express.Response): Promise<string | null> {
    if (!dashboardOrigins.length) {
      fail(res, 401, 'unauthorized');
      return null;
    }
    const check = await checkProof(req.header('authorization'), DASHBOARD_PROJECT, req.header('origin'), now());
    if (!check.ok) {
      fail(res, 401, 'unauthorized');
      return null;
    }
    if (!dashboardOrigins.includes(check.origin)) {
      fail(res, 403, 'origin_not_allowed');
      return null;
    }
    return check.address;
  }

  /** What one wallet needs to know about itself on one board. */
  async function me(p: Project, address: string, owner: boolean): Promise<Me> {
    const used = await store.countByAuthorSince(p.id, address, now() - DAY_MS);
    const out: Me = { owner, left: Math.max(0, p.rules.perDay - used) };
    const name = (await store.names(p.id, [address])).get(address);
    if (name) out.name = name;
    return out;
  }

  // ---- Reading ----

  router.get(
    '/v1/projects/:pid',
    h(async (req, res) => {
      const p = await project(req, res);
      if (p) res.json(publicProject(p));
    }),
  );

  router.get(
    '/v1/projects/:pid/posts',
    h(async (req, res) => {
      const p = await project(req, res);
      if (!p) return;
      const r = await reader(req, p);
      if (r.kind === 'refused') return fail(res, r.status, r.error);
      const address = r.kind === 'wallet' ? r.address : null;
      const owner = r.kind === 'wallet' && r.owner;

      const rows = await store.posts(p.id, address);
      // Hidden posts reach owners, marked, so hiding can be undone. Everybody
      // else gets a board without them, their authors included.
      const shown = owner ? rows : rows.filter((row) => !row.hidden);
      // One lookup for every author who let their name show, rather than one
      // per post: a board is mostly a handful of people saying several things.
      const named = [...new Set(shown.filter((row) => !row.anon).map((row) => row.author))];
      const names = await store.names(p.id, named);

      res.json({
        project: publicProject(p),
        posts: shown.map((row) => toVisible(row, address, names.get(row.author), owner)),
        ...(r.kind === 'wallet' ? { me: await me(p, r.address, r.owner) } : {}),
      });
    }),
  );

  router.get(
    '/v1/projects/:pid/me',
    h(async (req, res) => {
      const p = await project(req, res);
      if (!p) return;
      const w = await wallet(req, res, p);
      if (w) res.json(await me(p, w.address, w.owner));
    }),
  );

  router.get(
    '/v1/projects/:pid/answers',
    h(async (req, res) => {
      const p = await project(req, res);
      if (!p) return;
      const w = await wallet(req, res, p);
      if (w) res.json({ answers: await store.answersFor(p.id, w.address, ANSWERS_MAX) });
    }),
  );

  // ---- Writing ----

  router.put(
    '/v1/projects/:pid/me',
    h(async (req, res) => {
      const p = await project(req, res);
      if (!p) return;
      const w = await wallet(req, res, p);
      if (!w) return;
      const raw = (req.body ?? {}).name;
      if (typeof raw !== 'string' || raw.trim().length > NAME_MAX) return fail(res, 400, 'bad_request');
      const name = raw.trim() || undefined;
      await store.setName(p.id, w.address, name);
      res.json({ ok: true, ...(name ? { name } : {}) });
    }),
  );

  router.post(
    '/v1/projects/:pid/posts',
    rateLimit({
      windowMs: 15 * 60_000,
      max: 10,
      name: 'post',
      // Per wallet on top of the per-IP window. The daily allowance is the
      // real rule; this is the brake on somebody hammering the route.
      by: (req) => decodeProof(req.header('authorization'))?.address,
    }),
    h(async (req, res) => {
      const p = await project(req, res);
      if (!p) return;
      const w = await wallet(req, res, p);
      if (!w) return;

      const body = (req.body ?? {}) as Record<string, unknown>;
      const text = typeof body.text === 'string' ? body.text.trim() : '';
      const context = body.context === undefined ? {} : cleanContext(body.context);
      if (
        typeof body.id !== 'string' ||
        !body.id ||
        body.id.length > POST_ID_MAX ||
        !isPostKind(body.kind) ||
        !p.rules.kinds.includes(body.kind) ||
        !text ||
        text.length > p.rules.textMax ||
        context === null
      ) {
        return fail(res, 400, 'bad_request');
      }

      const at = now();
      const used = await store.countByAuthorSince(p.id, w.address, at - DAY_MS);
      if (used >= p.rules.perDay) {
        console.warn(`[post] ${p.id} too_many ${tag(w.address)} today=${used}`);
        return fail(res, 429, 'too_many', { perDay: p.rules.perDay });
      }

      const created = await store.createPost({
        projectId: p.id,
        id: body.id,
        author: w.address,
        // Anonymous unless the author explicitly asked to be named. Getting
        // this wrong in the private direction costs a name on a card; getting
        // it wrong the other way puts somebody's name where they did not want it.
        anon: body.anon !== false,
        kind: body.kind,
        text,
        at,
        status: 'open',
        ...(Object.keys(context).length ? { context } : {}),
      });
      if (!created) return fail(res, 409, 'duplicate');
      console.info(`[post] ${p.id} ${tag(w.address)} posted ${body.kind} ${body.id}`);
      res.json({ ok: true, left: Math.max(0, p.rules.perDay - used - 1) });
    }),
  );

  router.post(
    '/v1/projects/:pid/posts/:id/vote',
    h(async (req, res) => {
      const p = await project(req, res);
      if (!p) return;
      const w = await wallet(req, res, p);
      if (!w) return;
      const post = await store.getPost(p.id, String(req.params.id));
      if (!post || (post.hidden && !w.owner)) return fail(res, 404, 'no_post');
      // Stated rather than toggled, so a retry lands where the tap meant it to.
      const up = (req.body ?? {}).up !== false;
      const votes = await store.vote(p.id, post.id, w.address, up);
      res.json({ ok: true, votes, voted: up });
    }),
  );

  router.delete(
    '/v1/projects/:pid/posts/:id',
    h(async (req, res) => {
      const p = await project(req, res);
      if (!p) return;
      const w = await wallet(req, res, p);
      if (!w) return;
      const post = await store.getPost(p.id, String(req.params.id));
      if (!post) return fail(res, 404, 'no_post');
      if (post.author !== w.address && !w.owner) return fail(res, 403, 'not_yours');
      await store.deletePost(p.id, post.id);
      console.info(`[post] ${p.id} ${tag(w.address)} deleted ${post.id}`);
      res.json({ ok: true });
    }),
  );

  // ---- Owners ----

  router.post(
    '/v1/projects/:pid/posts/:id/manage',
    h(async (req, res) => {
      const p = await project(req, res);
      if (!p) return;
      const w = await wallet(req, res, p);
      if (!w) return;
      if (!w.owner) return fail(res, 403, 'not_owner');
      const post = await store.getPost(p.id, String(req.params.id));
      if (!post) return fail(res, 404, 'no_post');

      const { status, reply, hidden } = (req.body ?? {}) as Record<string, unknown>;
      const patch: PostPatch = {};
      // Whether this call was an *answer*, which is what the author is told
      // about. Hiding is not: telling somebody their post was taken down is
      // the start of an argument the board has nowhere to hold. Nor is saving
      // the same words twice.
      let answered = false;

      if (status !== undefined) {
        if (!isPostStatus(status)) return fail(res, 400, 'bad_request');
        if (status !== post.status) answered = true;
        patch.status = status;
      }
      if (reply !== undefined) {
        if (typeof reply !== 'string' || reply.trim().length > p.rules.replyMax) {
          return fail(res, 400, 'bad_request');
        }
        const said = reply.trim();
        if (said !== (post.reply?.text ?? '')) answered = true;
        // An empty reply is how one is taken back, rather than a route of its own.
        patch.reply = said ? { text: said, at: now() } : null;
      }
      if (hidden !== undefined) {
        if (typeof hidden !== 'boolean') return fail(res, 400, 'bad_request');
        patch.hidden = hidden;
      }
      if (answered) patch.answeredAt = now();

      await store.updatePost(p.id, post.id, patch);
      console.info(`[post] ${p.id} owner managed ${post.id}`);
      res.json({ ok: true });
    }),
  );

  // ---- Projects (dashboard) ----

  router.post(
    '/v1/projects',
    rateLimit({ windowMs: 60 * 60_000, max: 5, name: 'create-project' }),
    h(async (req, res) => {
      const owner = await dashboard(req, res);
      if (!owner) return;
      const body = (req.body ?? {}) as Record<string, unknown>;
      const name = cleanName(body.name);
      const origins = cleanOrigins(body.origins);
      if (!name || !origins) return fail(res, 400, 'bad_request');

      let id = newProjectId();
      while (await store.getProject(id)) id = newProjectId();
      const p = newProject({ id, name, origins, owner, now: now() });
      await store.putProject(p);
      console.info(`[project] ${tag(owner)} created ${p.id}`);
      res.json(p);
    }),
  );

  router.get(
    '/v1/projects',
    h(async (req, res) => {
      const owner = await dashboard(req, res);
      if (!owner) return;
      const projects = await store.projectsOwnedBy(owner);
      res.json({
        projects: await Promise.all(
          projects.map(async (p) => ({
            ...p,
            unseen: await store.countSince(p.id, await store.getSeen(p.id, owner)),
          })),
        ),
      });
    }),
  );

  router.patch(
    '/v1/projects/:pid',
    h(async (req, res) => {
      const owner = await dashboard(req, res);
      if (!owner) return;
      const p = await project(req, res);
      if (!p) return;
      if (!p.owners.includes(owner)) return fail(res, 403, 'not_owner');

      const body = (req.body ?? {}) as Record<string, unknown>;
      const next: Project = { ...p };
      if (body.name !== undefined) {
        const name = cleanName(body.name);
        if (!name) return fail(res, 400, 'bad_request');
        next.name = name;
      }
      if (body.origins !== undefined) {
        const origins = cleanOrigins(body.origins);
        if (!origins) return fail(res, 400, 'bad_request');
        next.origins = origins;
      }
      if (body.owners !== undefined) {
        // Never empty: a project nobody owns is a project nobody can answer.
        const owners = cleanOwners(body.owners);
        if (!owners) return fail(res, 400, 'bad_request');
        next.owners = owners;
      }
      if (body.rules !== undefined) {
        const rules = mergeRules(p.rules, body.rules);
        if (!rules) return fail(res, 400, 'bad_request');
        next.rules = rules;
      }
      await store.putProject(next);
      console.info(`[project] ${tag(owner)} changed ${p.id}`);
      res.json(next);
    }),
  );

  router.post(
    '/v1/projects/:pid/seen',
    h(async (req, res) => {
      const owner = await dashboard(req, res);
      if (!owner) return;
      const p = await project(req, res);
      if (!p) return;
      if (!p.owners.includes(owner)) return fail(res, 403, 'not_owner');
      await store.setSeen(p.id, owner, now());
      res.json({ ok: true });
    }),
  );

  return router;
}

/** A wallet, short enough for a log line and not enough to identify anyone at a glance. */
function tag(address: string): string {
  const a = normalizeAddress(address);
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}
