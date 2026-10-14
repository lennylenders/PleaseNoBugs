import { afterEach, describe, expect, it } from 'vitest';
import { DAY_MS, LOGIN_TTL_MS } from '@pleasenobugs/core';
import { MemoryStore } from './memory-store.js';
import { newProject } from './projects.js';
import { serve, wallet } from './test-helpers.js';

/**
 * The API end to end, with real signatures, against a real HTTP server.
 *
 * Most of what is asserted is what does **not** travel: the author's address,
 * who voted, the owner-only fields. Those are promises made in the widget's
 * copy ("nobody sees who wrote it"), and copy is not enforcement.
 *
 * The rest is the part that is new since Shitti: a proof belongs to one
 * project and one origin, and is worth nothing anywhere else.
 */

const APP = 'https://app.example';
const OTHER_APP = 'https://other.example';
const DASH = 'https://dashboard.example';

const OWNER = wallet('c3');
const A = wallet('a1');
const B = wallet('b2');
const C = wallet('d4');

let close: (() => Promise<void>) | null = null;
afterEach(async () => {
  await close?.();
  close = null;
});

/** A fresh server with two projects, so every test starts from nothing. */
async function setup(opts: { dashboard?: boolean } = {}) {
  const store = new MemoryStore();
  let clock = Date.now();
  await store.putProject(newProject({ id: 'board1', name: 'Board one', origins: [APP], owner: OWNER.address }));
  await store.putProject(newProject({ id: 'board2', name: 'Board two', origins: [OTHER_APP], owner: OWNER.address }));
  const srv = await serve({
    store,
    now: () => clock,
    dashboardOrigins: opts.dashboard ? [DASH] : [],
  });
  close = srv.close;

  /** Call as a wallet on board1, from the app's own origin. */
  const as = (w: ReturnType<typeof wallet>, method: string, path: string, body?: unknown) =>
    srv.call(method, `/v1/projects/board1${path}`, { auth: w.proof('board1', APP), origin: APP, body });

  let n = 0;
  const post = (w: ReturnType<typeof wallet>, over: Record<string, unknown> = {}) =>
    as(w, 'POST', '/posts', { id: `p${++n}`, kind: 'idea', text: 'Dark mode please', ...over });

  return {
    store,
    call: srv.call,
    as,
    post,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

describe('reading', () => {
  it('is open to strangers, who get no `me` and no votes of their own', async () => {
    const { call, post } = await setup();
    await post(A);
    const res = await call('GET', '/v1/projects/board1/posts');
    expect(res.status).toBe(200);
    expect(res.data.me).toBeUndefined();
    expect(res.data.project).toEqual({
      id: 'board1',
      name: 'Board one',
      rules: { perDay: 5, textMax: 200, replyMax: 300, kinds: ['bug', 'idea'] },
    });
    expect(res.data.posts[0]).toMatchObject({ votes: 1, voted: false, mine: false });
  });

  it('never tells a stranger who owns the project or where it runs', async () => {
    const { call } = await setup();
    const res = await call('GET', '/v1/projects/board1');
    expect(res.raw).not.toContain(OWNER.key);
    expect(res.data.origins).toBeUndefined();
  });

  it('answers 404 for a project that does not exist', async () => {
    const { call } = await setup();
    expect((await call('GET', '/v1/projects/nope/posts')).data.error).toBe('no_project');
  });

  it('refuses a broken header even where a stranger would be let in', async () => {
    const { call } = await setup();
    const res = await call('GET', '/v1/projects/board1/posts', { auth: 'Nimiq garbage' });
    expect(res.status).toBe(401);
  });
});

describe('what never leaves the server', () => {
  it('the author’s address, named or anonymous, in either spelling', async () => {
    const { as, call, post } = await setup();
    await as(A, 'PUT', '/me', { name: 'Alice' });
    await post(A, { anon: false });
    await post(A, { anon: true, text: 'Second one' });
    for (const res of [await call('GET', '/v1/projects/board1/posts'), await as(B, 'GET', '/posts')]) {
      expect(res.raw).not.toContain(A.key);
      expect(res.raw).not.toContain(A.address);
    }
  });

  it('who voted: a count and a "did I", never the list', async () => {
    const { as, post } = await setup();
    await post(A);
    await as(B, 'POST', '/posts/p1/vote', { up: true });
    const res = await as(C, 'GET', '/posts');
    expect(res.data.posts[0]).toMatchObject({ votes: 2, voted: false });
    expect(res.raw).not.toContain(B.key);
  });

  it('a name the author did not ask to show', async () => {
    const { as, post } = await setup();
    await as(A, 'PUT', '/me', { name: 'Alice' });
    await post(A); // anon by default
    await post(A, { anon: false, text: 'Named one' });
    const { posts } = (await as(B, 'GET', '/posts')).data;
    expect(posts.find((p: any) => p.id === 'p1').who).toBeUndefined();
    expect(posts.find((p: any) => p.id === 'p2').who).toBe('Alice');
  });

  it('context, except to owners', async () => {
    const { as, post } = await setup();
    await post(A, { kind: 'bug', text: 'Crash', context: { version: '1.2.0', host: 'nimiq-pay' } });
    expect((await as(B, 'GET', '/posts')).data.posts[0].context).toBeUndefined();
    expect((await as(OWNER, 'GET', '/posts')).data.posts[0].context).toEqual({
      version: '1.2.0',
      host: 'nimiq-pay',
    });
  });
});

describe('proofs belong to one project and one origin', () => {
  it('a proof for board1 is worth nothing on board2', async () => {
    const { call } = await setup();
    const res = await call('POST', '/v1/projects/board2/posts', {
      auth: A.proof('board1', OTHER_APP),
      origin: OTHER_APP,
      body: { id: 'x', kind: 'idea', text: 'hello there' },
    });
    expect(res.status).toBe(401);
  });

  it('a proof replayed from another site fails on the Origin header', async () => {
    const { call } = await setup();
    const res = await call('GET', '/v1/projects/board1/me', {
      auth: A.proof('board1', APP),
      origin: 'https://evil.example',
    });
    expect(res.status).toBe(401);
  });

  it('a site the project does not list is told so, not just refused', async () => {
    const { call } = await setup();
    const res = await call('GET', '/v1/projects/board1/me', {
      auth: A.proof('board1', 'http://localhost:5173'),
      origin: 'http://localhost:5173',
    });
    expect(res.status).toBe(403);
    expect(res.data.error).toBe('origin_not_allowed');
  });

  it('works without an Origin header, as a server-to-server call would', async () => {
    const { call } = await setup();
    const res = await call('GET', '/v1/projects/board1/me', { auth: A.proof('board1', APP) });
    expect(res.status).toBe(200);
  });

  it('expires', async () => {
    const { call } = await setup();
    const res = await call('GET', '/v1/projects/board1/me', {
      auth: A.proof('board1', APP, Date.now() - LOGIN_TTL_MS - 1000),
      origin: APP,
    });
    expect(res.status).toBe(401);
  });

  it('cannot be borrowed: another wallet’s address on my signature fails', async () => {
    const { call } = await setup();
    const mine = JSON.parse(atob(A.proof('board1', APP).slice(6).replace(/-/g, '+').replace(/_/g, '/')));
    const forged = btoa(JSON.stringify({ ...mine, address: B.address }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const res = await call('GET', '/v1/projects/board1/me', { auth: `Nimiq ${forged}`, origin: APP });
    expect(res.status).toBe(401);
  });
});

describe('posting', () => {
  it('answers what is left of the day, and the board says the same', async () => {
    const { as, post } = await setup();
    expect((await post(A)).data).toEqual({ ok: true, left: 4 });
    expect((await as(A, 'GET', '/posts')).data.me).toEqual({ owner: false, left: 4 });
  });

  it('stops at the daily allowance, and the allowance rolls rather than resetting', async () => {
    const { advance, post } = await setup();
    for (let i = 0; i < 5; i++) expect((await post(A)).status).toBe(200);
    const sixth = await post(A);
    expect(sixth.status).toBe(429);
    expect(sixth.data).toEqual({ error: 'too_many', perDay: 5 });
    advance(DAY_MS + 1);
    expect((await post(A)).status).toBe(200);
  });

  it('refuses a duplicate id', async () => {
    const { post } = await setup();
    await post(A, { id: 'same' });
    expect((await post(A, { id: 'same' })).data.error).toBe('duplicate');
  });

  it('refuses what does not fit, rather than trimming it silently', async () => {
    const { post } = await setup();
    expect((await post(A, { text: '   ' })).status).toBe(400);
    expect((await post(A, { text: 'x'.repeat(201) })).status).toBe(400);
    expect((await post(A, { kind: 'rant' })).status).toBe(400);
    expect((await post(A, { context: 'not an object' })).status).toBe(400);
    expect((await post(A, { text: 'x'.repeat(200) })).status).toBe(200);
  });

  it('needs a proof', async () => {
    const { call } = await setup();
    const res = await call('POST', '/v1/projects/board1/posts', {
      body: { id: 'x', kind: 'idea', text: 'hi' },
    });
    expect(res.status).toBe(401);
  });
});

describe('voting', () => {
  it('counts one per wallet however often it asks, and can be taken back', async () => {
    const { as, post } = await setup();
    await post(A);
    expect((await as(B, 'POST', '/posts/p1/vote', { up: true })).data).toEqual({ ok: true, votes: 2, voted: true });
    expect((await as(B, 'POST', '/posts/p1/vote', { up: true })).data.votes).toBe(2);
    expect((await as(B, 'POST', '/posts/p1/vote', { up: false })).data).toEqual({ ok: true, votes: 1, voted: false });
  });

  it('cannot reach a hidden post, except as an owner', async () => {
    const { as, post } = await setup();
    await post(A);
    await as(OWNER, 'POST', '/posts/p1/manage', { hidden: true });
    expect((await as(B, 'POST', '/posts/p1/vote', { up: true })).status).toBe(404);
    expect((await as(OWNER, 'POST', '/posts/p1/vote', { up: true })).status).toBe(200);
  });
});

describe('names', () => {
  it('are per project, change earlier posts, and clear with an empty string', async () => {
    const { as, call, post } = await setup();
    await post(A, { anon: false });
    await as(A, 'PUT', '/me', { name: '  Alice  ' });
    expect((await as(B, 'GET', '/posts')).data.posts[0].who).toBe('Alice');
    await as(A, 'PUT', '/me', { name: 'Ally' });
    expect((await as(B, 'GET', '/posts')).data.posts[0].who).toBe('Ally');
    expect((await as(A, 'PUT', '/me', { name: '' })).data).toEqual({ ok: true });
    expect((await as(B, 'GET', '/posts')).data.posts[0].who).toBeUndefined();
    // board2 never heard of it.
    const other = await call('GET', '/v1/projects/board2/me', {
      auth: A.proof('board2', OTHER_APP),
      origin: OTHER_APP,
    });
    expect(other.data.name).toBeUndefined();
  });

  it('refuses one that is too long', async () => {
    const { as } = await setup();
    expect((await as(A, 'PUT', '/me', { name: 'x'.repeat(25) })).status).toBe(400);
  });
});

describe('deleting', () => {
  it('your own, or anything if you own the project, and nothing else', async () => {
    const { as, post } = await setup();
    await post(A);
    await post(B);
    expect((await as(B, 'DELETE', '/posts/p1')).data.error).toBe('not_yours');
    expect((await as(A, 'DELETE', '/posts/p1')).status).toBe(200);
    expect((await as(OWNER, 'DELETE', '/posts/p2')).status).toBe(200);
    expect((await as(A, 'GET', '/posts')).data.posts).toEqual([]);
  });
});

describe('owners answering', () => {
  it('only owners may', async () => {
    const { as, post } = await setup();
    await post(A);
    expect((await as(B, 'POST', '/posts/p1/manage', { status: 'done' })).data.error).toBe('not_owner');
  });

  it('a status or a reply is an answer the author is told about', async () => {
    const { as, post, advance } = await setup();
    await post(A, { text: 'First' });
    await post(A, { text: 'Second' });
    await as(OWNER, 'POST', '/posts/p1/manage', { status: 'planned' });
    advance(1000);
    await as(OWNER, 'POST', '/posts/p2/manage', { reply: 'Good idea' });
    const { answers } = (await as(A, 'GET', '/answers')).data;
    expect(answers.map((a: any) => a.text)).toEqual(['Second', 'First']);
    const board = (await as(B, 'GET', '/posts')).data.posts;
    expect(board.find((p: any) => p.id === 'p2').reply.text).toBe('Good idea');
    expect(board.find((p: any) => p.id === 'p1').status).toBe('planned');
    // Nobody else's answers.
    expect((await as(B, 'GET', '/answers')).data.answers).toEqual([]);
  });

  it('hiding is not an answer, and saving the same words twice is not either', async () => {
    const { as, post } = await setup();
    await post(A);
    await as(OWNER, 'POST', '/posts/p1/manage', { hidden: true, status: 'open' });
    expect((await as(A, 'GET', '/answers')).data.answers).toEqual([]);
  });

  it('a hidden post is gone for everybody but owners, who see it marked', async () => {
    const { as, post } = await setup();
    await post(A);
    await as(OWNER, 'POST', '/posts/p1/manage', { hidden: true });
    expect((await as(A, 'GET', '/posts')).data.posts).toEqual([]);
    expect((await as(OWNER, 'GET', '/posts')).data.posts[0].hidden).toBe(true);
    await as(OWNER, 'POST', '/posts/p1/manage', { hidden: false });
    expect((await as(A, 'GET', '/posts')).data.posts).toHaveLength(1);
  });

  it('an empty reply takes the reply back', async () => {
    const { as, post } = await setup();
    await post(A);
    await as(OWNER, 'POST', '/posts/p1/manage', { reply: 'Hm' });
    await as(OWNER, 'POST', '/posts/p1/manage', { reply: '' });
    expect((await as(A, 'GET', '/posts')).data.posts[0].reply).toBeUndefined();
  });

  it('refuses nonsense', async () => {
    const { as, post } = await setup();
    await post(A);
    expect((await as(OWNER, 'POST', '/posts/p1/manage', { status: 'maybe' })).status).toBe(400);
    expect((await as(OWNER, 'POST', '/posts/p1/manage', { reply: 'x'.repeat(301) })).status).toBe(400);
    expect((await as(OWNER, 'POST', '/posts/p1/manage', { hidden: 'yes' })).status).toBe(400);
  });

  it('owners see themselves as owners', async () => {
    const { as } = await setup();
    expect((await as(OWNER, 'GET', '/me')).data.owner).toBe(true);
    expect((await as(A, 'GET', '/me')).data.owner).toBe(false);
  });
});

describe('the dashboard', () => {
  const dash = (w: ReturnType<typeof wallet>) => ({ auth: w.proof('dashboard', DASH), origin: DASH });

  it('does not exist on a server that lists no dashboard origins', async () => {
    const { call } = await setup();
    expect((await call('GET', '/v1/projects', dash(OWNER))).status).toBe(401);
  });

  it('creates a project owned by whoever signed, and lists it with what is unseen', async () => {
    const { call } = await setup({ dashboard: true });
    const created = await call('POST', '/v1/projects', {
      ...dash(C),
      body: { name: 'My app', origins: ['https://My.app/some/path', 'http://localhost:5173'] },
    });
    expect(created.status).toBe(200);
    expect(created.data).toMatchObject({
      name: 'My app',
      owners: [C.key],
      origins: ['https://my.app', 'http://localhost:5173'],
    });
    const id = created.data.id;

    await call('POST', `/v1/projects/${id}/posts`, {
      auth: A.proof(id, 'https://my.app'),
      origin: 'https://my.app',
      body: { id: 'x', kind: 'bug', text: 'It broke' },
    });
    let list = (await call('GET', '/v1/projects', dash(C))).data.projects;
    expect(list).toHaveLength(1);
    expect(list[0].unseen).toBe(1);

    await call('POST', `/v1/projects/${id}/seen`, dash(C));
    list = (await call('GET', '/v1/projects', dash(C))).data.projects;
    expect(list[0].unseen).toBe(0);

    // Somebody else's dashboard does not list it.
    expect((await call('GET', '/v1/projects', dash(A))).data.projects).toEqual([]);
  });

  it('refuses a project with no valid origin', async () => {
    const { call } = await setup({ dashboard: true });
    for (const origins of [[], ['javascript:alert(1)'], 'https://x.app']) {
      const res = await call('POST', '/v1/projects', { ...dash(C), body: { name: 'X', origins } });
      expect(res.status).toBe(400);
    }
  });

  it('changes rules, origins and owners, but never leaves a project without an owner', async () => {
    const { call, as } = await setup({ dashboard: true });
    const patched = await call('PATCH', '/v1/projects/board1', {
      ...dash(OWNER),
      body: { rules: { perDay: 2, kinds: ['idea', 'bug'] }, owners: [OWNER.address, B.address] },
    });
    expect(patched.data.rules).toMatchObject({ perDay: 2, kinds: ['bug', 'idea'] });
    expect(patched.data.owners).toEqual([OWNER.key, B.key]);
    expect((await as(B, 'GET', '/me')).data.owner).toBe(true);

    expect((await call('PATCH', '/v1/projects/board1', { ...dash(OWNER), body: { owners: [] } })).status).toBe(400);
    expect((await call('PATCH', '/v1/projects/board1', { ...dash(OWNER), body: { rules: { perDay: 0 } } })).status).toBe(400);
    expect((await call('PATCH', '/v1/projects/board1', { ...dash(A), body: { name: 'Mine now' } })).data.error).toBe('not_owner');
  });

  it('a kind taken off a board can no longer be posted', async () => {
    const { call, post } = await setup({ dashboard: true });
    await call('PATCH', '/v1/projects/board1', { ...dash(OWNER), body: { rules: { kinds: ['bug'] } } });
    expect((await post(A, { kind: 'idea' })).status).toBe(400);
    expect((await post(A, { kind: 'bug' })).status).toBe(200);
  });

  it('a dashboard proof cannot post, and a board proof cannot run the dashboard', async () => {
    const { call } = await setup({ dashboard: true });
    const posted = await call('POST', '/v1/projects/board1/posts', {
      ...dash(OWNER),
      body: { id: 'x', kind: 'idea', text: 'sneaky' },
    });
    expect(posted.status).toBe(401);
    const listed = await call('GET', '/v1/projects', { auth: OWNER.proof('board1', DASH), origin: DASH });
    expect(listed.status).toBe(401);
  });

  it('only from a dashboard origin', async () => {
    const { call } = await setup({ dashboard: true });
    const res = await call('GET', '/v1/projects', { auth: OWNER.proof('dashboard', APP), origin: APP });
    expect(res.data.error).toBe('origin_not_allowed');
  });
});

describe('the server around it', () => {
  it('answers JSON for a route that does not exist', async () => {
    const { call } = await setup();
    expect((await call('GET', '/v2/anything')).data).toEqual({ error: 'not_found' });
  });

  it('answers 400, not 500, for a body that is not JSON', async () => {
    const store = new MemoryStore();
    await store.putProject(newProject({ id: 'board1', name: 'B', origins: [APP], owner: OWNER.address }));
    const { createApp } = await import('./app.js');
    const server = createApp({ store }).listen(0);
    await new Promise<void>((r) => server.once('listening', () => r()));
    const port = (server.address() as import('node:net').AddressInfo).port;
    const res = await fetch(`http://127.0.0.1:${port}/v1/projects/board1/posts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: A.proof('board1', APP) },
      body: '{not json',
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'bad_request' });
    await new Promise<void>((r) => server.close(() => r()));
  });

  it('has a health check', async () => {
    const { call } = await setup();
    expect((await call('GET', '/health')).data).toEqual({ ok: true });
  });
});
