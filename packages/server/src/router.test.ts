import { afterEach, describe, expect, it } from 'vitest';
import { DAY_MS, LOGIN_TTL_MS, identiconCode, shortAddress, type Rules } from '@pleasenobugs/core';
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
 * The rest is the part that is new since the app this grew out of: a proof belongs to one
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
async function setup(opts: { dashboard?: boolean; rules?: Partial<Rules>; postsPerIpDay?: number } = {}) {
  const store = new MemoryStore();
  let clock = Date.now();
  await store.putProject(
    newProject({ id: 'board1', name: 'Board one', origins: [APP], owner: OWNER.address, rules: opts.rules }),
  );
  await store.putProject(newProject({ id: 'board2', name: 'Board two', origins: [OTHER_APP], owner: OWNER.address }));
  const srv = await serve({
    store,
    now: () => clock,
    dashboardOrigins: opts.dashboard ? [DASH] : [],
    postsPerIpDay: opts.postsPerIpDay,
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
      rules: { perDay: 5, textMax: 200, replyMax: 300, kinds: ['bug', 'idea', 'review'], screenshots: 'board', approve: false },
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
    // The identicon goes with the name, and with it stays off an anonymous post.
    expect(posts.find((p: any) => p.id === 'p1').face).toBeUndefined();
    expect(posts.find((p: any) => p.id === 'p2').face).toBe(identiconCode(A.address));
  });

  it('without a name, the address cut short and never whole; nothing at all when anonymous', async () => {
    const { as, post } = await setup();
    await post(A, { anon: false });
    await post(A, { anon: true, text: 'Second one' });
    const res = await as(B, 'GET', '/posts');
    const named = res.data.posts.find((p: any) => p.id === 'p1');
    const anon = res.data.posts.find((p: any) => p.id === 'p2');
    expect(named.who).toBeUndefined();
    expect(named.short).toBe(shortAddress(A.address));
    expect(named.short).toMatch(/^NQ\d{2} … [0-9A-Z]{4}$/);
    expect(anon.short).toBeUndefined();
    expect(anon.face).toBeUndefined();
    expect(res.raw).not.toContain(A.address);
  });

  it('an identicon is a picture of the wallet, never the address', async () => {
    const { as, call, post } = await setup();
    await as(A, 'PUT', '/me', { name: 'Alice' });
    await post(A, { anon: false });
    const read = await as(B, 'GET', '/posts');
    const face = read.data.posts[0].face;
    expect(face).toMatch(/^[0-9]{12}$/);
    expect((await as(A, 'GET', '/posts')).data.me.face).toBe(face);
    const svg = await call('GET', `/v1/identicons/${face}.svg`);
    expect(svg.status).toBe(200);
    expect(svg.type).toContain('image/svg+xml');
    expect(svg.headers.get('cache-control')).toContain('immutable');
    expect(svg.raw).toContain('<svg');
    expect(svg.raw).not.toContain(A.address);
    expect((await call('GET', '/v1/identicons/12ab.svg')).status).toBe(404);
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

describe('app logins', () => {
  const LOGIN = 'Sign in to My app';

  async function withAppLogin() {
    const env = await setup({ dashboard: true });
    await env.store.putProject({ ...(await env.store.getProject('board1'))!, loginMessages: [LOGIN] });
    return env;
  }

  it('lets a project accept the signature its app already has', async () => {
    const { call } = await withAppLogin();
    const res = await call('POST', '/v1/projects/board1/posts', {
      auth: A.appProof(LOGIN, APP),
      origin: APP,
      body: { id: 'x', kind: 'idea', text: 'No second signature' },
    });
    expect(res.status).toBe(200);
    const board = await call('GET', '/v1/projects/board1/posts', { auth: A.appProof(LOGIN, APP), origin: APP });
    expect(board.data.posts[0].mine).toBe(true);
  });

  it('never expires, which is what the owner opted into', async () => {
    const { call, advance } = await withAppLogin();
    advance(LOGIN_TTL_MS * 10);
    const res = await call('GET', '/v1/projects/board1/me', { auth: A.appProof(LOGIN, APP), origin: APP });
    expect(res.status).toBe(200);
  });

  it('is worth nothing on a project that did not list the message', async () => {
    const { call } = await withAppLogin();
    const res = await call('GET', '/v1/projects/board2/me', { auth: A.appProof(LOGIN, OTHER_APP), origin: OTHER_APP });
    expect(res.status).toBe(401);
  });

  it('takes a message with a changing end, when the project listed its start with *', async () => {
    const env = await setup({ dashboard: true });
    await env.store.putProject({ ...(await env.store.getProject('board1'))!, loginMessages: [`${LOGIN}*`] });
    const signed = `${LOGIN}\nNonce: 8f3a91\nIssued: 2026-11-24`;
    const me = (msg: string) => env.call('GET', '/v1/projects/board1/me', { auth: A.appProof(msg, APP), origin: APP });
    expect((await me(signed)).status).toBe(200);
    expect((await me(`${LOGIN}, another day`)).status).toBe(200);
    // Not the start it listed, and never our own message, whatever follows.
    expect((await me('Sign in to My other app')).status).toBe(401);
    expect((await me('PleaseNoBugs login\nProject: board1')).status).toBe(401);
  });

  it('refuses a changing end whose fixed start is too short to mean one app', async () => {
    const { call } = await setup({ dashboard: true });
    const dash = { auth: OWNER.proof('dashboard', DASH), origin: DASH };
    expect((await call('PATCH', '/v1/projects/board1', { ...dash, body: { loginMessages: ['Sign in*'] } })).status).toBe(400);
    expect((await call('PATCH', '/v1/projects/board1', { ...dash, body: { loginMessages: ['*'] } })).status).toBe(400);
  });

  it('is refused off by default, and for a message nobody listed', async () => {
    const { call } = await setup();
    expect((await call('GET', '/v1/projects/board1/me', { auth: A.appProof(LOGIN, APP), origin: APP })).status).toBe(401);
    const env = await withAppLogin();
    expect(
      (await env.call('GET', '/v1/projects/board1/me', { auth: A.appProof('Sign in to Evil', APP), origin: APP })).status,
    ).toBe(401);
  });

  it('still answers to the origin rules', async () => {
    const { call } = await withAppLogin();
    const elsewhere = await call('GET', '/v1/projects/board1/me', {
      auth: A.appProof(LOGIN, 'https://evil.example'),
      origin: 'https://evil.example',
    });
    expect(elsewhere.data.error).toBe('origin_not_allowed');
  });

  it('cannot run the dashboard', async () => {
    const { call } = await withAppLogin();
    const res = await call('GET', '/v1/projects', { auth: OWNER.appProof(LOGIN, DASH), origin: DASH });
    expect(res.status).toBe(401);
  });

  it('is set and cleared by the owner, exactly as written, and never in our own format', async () => {
    const { call } = await setup({ dashboard: true });
    const dash = { auth: OWNER.proof('dashboard', DASH), origin: DASH };
    const set = await call('PATCH', '/v1/projects/board1', { ...dash, body: { loginMessages: [`${LOGIN} `] } });
    expect(set.data.loginMessages).toEqual([`${LOGIN} `]);
    expect((await call('PATCH', '/v1/projects/board1', { ...dash, body: { loginMessages: ['PleaseNoBugs login'] } })).status).toBe(400);
    const cleared = await call('PATCH', '/v1/projects/board1', { ...dash, body: { loginMessages: [] } });
    expect(cleared.data.loginMessages).toBeUndefined();
    // And a stranger never learns what it is.
    expect((await call('GET', '/v1/projects/board1')).data.loginMessages).toBeUndefined();
  });
});

describe('posting', () => {
  it('answers what is left of the day, and the board says the same', async () => {
    const { as, post } = await setup();
    expect((await post(A)).data).toEqual({ ok: true, left: 4 });
    expect((await as(A, 'GET', '/posts')).data.me).toEqual({
      owner: false,
      left: 4,
      face: identiconCode(A.address),
      short: shortAddress(A.address),
    });
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

describe('reviews', () => {
  const review = (over: Record<string, unknown> = {}) => ({ kind: 'review', text: 'Love the QR scanner', rating: 5, ...over });

  it('carry their stars to everybody, and need them', async () => {
    const { call, post } = await setup();
    expect((await post(A, review())).status).toBe(200);
    const [p] = (await call('GET', '/v1/projects/board1/posts')).data.posts;
    expect(p).toMatchObject({ kind: 'review', rating: 5, status: 'open' });

    expect((await post(B, review({ rating: undefined }))).status).toBe(400);
    expect((await post(B, review({ rating: 0 }))).status).toBe(400);
    expect((await post(B, review({ rating: 6 }))).status).toBe(400);
    expect((await post(B, review({ rating: 3.5 }))).status).toBe(400);
    // Stars belong to reviews only.
    expect((await post(B, { kind: 'idea', rating: 4 })).status).toBe(400);
  });

  it('one per wallet: a second is refused until the first is thrown away', async () => {
    const { as, post } = await setup();
    expect((await post(A, review({ id: 'r1' }))).status).toBe(200);
    const again = await post(A, review({ id: 'r2', rating: 2 }));
    expect(again.status).toBe(409);
    expect(again.data.error).toBe('reviewed');
    expect((await post(B, review({ id: 'r3' }))).status).toBe(200);
    await as(A, 'DELETE', '/posts/r1');
    expect((await post(A, review({ id: 'r4', rating: 2 }))).status).toBe(200);
  });

  it('never get a status, but can be answered and hidden', async () => {
    const { as, post } = await setup();
    await post(A, review({ id: 'r1' }));
    expect((await as(OWNER, 'POST', '/posts/r1/manage', { status: 'done' })).status).toBe(400);
    expect((await as(OWNER, 'POST', '/posts/r1/manage', { status: 'open', reply: 'Thank you!' })).status).toBe(200);
    expect((await as(OWNER, 'POST', '/posts/r1/manage', { hidden: true })).status).toBe(200);
    expect((await as(B, 'GET', '/posts')).data.posts).toEqual([]);
  });
});

describe('screenshots', () => {
  const png = (size = 64) => {
    const bytes = new Uint8Array(size);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    return Buffer.from(bytes).toString('base64');
  };
  const shot = (data = png(), type = 'image/png') => ({ type, data });
  /** A screenshot whose author ticked that everyone may see it. */
  const shown = (data = png()) => ({ ...shot(data), board: true });

  it('without the author saying yes, reach owners and nobody else, the author included', async () => {
    const { as, call, post } = await setup();
    expect((await post(A, { id: 'b1', kind: 'bug', shot: shot() })).status).toBe(200);

    const stranger = (await call('GET', '/v1/projects/board1/posts')).data.posts[0];
    const author = (await as(A, 'GET', '/posts')).data.posts[0];
    const owner = (await as(OWNER, 'GET', '/posts')).data.posts[0];
    expect(stranger.shot).toBeUndefined();
    expect(author.shot).toBeUndefined();
    expect(owner).toMatchObject({ shot: true, shotFor: 'owners' });

    expect((await call('GET', '/v1/projects/board1/posts/b1/shot')).status).toBe(404);
    expect((await as(A, 'GET', '/posts/b1/shot')).status).toBe(404);
    const got = await as(OWNER, 'GET', '/posts/b1/shot');
    expect(got.status).toBe(200);
    expect(got.type).toBe('image/png');
    expect(got.bytes).toBe(64);
    expect((await as(OWNER, 'GET', '/posts/nope/shot')).status).toBe(404);

    // An owner cannot put on the board what its author kept for them.
    await as(OWNER, 'POST', '/posts/b1/manage', { shotOff: false });
    expect((await as(OWNER, 'GET', '/posts')).data.posts[0].shotFor).toBe('owners');
    expect((await call('GET', '/v1/projects/board1/posts/b1/shot')).status).toBe(404);
  });

  it('with the author saying yes, reach everybody, without a proof and without being kept', async () => {
    const { as, call, post } = await setup();
    expect((await post(A, { id: 'b1', kind: 'bug', shot: shown() })).status).toBe(200);

    const stranger = (await call('GET', '/v1/projects/board1/posts')).data.posts[0];
    expect(stranger.shot).toBe(true);
    expect(stranger.shotFor).toBeUndefined();
    expect((await as(OWNER, 'GET', '/posts')).data.posts[0]).toMatchObject({ shot: true, shotFor: 'board' });

    const got = await call('GET', '/v1/projects/board1/posts/b1/shot');
    expect(got.status).toBe(200);
    expect(got.bytes).toBe(64);
    expect(got.headers.get('cache-control')).toBe('no-store');
    expect(got.headers.get('x-robots-tag')).toBe('noindex');
    expect(got.headers.get('x-content-type-options')).toBe('nosniff');
    expect((await as(B, 'GET', '/posts/b1/shot')).status).toBe(200);
  });

  it('can be taken off the board by an owner, and put back, without touching the post', async () => {
    const { as, call, post } = await setup();
    await post(A, { id: 'b1', kind: 'bug', shot: shown() });
    expect((await as(A, 'POST', '/posts/b1/manage', { shotOff: true })).status).toBe(403);
    expect((await as(OWNER, 'POST', '/posts/b1/manage', { shotOff: 'yes' })).status).toBe(400);
    expect((await as(OWNER, 'POST', '/posts/b1/manage', { shotOff: true })).status).toBe(200);

    const stranger = (await call('GET', '/v1/projects/board1/posts')).data.posts[0];
    expect(stranger.id).toBe('b1');
    expect(stranger.shot).toBeUndefined();
    expect((await call('GET', '/v1/projects/board1/posts/b1/shot')).status).toBe(404);
    expect((await as(OWNER, 'GET', '/posts')).data.posts[0].shotFor).toBe('off');
    expect((await as(OWNER, 'GET', '/posts/b1/shot')).status).toBe(200);

    await as(OWNER, 'POST', '/posts/b1/manage', { shotOff: false });
    expect((await call('GET', '/v1/projects/board1/posts/b1/shot')).status).toBe(200);
  });

  it('go off the board with a hidden post', async () => {
    const { as, call, post } = await setup();
    await post(A, { id: 'b1', kind: 'bug', shot: shown() });
    await as(OWNER, 'POST', '/posts/b1/manage', { hidden: true });
    expect((await call('GET', '/v1/projects/board1/posts/b1/shot')).status).toBe(404);
    expect((await as(A, 'GET', '/posts/b1/shot')).status).toBe(404);
    expect((await as(OWNER, 'GET', '/posts/b1/shot')).status).toBe(200);
  });

  it('are images and nothing else, of a sane size, on bugs and ideas only', async () => {
    const { post } = await setup();
    const text = Buffer.from('<svg onload="alert(1)"></svg>').toString('base64');
    expect((await post(A, { kind: 'bug', shot: shot(text, 'image/png') })).status).toBe(400);
    expect((await post(A, { kind: 'bug', shot: shot(text, 'image/svg+xml') })).status).toBe(400);
    expect((await post(A, { kind: 'bug', shot: shot(png(), 'image/jpeg') })).status).toBe(400);
    expect((await post(A, { kind: 'bug', shot: shot('not base64!') })).status).toBe(400);
    expect((await post(A, { kind: 'bug', shot: 'a string' })).status).toBe(400);
    expect((await post(A, { kind: 'bug', shot: { ...shot(), board: 'yes' } })).status).toBe(400);
    expect((await post(A, { kind: 'bug', shot: shot(png(1_000_001)) })).status).toBe(400);
    expect((await post(A, { kind: 'review', rating: 4, shot: shot() })).status).toBe(400);
    // The biggest one allowed still fits through the parser.
    expect((await post(A, { kind: 'idea', shot: shot(png(1_000_000)) })).status).toBe(200);
  });

  it('go when the post is settled or thrown away', async () => {
    const { as, post } = await setup();
    await post(A, { id: 'b1', kind: 'bug', shot: shown() });
    await post(A, { id: 'b2', kind: 'bug', shot: shown() });
    await as(OWNER, 'POST', '/posts/b1/manage', { status: 'planned' });
    expect((await as(OWNER, 'GET', '/posts/b1/shot')).status).toBe(200);
    await as(OWNER, 'POST', '/posts/b1/manage', { status: 'done' });
    expect((await as(OWNER, 'GET', '/posts/b1/shot')).status).toBe(404);
    await as(A, 'DELETE', '/posts/b2');
    expect((await as(OWNER, 'GET', '/posts/b2/shot')).status).toBe(404);
  });

  it('leave every other route at its small body limit', async () => {
    const { as, post } = await setup();
    await post(A);
    const big = await as(OWNER, 'POST', '/posts/p1/manage', { reply: 'x', pad: 'y'.repeat(40_000) });
    expect(big.status).toBe(400);
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
    // Without a name, the address cut short instead; with one, never both.
    expect((await as(B, 'GET', '/posts')).data.posts[0].short).toBe(shortAddress(A.address));
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

describe('the conversation under a post', () => {
  let m = 0;
  const say = (as: any, w: ReturnType<typeof wallet>, post: string, text: string) =>
    as(w, 'POST', `/posts/${post}/messages`, { id: `m${++m}`, text });
  const thread = async (as: any, w: ReturnType<typeof wallet> = B) =>
    ((await as(w, 'GET', '/posts')).data.posts[0].thread ?? []).map((x: any) => `${x.from}: ${x.text}`);

  it('goes app, author, app, author: the author only ever answers the app', async () => {
    const { as, post } = await setup();
    await post(A, { kind: 'bug' });
    // Nothing to answer yet.
    expect((await say(as, A, 'p1', 'More details')).data.error).toBe('not_your_turn');
    expect((await say(as, OWNER, 'p1', 'Which phone?')).status).toBe(200);
    expect((await say(as, A, 'p1', 'A Pixel 7')).status).toBe(200);
    // Twice in a row is not a conversation.
    expect((await say(as, A, 'p1', 'Oh, and Android 14')).data.error).toBe('not_your_turn');
    // The app may say as much as it likes.
    expect((await say(as, OWNER, 'p1', 'Thanks!')).status).toBe(200);
    expect((await say(as, OWNER, 'p1', 'One more thing: every time?')).status).toBe(200);
    expect((await say(as, A, 'p1', 'Every time')).status).toBe(200);
    // Everybody reads it, in order.
    expect(await thread(as)).toEqual([
      'app: Which phone?',
      'author: A Pixel 7',
      'app: Thanks!',
      'app: One more thing: every time?',
      'author: Every time',
    ]);
  });

  it('nobody but the author and the owners takes part', async () => {
    const { as, post } = await setup();
    await post(A);
    await say(as, OWNER, 'p1', 'Tell me more');
    expect((await say(as, B, 'p1', 'Me too!')).data.error).toBe('not_yours');
  });

  it('a review gets one answer from the app and never one back', async () => {
    const { as, post } = await setup();
    await post(A, { kind: 'review', rating: 4, text: 'Nice' });
    expect((await say(as, OWNER, 'p1', 'Thanks!')).status).toBe(200);
    expect((await say(as, A, 'p1', 'You are welcome')).data.error).toBe('closed');
    expect((await say(as, OWNER, 'p1', 'Really, thanks')).data.error).toBe('not_your_turn');
  });

  it('done or not doing closes it for the author, and opening the post opens it again', async () => {
    const { as, post } = await setup();
    await post(A, { kind: 'bug' });
    await say(as, OWNER, 'p1', 'Fixed, I think?');
    await as(OWNER, 'POST', '/posts/p1/manage', { status: 'done' });
    expect((await say(as, A, 'p1', 'Not for me')).data.error).toBe('closed');
    // The app still may.
    expect((await say(as, OWNER, 'p1', 'Shipped in 1.4.2')).status).toBe(200);
    await as(OWNER, 'POST', '/posts/p1/manage', { status: 'open' });
    expect((await say(as, A, 'p1', 'Still broken for me')).status).toBe(200);
  });

  it('your own last message changes or goes only until it is answered', async () => {
    const { as, post } = await setup();
    await post(A, { kind: 'bug' });
    await say(as, OWNER, 'p1', 'Which phone?');
    const mine = (await say(as, A, 'p1', 'A Pixle')).data.message.id;
    expect((await as(A, 'PATCH', `/posts/p1/messages/${mine}`, { text: 'A Pixel 7' })).status).toBe(200);
    expect((await as(OWNER, 'PATCH', `/posts/p1/messages/${mine}`, { text: 'Hacked' })).data.error).toBe('not_yours');
    expect((await as(B, 'GET', '/posts')).data.posts[0].thread[1]).toMatchObject({ text: 'A Pixel 7', edited: expect.any(Number) });
    await say(as, OWNER, 'p1', 'Thanks');
    expect((await as(A, 'PATCH', `/posts/p1/messages/${mine}`, { text: 'A Pixel 8' })).data.error).toBe('not_your_turn');
    expect((await as(A, 'DELETE', `/posts/p1/messages/${mine}`)).data.error).toBe('not_your_turn');
  });

  it('taking your answer back makes it your turn again', async () => {
    const { as, post } = await setup();
    await post(A, { kind: 'bug' });
    await say(as, OWNER, 'p1', 'Which phone?');
    const mine = (await say(as, A, 'p1', 'Wrong post, sorry')).data.message.id;
    expect((await as(A, 'DELETE', `/posts/p1/messages/${mine}`)).status).toBe(200);
    expect(await thread(as)).toEqual(['app: Which phone?']);
    expect((await say(as, A, 'p1', 'A Pixel 7')).status).toBe(200);
  });

  it('an owner takes an author’s message off the board and puts it back', async () => {
    const { as, post } = await setup();
    await post(A, { kind: 'bug' });
    const q = (await say(as, OWNER, 'p1', 'Which phone?')).data.message.id;
    const rude = (await say(as, A, 'p1', 'Something rude')).data.message.id;
    expect((await as(A, 'PATCH', `/posts/p1/messages/${rude}`, { hidden: true })).data.error).toBe('not_owner');
    expect((await as(OWNER, 'PATCH', `/posts/p1/messages/${q}`, { hidden: true })).status).toBe(400);
    expect((await as(OWNER, 'PATCH', `/posts/p1/messages/${rude}`, { hidden: true })).status).toBe(200);
    // Gone for everybody else, its author included; owners see it marked.
    expect(await thread(as, B)).toEqual(['app: Which phone?']);
    expect(await thread(as, A)).toEqual(['app: Which phone?']);
    expect((await as(OWNER, 'GET', '/posts')).data.posts[0].thread[1]).toMatchObject({ text: 'Something rude', hidden: true });
    // What is not there does not count: the author may answer again.
    expect((await say(as, A, 'p1', 'A Pixel 7')).status).toBe(200);
    expect((await as(OWNER, 'PATCH', `/posts/p1/messages/${rude}`, { hidden: false })).status).toBe(200);
    expect(await thread(as)).toEqual(['app: Which phone?', 'author: Something rude', 'author: A Pixel 7']);
  });

  it('the app writing is news for the author; the author writing is not', async () => {
    const { as, post, advance } = await setup();
    await post(A, { kind: 'bug' });
    await say(as, OWNER, 'p1', 'Which phone?');
    const first = (await as(A, 'GET', '/answers')).data.answers[0].at;
    advance(1000);
    await say(as, A, 'p1', 'A Pixel 7');
    expect((await as(A, 'GET', '/answers')).data.answers[0].at).toBe(first);
  });

  it('refuses nonsense and retries', async () => {
    const { as, post } = await setup();
    await post(A, { kind: 'bug' });
    expect((await as(OWNER, 'POST', '/posts/p1/messages', { id: 'x', text: '' })).status).toBe(400);
    expect((await as(OWNER, 'POST', '/posts/p1/messages', { id: 'x', text: 'y'.repeat(301) })).status).toBe(400);
    expect((await as(OWNER, 'POST', '/posts/p1/messages', { text: 'no id' })).status).toBe(400);
    expect((await as(OWNER, 'POST', '/posts/p1/messages', { id: 'x', text: 'Hi' })).status).toBe(200);
    expect((await as(OWNER, 'POST', '/posts/p1/messages', { id: 'x', text: 'Hi' })).data.error).toBe('duplicate');
    expect((await as(OWNER, 'POST', '/posts/nope/messages', { id: 'y', text: 'Hi' })).data.error).toBe('no_post');
    expect((await as(OWNER, 'PATCH', '/posts/p1/messages/nope', { text: 'Hi' })).data.error).toBe('not_found');
  });

  it('a widget from before conversations still answers with `reply`, without repeating itself', async () => {
    const { as, post } = await setup();
    await post(A, { kind: 'bug' });
    await as(OWNER, 'POST', '/posts/p1/manage', { reply: 'Which phone?' });
    await say(as, A, 'p1', 'A Pixel 7');
    // Such a widget sends its reply box with every save, unchanged.
    await as(OWNER, 'POST', '/posts/p1/manage', { status: 'planned', reply: 'Which phone?' });
    expect(await thread(as)).toEqual(['app: Which phone?', 'author: A Pixel 7']);
    // New words after the author's answer are a new message, and `reply` follows.
    await as(OWNER, 'POST', '/posts/p1/manage', { reply: 'Thanks, found it' });
    expect(await thread(as)).toEqual(['app: Which phone?', 'author: A Pixel 7', 'app: Thanks, found it']);
    expect((await as(B, 'GET', '/posts')).data.posts[0].reply.text).toBe('Thanks, found it');
  });
});

describe('fixes', () => {
  const FIX = { version: '1.4.2', link: 'https://github.com/me/app/pull/42' };

  it('an owner marks a bug done with where the fix is, and everybody sees it', async () => {
    const { as, call, post } = await setup();
    await post(A, { kind: 'bug', text: 'Send does nothing' });
    const res = await as(OWNER, 'POST', '/posts/p1/manage', {
      status: 'done',
      fix: { version: ' 1.4.2 ', link: 'github.com/me/app/pull/42' },
    });
    expect(res.status).toBe(200);
    const read = await call('GET', '/v1/projects/board1/posts');
    expect(read.data.posts[0]).toMatchObject({ status: 'done', fix: FIX });
    // The author hears it, with the fix.
    expect((await as(A, 'GET', '/answers')).data.answers).toEqual([
      expect.objectContaining({ id: 'p1', status: 'done', fix: FIX }),
    ]);
  });

  it('refuses a link that is not on github.com or gitlab.com, a bad version, and a fix on anything not done', async () => {
    const { as, post } = await setup();
    await post(A, { kind: 'bug' });
    await post(B, { kind: 'review', rating: 4 });
    const manage = (id: string, body: object) => as(OWNER, 'POST', `/posts/${id}/manage`, body);
    expect((await manage('p1', { status: 'done', fix: { link: 'https://evil.example/pull/1' } })).status).toBe(400);
    expect((await manage('p1', { status: 'done', fix: { version: '1.4 beta' } })).status).toBe(400);
    expect((await manage('p1', { status: 'planned', fix: FIX })).status).toBe(400);
    expect((await manage('p2', { fix: FIX })).status).toBe(400);
    expect((await manage('p1', { status: 'done', fix: 'yes' })).status).toBe(400);
    expect((await as(A, 'GET', '/posts')).data.posts.every((p: any) => p.fix === undefined)).toBe(true);
  });

  it('takes a link to gitlab.com as well', async () => {
    const { as, call, post } = await setup();
    await post(A, { kind: 'bug' });
    const link = 'https://gitlab.com/me/app/-/merge_requests/7';
    expect((await as(OWNER, 'POST', '/posts/p1/manage', { status: 'done', fix: { link } })).status).toBe(200);
    expect((await call('GET', '/v1/projects/board1/posts')).data.posts[0].fix).toEqual({ link });
    const res = await as(OWNER, 'POST', '/updates', { id: 'u1', title: 'On GitLab', link: 'gitlab.com/me/app/-/releases/v2' });
    expect(res.data.update.link).toBe('https://gitlab.com/me/app/-/releases/v2');
  });

  it('goes when the post moves away from done, or when it is emptied', async () => {
    const { as, post } = await setup();
    await post(A, { kind: 'bug' });
    await as(OWNER, 'POST', '/posts/p1/manage', { status: 'done', fix: FIX });
    await as(OWNER, 'POST', '/posts/p1/manage', { status: 'planned' });
    expect((await as(A, 'GET', '/posts')).data.posts[0].fix).toBeUndefined();
    await as(OWNER, 'POST', '/posts/p1/manage', { status: 'done', fix: FIX });
    await as(OWNER, 'POST', '/posts/p1/manage', { fix: { version: '', link: '' } });
    expect((await as(A, 'GET', '/posts')).data.posts[0]).toMatchObject({ status: 'done' });
    expect((await as(A, 'GET', '/posts')).data.posts[0].fix).toBeUndefined();
  });
});

describe('updates', () => {
  const LINK = 'https://github.com/me/app/releases/tag/v1.4.2';
  const write = (as: any, w: ReturnType<typeof wallet>, over: Record<string, unknown> = {}) =>
    as(w, 'POST', '/updates', { id: 'u1', title: 'Switching accounts works again', link: LINK, ...over });

  it('are written by owners only, and read by anybody, signed in or not', async () => {
    const { as, call } = await setup();
    expect((await write(as, A)).data.error).toBe('not_owner');
    const res = await write(as, OWNER, { text: 'It follows the account you picked.', version: '1.4.2' });
    expect(res.status).toBe(200);
    const read = await call('GET', '/v1/projects/board1/updates');
    expect(read.status).toBe(200);
    expect(read.data.updates).toEqual([
      {
        id: 'u1',
        title: 'Switching accounts works again',
        text: 'It follows the account you picked.',
        version: '1.4.2',
        link: LINK,
        at: expect.any(Number),
        posts: [],
      },
    ]);
    // The board says there is something to read, and only once there is.
    expect((await call('GET', '/v1/projects/board1/posts')).data.updates).toBe(1);
    expect((await call('GET', '/v1/projects/board2/posts')).data.updates).toBeUndefined();
    expect((await call('GET', '/v1/projects/board2/updates')).data.updates).toEqual([]);
  });

  it('marks the bugs and ideas it fixed done, with its version and link, and leaves reviews alone', async () => {
    const { as, post } = await setup();
    await post(A, { kind: 'bug' });
    await post(B, { kind: 'idea' });
    await post(C, { kind: 'review', rating: 5 });
    await post(A, { kind: 'idea', text: 'Something else' });
    const res = await write(as, OWNER, { version: '1.4.2', posts: ['p1', 'p2', 'p3', 'nope', 'p1'] });
    expect(res.data.update.posts).toEqual(['p1', 'p2']);
    const posts = (await as(A, 'GET', '/posts')).data.posts;
    const byId = (id: string) => posts.find((p: any) => p.id === id);
    expect(byId('p1')).toMatchObject({ status: 'done', fix: { version: '1.4.2', link: LINK } });
    expect(byId('p2')).toMatchObject({ status: 'done', fix: { version: '1.4.2', link: LINK } });
    expect(byId('p3')).toMatchObject({ status: 'open' });
    expect(byId('p4')).toMatchObject({ status: 'open' });
    // Each author is told.
    expect((await as(B, 'GET', '/answers')).data.answers[0]).toMatchObject({ id: 'p2', status: 'done' });
  });

  it('name only the posts anybody can see', async () => {
    const { as, call, post } = await setup();
    await post(A, { kind: 'bug' });
    await post(B, { kind: 'bug' });
    await write(as, OWNER, { posts: ['p1', 'p2'] });
    await as(OWNER, 'POST', '/posts/p2/manage', { hidden: true });
    expect((await call('GET', '/v1/projects/board1/updates')).data.updates[0].posts).toEqual(['p1']);
  });

  it('refuses one without a title or a GitHub or GitLab link, or with too much', async () => {
    const { as } = await setup();
    for (const bad of [
      { title: '' },
      { title: 'x'.repeat(81) },
      { link: undefined },
      { link: 'https://bitbucket.org/me/app' },
      { version: 'not a version' },
      { text: 'x'.repeat(301) },
      { posts: 'p1' },
      { posts: Array.from({ length: 51 }, (_, i) => `p${i}`) },
      { id: '' },
    ]) {
      expect((await write(as, OWNER, bad)).status, JSON.stringify(bad).slice(0, 60)).toBe(400);
    }
  });

  it('refuses the same id twice without touching any post, and an owner can delete one', async () => {
    const { as, call, post } = await setup();
    await post(A, { kind: 'bug' });
    await write(as, OWNER);
    expect((await write(as, OWNER, { posts: ['p1'] })).status).toBe(409);
    expect((await as(A, 'GET', '/posts')).data.posts[0].status).toBe('open');

    expect((await as(A, 'DELETE', '/updates/u1')).data.error).toBe('not_owner');
    expect((await as(OWNER, 'DELETE', '/updates/u1')).status).toBe(200);
    expect((await as(OWNER, 'DELETE', '/updates/u1')).data.error).toBe('no_update');
    expect((await call('GET', '/v1/projects/board1/updates')).data.updates).toEqual([]);
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

describe('what a board allows screenshots to be', () => {
  const png = () => {
    const bytes = new Uint8Array(64);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    return { type: 'image/png', data: Buffer.from(bytes).toString('base64'), board: true };
  };

  it('`off` refuses any screenshot, whatever the widget asked, and the post without one goes through', async () => {
    const { call, post } = await setup({ rules: { screenshots: 'off' } });
    expect((await post(A, { kind: 'bug', shot: png() })).status).toBe(400);
    expect((await post(A, { kind: 'bug' })).status).toBe(200);
    expect((await call('GET', '/v1/projects/board1')).data.rules.screenshots).toBe('off');
  });

  it('`owners` keeps one for the owners even when the author ticked "everyone"', async () => {
    const { as, call, post } = await setup({ rules: { screenshots: 'owners' } });
    expect((await post(A, { id: 'b1', kind: 'bug', shot: png() })).status).toBe(200);
    expect((await call('GET', '/v1/projects/board1/posts')).data.posts[0].shot).toBeUndefined();
    expect((await call('GET', '/v1/projects/board1/posts/b1/shot')).status).toBe(404);
    expect((await as(OWNER, 'GET', '/posts')).data.posts[0]).toMatchObject({ shot: true, shotFor: 'owners' });
  });
});

describe('approving posts first', () => {
  it('shows a new post to its author and the owners only, marked as waiting', async () => {
    const { as, call, post } = await setup({ rules: { approve: true } });
    const sent = await post(A, { id: 'w1' });
    expect(sent.data).toMatchObject({ ok: true, pending: true });

    expect((await call('GET', '/v1/projects/board1/posts')).data.posts).toEqual([]);
    expect((await as(B, 'GET', '/posts')).data.posts).toEqual([]);
    expect((await as(A, 'GET', '/posts')).data.posts[0]).toMatchObject({ id: 'w1', mine: true, pending: true });
    expect((await as(OWNER, 'GET', '/posts')).data.posts[0]).toMatchObject({ id: 'w1', pending: true });
    // Nobody else can find it by its id either.
    expect((await as(B, 'POST', '/posts/w1/vote', { up: true })).status).toBe(404);
  });

  it("puts it on the board once an owner approves, and an owner's own post never waits", async () => {
    const { as, call, post } = await setup({ rules: { approve: true } });
    await post(A, { id: 'w1' });
    expect((await as(OWNER, 'POST', '/posts/w1/manage', { approved: true })).status).toBe(200);
    const board = (await call('GET', '/v1/projects/board1/posts')).data.posts;
    expect(board.map((p: { id: string }) => p.id)).toEqual(['w1']);
    expect(board[0].pending).toBeUndefined();
    expect((await as(B, 'POST', '/posts/w1/vote', { up: true })).data.votes).toBe(2);

    expect((await post(OWNER, { id: 'o1' })).data.pending).toBeUndefined();
    expect((await call('GET', '/v1/projects/board1/posts')).data.posts).toHaveLength(2);
  });

  it('counts a waiting post against the daily allowance, so waiting is no way around it', async () => {
    const { post } = await setup({ rules: { approve: true, perDay: 2 } });
    await post(A);
    await post(A);
    expect((await post(A)).data.error).toBe('too_many');
  });

  it('only owners approve', async () => {
    const { as, post } = await setup({ rules: { approve: true } });
    await post(A, { id: 'w1' });
    expect((await as(A, 'POST', '/posts/w1/manage', { approved: true })).status).toBe(403);
  });
});

describe('posts per IP address', () => {
  it('stops one address after its daily number, over every wallet, when the server sets one', async () => {
    const { post } = await setup({ postsPerIpDay: 2 });
    expect((await post(A)).status).toBe(200);
    expect((await post(B)).status).toBe(200);
    const third = await post(C);
    expect(third.status).toBe(429);
    expect(third.data.error).toBe('rate_limited');
  });

  it('is off unless set', async () => {
    const { post } = await setup();
    for (const w of [A, B, C]) expect((await post(w)).status).toBe(200);
  });
});
