import { afterEach, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { createApp } from './app.js';
import { bootstrapProject, describeBootstrapProblem, type BootstrapProblem } from './bootstrap.js';
import { MemoryStore } from './memory-store.js';
import { newProject } from './projects.js';
import { buildReport, readReport, sendReport, summarize, telemetryNotice } from './telemetry.js';
import { wallet } from './test-helpers.js';

const OWNER = wallet('c3');
let stop: (() => void) | null = null;
afterEach(() => {
  stop?.();
  stop = null;
});

async function boardWithPosts() {
  const store = new MemoryStore();
  await store.putProject(newProject({ id: 'p', name: 'Shitti', origins: ['https://shitti.me'], owner: OWNER.address }));
  const post = (id: string, kind: 'bug' | 'idea', status: 'open' | 'done', extra = {}) =>
    store.createPost({ projectId: 'p', id, author: 'NQSECRETWALLET', anon: false, kind, text: `secret text ${id}`, at: 1, status, ...extra });
  await post('a', 'bug', 'done');
  await post('b', 'bug', 'open');
  await post('c', 'idea', 'done');
  await post('spam', 'idea', 'open', { hidden: true });
  await store.setName('p', 'NQSECRETWALLET', 'Secret Name');
  return store;
}

describe('the report a server sends', () => {
  it('is names and numbers, and nothing that identifies a person', async () => {
    const store = await boardWithPosts();
    const report = await buildReport(store, '0.1.0');
    expect(report.projects).toEqual([{ name: 'Shitti', bugs: 2, ideas: 1, bugsDone: 1, ideasDone: 1 }]);
    const wire = JSON.stringify(report);
    expect(wire).not.toContain('secret');
    expect(wire).not.toContain('NQSECRETWALLET');
    expect(wire).not.toContain('Secret Name');
    expect(wire).not.toContain('shitti.me');
    expect(wire).not.toContain(OWNER.key);
  });

  it('keeps one installation id for good', async () => {
    const store = await boardWithPosts();
    expect((await buildReport(store, 'x')).instance).toBe((await buildReport(store, 'x')).instance);
  });

  it('says out loud what it sends and how to stop it', () => {
    const notice = telemetryNotice('https://collector.example/telemetry');
    expect(notice).toContain('https://collector.example/telemetry');
    expect(notice).toContain('PNB_TELEMETRY=off');
  });
});

describe('the collector', () => {
  async function collector(collect = true) {
    const store = new MemoryStore();
    const srv = createApp({ store, collect }).listen(0);
    await new Promise<void>((r) => srv.once('listening', () => r()));
    stop = () => srv.close();
    return { store, url: `http://127.0.0.1:${(srv.address() as AddressInfo).port}` };
  }

  it('takes a report and answers totals, never names', async () => {
    const { url, store } = await collector();
    const report = await buildReport(await boardWithPosts(), '0.1.0');
    expect(await sendReport(`${url}/telemetry`, report)).toBe(true);
    // Sent again tomorrow, the same numbers do not count twice.
    expect(await sendReport(`${url}/telemetry`, report)).toBe(true);
    const res = await fetch(`${url}/telemetry/summary`);
    const raw = await res.text();
    expect(JSON.parse(raw)).toEqual({ installations: 1, projects: 1, bugs: 2, ideas: 1, bugsDone: 1, ideasDone: 1 });
    expect(raw).not.toContain('Shitti');
    // The names are on the server, for the CLI.
    expect((await store.telemetry())[0].project).toBe('Shitti');
  });

  it('refuses nonsense', async () => {
    const { url } = await collector();
    const bad = await fetch(`${url}/telemetry`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ instance: 'x', version: '1', projects: [] }),
    });
    expect(bad.status).toBe(400);
  });

  it('does not exist on a server that does not collect', async () => {
    const { url } = await collector(false);
    expect((await fetch(`${url}/telemetry/summary`)).status).toBe(404);
  });
});

describe('readReport', () => {
  const ok = { instance: '0f3c9a2e-1111-4222-8333-944455556666', version: '0.1.0', projects: [{ name: 'A', bugs: 3, ideas: 2, bugsDone: 1, ideasDone: 2 }] };
  it('takes a well-formed report', () => {
    expect(readReport(ok)).toEqual(ok);
  });
  it('refuses more done than there is, negative numbers and too many projects', () => {
    expect(readReport({ ...ok, projects: [{ ...ok.projects[0], bugsDone: 4 }] })).toBeNull();
    expect(readReport({ ...ok, projects: [{ ...ok.projects[0], bugs: -1 }] })).toBeNull();
    expect(readReport({ ...ok, projects: Array(21).fill(ok.projects[0]) })).toBeNull();
    expect(readReport({ ...ok, instance: 'not ok!' })).toBeNull();
  });
});

describe('summarize', () => {
  it('keeps a quiet server’s numbers in the totals but stops counting it as an installation', () => {
    const day = 86_400_000;
    const row = { project: 'A', version: '1', bugs: 1, ideas: 1, bugsDone: 1, ideasDone: 0 };
    const s = summarize(
      [
        { ...row, instance: 'live', receivedAt: 100 * day },
        { ...row, instance: 'gone', receivedAt: 10 * day },
      ],
      100 * day,
    );
    expect(s).toEqual({ installations: 1, projects: 2, bugs: 2, ideas: 2, bugsDone: 2, ideasDone: 0 });
  });
});

describe('bootstrapProject', () => {
  const env = {
    PNB_PROJECT_NAME: 'My app',
    PNB_PROJECT_ORIGINS: 'https://my.app, http://localhost:5173',
    PNB_PROJECT_OWNER: OWNER.address,
  };

  it('makes the first project on an empty server', async () => {
    const store = new MemoryStore();
    const result = await bootstrapProject(store, env);
    expect('created' in result && result.created).toMatchObject({
      name: 'My app',
      origins: ['https://my.app', 'http://localhost:5173'],
      owners: [OWNER.key],
    });
  });

  it('takes a board for a public page: no screenshots, posts waiting for approval', async () => {
    const store = new MemoryStore();
    const result = await bootstrapProject(store, { ...env, PNB_PROJECT_SCREENSHOTS: 'off', PNB_PROJECT_APPROVE: 'on' });
    expect('created' in result && result.created.rules).toMatchObject({ screenshots: 'off', approve: true });
    const plain = await bootstrapProject(new MemoryStore(), env);
    expect('created' in plain && plain.created.rules).toMatchObject({ screenshots: 'board', approve: false });
    expect(await bootstrapProject(new MemoryStore(), { ...env, PNB_PROJECT_SCREENSHOTS: 'none' })).toEqual({
      invalid: 'PNB_PROJECT_SCREENSHOTS',
      got: 'none',
    });
    expect(await bootstrapProject(new MemoryStore(), { ...env, PNB_PROJECT_APPROVE: 'yes' })).toMatchObject({
      invalid: 'PNB_PROJECT_APPROVE',
    });
  });

  it('never makes a second one', async () => {
    const store = new MemoryStore();
    await bootstrapProject(store, env);
    expect(await bootstrapProject(store, { ...env, PNB_PROJECT_NAME: 'Again' })).toEqual({ skipped: 'has_projects' });
    expect(await store.projects()).toHaveLength(1);
  });

  it('does nothing when not configured, and names the variable that is wrong', async () => {
    const store = new MemoryStore();
    expect(await bootstrapProject(store, {})).toEqual({ skipped: 'not_configured' });
    expect(await bootstrapProject(store, { ...env, PNB_PROJECT_OWNER: 'nope' })).toEqual({
      invalid: 'PNB_PROJECT_OWNER',
      got: 'nope',
    });
    expect(await store.projects()).toHaveLength(0);
  });

  it('says what it got, and points at a name with a stray space', async () => {
    const store = new MemoryStore();
    const { PNB_PROJECT_ORIGINS: origins, ...rest } = env;
    const spaced = await bootstrapProject(store, { ...rest, 'PNB_PROJECT_ORIGINS ': origins });
    expect(spaced).toEqual({ invalid: 'PNB_PROJECT_ORIGINS', lookalike: 'PNB_PROJECT_ORIGINS ' });
    expect(describeBootstrapProblem(spaced as BootstrapProblem)).toContain(
      'PNB_PROJECT_ORIGINS is not set, but "PNB_PROJECT_ORIGINS " is',
    );

    const missing = await bootstrapProject(store, rest);
    expect(describeBootstrapProblem(missing as BootstrapProblem)).toMatch(/^no project created: PNB_PROJECT_ORIGINS is not set\. Expected/);

    const bad = await bootstrapProject(store, { ...env, PNB_PROJECT_ORIGINS: 'my.app' });
    expect(describeBootstrapProblem(bad as BootstrapProblem)).toContain('PNB_PROJECT_ORIGINS does not hold up: got "my.app".');
    expect(await store.projects()).toHaveLength(0);
  });

  it('does not mistake three misspelled names for a server nobody configured', async () => {
    const store = new MemoryStore();
    const spaced = Object.fromEntries(Object.entries(env).map(([k, v]) => [`${k} `, v]));
    expect(await bootstrapProject(store, spaced)).toEqual({ invalid: 'PNB_PROJECT_NAME', lookalike: 'PNB_PROJECT_NAME ' });
  });

  it('takes an app login', async () => {
    const store = new MemoryStore();
    const result = await bootstrapProject(store, { ...env, PNB_PROJECT_LOGIN_MESSAGE: 'Sign in to My app' });
    expect('created' in result && result.created.loginMessages).toEqual(['Sign in to My app']);
  });
});
