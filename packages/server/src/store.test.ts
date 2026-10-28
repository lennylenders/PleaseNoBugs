import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, type Project } from '@pleasenobugs/core';
import { MemoryStore } from './memory-store.js';
import { SqliteStore } from './sqlite-store.js';
import type { PostRow, Store } from './store.js';

/**
 * The contract every store has to meet. This suite is the definition of a
 * working store: a new one (Postgres, say) is added to `STORES` below and is
 * done when this passes.
 */
const STORES: [string, () => Store][] = [
  ['MemoryStore', () => new MemoryStore()],
  ['SqliteStore', () => new SqliteStore(':memory:')],
];

const project = (id: string, owners: string[]): Project => ({
  id,
  name: id,
  owners,
  origins: ['https://app.example'],
  rules: { ...DEFAULT_RULES, kinds: [...DEFAULT_RULES.kinds] },
  createdAt: 1,
});

const row = (over: Partial<PostRow> = {}): PostRow => ({
  projectId: 'p1',
  id: 'post1',
  author: 'NQA',
  anon: true,
  kind: 'idea',
  text: 'dark mode',
  at: 100,
  status: 'open',
  ...over,
});

describe.each(STORES)('%s', (_name, make) => {
  it('stores and reads back a project, and finds it by owner', async () => {
    const s = make();
    await s.putProject(project('p1', ['NQA', 'NQB']));
    await s.putProject(project('p2', ['NQB']));
    expect((await s.getProject('p1'))?.owners).toEqual(['NQA', 'NQB']);
    expect(await s.getProject('nope')).toBeNull();
    expect((await s.projectsOwnedBy('NQB')).map((p) => p.id).sort()).toEqual(['p1', 'p2']);
    expect((await s.projectsOwnedBy('NQA')).map((p) => p.id)).toEqual(['p1']);
  });

  it('replaces a project on a second put', async () => {
    const s = make();
    await s.putProject(project('p1', ['NQA']));
    await s.putProject({ ...project('p1', ['NQA']), name: 'renamed' });
    expect((await s.getProject('p1'))?.name).toBe('renamed');
  });

  it('counts the author’s own vote from the start', async () => {
    const s = make();
    expect(await s.createPost(row())).toBe(true);
    const [p] = await s.posts('p1', 'NQA');
    expect(p.votes).toBe(1);
    expect(p.voted).toBe(true);
    expect((await s.posts('p1', 'NQB'))[0].voted).toBe(false);
    expect((await s.posts('p1', null))[0].voted).toBe(false);
  });

  it('refuses a duplicate id without touching the first', async () => {
    const s = make();
    await s.createPost(row());
    expect(await s.createPost(row({ text: 'other' }))).toBe(false);
    expect((await s.getPost('p1', 'post1'))?.text).toBe('dark mode');
  });

  it('keeps boards apart: the same post id may exist on two projects', async () => {
    const s = make();
    await s.createPost(row());
    expect(await s.createPost(row({ projectId: 'p2' }))).toBe(true);
    expect(await s.posts('p1', null)).toHaveLength(1);
  });

  it('counts one vote per wallet however often it asks', async () => {
    const s = make();
    await s.createPost(row());
    expect(await s.vote('p1', 'post1', 'NQB', true)).toBe(2);
    expect(await s.vote('p1', 'post1', 'NQB', true)).toBe(2);
    expect(await s.vote('p1', 'post1', 'NQB', false)).toBe(1);
    expect(await s.vote('p1', 'post1', 'NQB', false)).toBe(1);
  });

  it('loses no votes when many arrive at once', async () => {
    const s = make();
    await s.createPost(row());
    await Promise.all(Array.from({ length: 20 }, (_, i) => s.vote('p1', 'post1', `NQ${i}`, true)));
    expect((await s.posts('p1', null))[0].votes).toBe(21);
  });

  it('patches only what it is given, and null removes', async () => {
    const s = make();
    await s.createPost(row({ context: { version: '1.0' } }));
    await s.updatePost('p1', 'post1', { status: 'planned', reply: { text: 'soon', at: 5 }, answeredAt: 5 });
    let p = await s.getPost('p1', 'post1');
    expect(p).toMatchObject({ status: 'planned', reply: { text: 'soon', at: 5 }, answeredAt: 5 });
    expect(p?.context).toEqual({ version: '1.0' });

    await s.updatePost('p1', 'post1', { reply: null, hidden: true });
    p = await s.getPost('p1', 'post1');
    expect(p?.reply).toBeUndefined();
    expect(p?.hidden).toBe(true);
    expect(p?.status).toBe('planned');

    await s.updatePost('p1', 'post1', { hidden: false });
    expect((await s.getPost('p1', 'post1'))?.hidden).toBeUndefined();
  });

  it('deletes a post with its votes', async () => {
    const s = make();
    await s.createPost(row());
    await s.vote('p1', 'post1', 'NQB', true);
    await s.deletePost('p1', 'post1');
    expect(await s.getPost('p1', 'post1')).toBeNull();
    // Recreated under the same id, it starts from the author's one vote again.
    await s.createPost(row());
    expect((await s.posts('p1', null))[0].votes).toBe(1);
  });

  it('counts posts by author and in total since a moment', async () => {
    const s = make();
    await s.createPost(row({ id: 'a', at: 100 }));
    await s.createPost(row({ id: 'b', at: 200 }));
    await s.createPost(row({ id: 'c', at: 300, author: 'NQB' }));
    expect(await s.countByAuthorSince('p1', 'NQA', 150)).toBe(1);
    expect(await s.countByAuthorSince('p1', 'NQA', 0)).toBe(2);
    expect(await s.countSince('p1', 150)).toBe(2);
  });

  it('lists only answered posts, newest answer first, capped', async () => {
    const s = make();
    await s.createPost(row({ id: 'a' }));
    await s.createPost(row({ id: 'b' }));
    await s.createPost(row({ id: 'c' }));
    await s.createPost(row({ id: 'd', author: 'NQB' }));
    await s.updatePost('p1', 'a', { answeredAt: 10 });
    await s.updatePost('p1', 'b', { answeredAt: 30 });
    await s.updatePost('p1', 'd', { answeredAt: 50 });
    expect(await s.answersFor('p1', 'NQA', 10)).toEqual([
      { id: 'b', text: 'dark mode', at: 30 },
      { id: 'a', text: 'dark mode', at: 10 },
    ]);
    expect(await s.answersFor('p1', 'NQA', 1)).toHaveLength(1);
  });

  it('keeps names per wallet per project, and clears them', async () => {
    const s = make();
    await s.setName('p1', 'NQA', 'Alice');
    await s.setName('p2', 'NQA', 'Al');
    expect((await s.names('p1', ['NQA', 'NQB'])).get('NQA')).toBe('Alice');
    expect((await s.names('p1', ['NQA', 'NQB'])).has('NQB')).toBe(false);
    expect((await s.names('p2', ['NQA'])).get('NQA')).toBe('Al');
    await s.setName('p1', 'NQA', undefined);
    expect((await s.names('p1', ['NQA'])).size).toBe(0);
    expect((await s.names('p1', [])).size).toBe(0);
  });

  it('lists every project', async () => {
    const s = make();
    await s.putProject(project('p1', ['NQA']));
    await s.putProject(project('p2', ['NQB']));
    expect((await s.projects()).map((p) => p.id).sort()).toEqual(['p1', 'p2']);
  });

  it('keeps a review’s stars, and knows who already wrote one', async () => {
    const s = make();
    await s.createPost(row({ id: 'r1', kind: 'review', rating: 4 }));
    await s.createPost(row({ id: 'i1' }));
    const posts = await s.posts('p1', null);
    expect(posts.find((p) => p.id === 'r1')?.rating).toBe(4);
    expect(posts.find((p) => p.id === 'i1')?.rating).toBeUndefined();
    expect(await s.hasPostOfKind('p1', 'NQA', 'review')).toBe(true);
    expect(await s.hasPostOfKind('p1', 'NQB', 'review')).toBe(false);
    expect(await s.hasPostOfKind('p2', 'NQA', 'review')).toBe(false);
  });

  it('keeps a screenshot apart, says it is there, and loses it with the post', async () => {
    const s = make();
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
    await s.createPost(row({ id: 'b1', kind: 'bug' }), { type: 'image/png', data });
    await s.createPost(row({ id: 'b2', kind: 'bug' }));
    const posts = await s.posts('p1', null);
    expect(posts.find((p) => p.id === 'b1')?.shot).toBe(true);
    expect(posts.find((p) => p.id === 'b2')?.shot).toBe(false);
    const shot = await s.getShot('p1', 'b1');
    expect(shot?.type).toBe('image/png');
    expect([...(shot?.data ?? [])]).toEqual([...data]);
    expect(await s.getShot('p2', 'b1')).toBeNull();

    await s.deleteShot('p1', 'b1');
    expect(await s.getShot('p1', 'b1')).toBeNull();
    expect(await s.getPost('p1', 'b1')).not.toBeNull();

    await s.createPost(row({ id: 'b3', kind: 'bug' }), { type: 'image/png', data });
    await s.deletePost('p1', 'b3');
    expect(await s.getShot('p1', 'b3')).toBeNull();
  });

  it('counts a board for telemetry: done is fixed or built, hidden is not counted', async () => {
    const s = make();
    expect(await s.projectStats('p1')).toEqual({ bugs: 0, ideas: 0, bugsDone: 0, ideasDone: 0 });
    await s.createPost(row({ id: 'b1', kind: 'bug', status: 'done' }));
    await s.createPost(row({ id: 'b2', kind: 'bug', status: 'planned' }));
    await s.createPost(row({ id: 'b3', kind: 'bug', status: 'done', hidden: true }));
    await s.createPost(row({ id: 'i1', kind: 'idea', status: 'done' }));
    await s.createPost(row({ id: 'i2', kind: 'idea', status: 'declined' }));
    await s.createPost(row({ id: 'other', projectId: 'p2', kind: 'bug' }));
    // Reviews are neither, and the telemetry promises four numbers.
    await s.createPost(row({ id: 'r1', kind: 'review', rating: 5 }));
    expect(await s.projectStats('p1')).toEqual({ bugs: 2, ideas: 2, bugsDone: 1, ideasDone: 1 });
  });

  it('keeps a little metadata', async () => {
    const s = make();
    expect(await s.getMeta('instance')).toBeNull();
    await s.setMeta('instance', 'abc');
    await s.setMeta('instance', 'def');
    expect(await s.getMeta('instance')).toBe('def');
  });

  it('keeps the latest telemetry per installation and project', async () => {
    const s = make();
    const t = { instance: 'i1', project: 'Shitti', version: '0.1.0', bugs: 1, ideas: 2, bugsDone: 0, ideasDone: 1, receivedAt: 10 };
    await s.putTelemetry(t);
    await s.putTelemetry({ ...t, bugs: 5, receivedAt: 20 });
    await s.putTelemetry({ ...t, project: 'Other' });
    const rows = await s.telemetry();
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.project === 'Shitti')).toMatchObject({ bugs: 5, receivedAt: 20 });
  });

  it('remembers what each owner has seen', async () => {
    const s = make();
    expect(await s.getSeen('p1', 'NQA')).toBe(0);
    await s.setSeen('p1', 'NQA', 500);
    await s.setSeen('p1', 'NQA', 700);
    expect(await s.getSeen('p1', 'NQA')).toBe(700);
    expect(await s.getSeen('p1', 'NQB')).toBe(0);
  });
});

describe('SqliteStore, opening a file an older version wrote', () => {
  it('adds reviews to projects on the old default, and leaves a project that chose otherwise', async () => {
    const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');
    const dir = mkdtempSync(join(tmpdir(), 'pnb-'));
    const file = join(dir, 'old.db');
    // What 0.1.1 left behind: schema 1, no rating column, no shots table.
    const old = new DatabaseSync(file);
    old.exec(`
      CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE projects (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE posts (
        project_id TEXT NOT NULL, id TEXT NOT NULL, author TEXT NOT NULL, anon INTEGER NOT NULL,
        kind TEXT NOT NULL, text TEXT NOT NULL, at INTEGER NOT NULL, status TEXT NOT NULL,
        reply_text TEXT, reply_at INTEGER, hidden INTEGER NOT NULL DEFAULT 0, context TEXT,
        answered_at INTEGER, PRIMARY KEY (project_id, id)
      );
      INSERT INTO meta (key, value) VALUES ('schema', '1');
      INSERT INTO posts (project_id, id, author, anon, kind, text, at, status)
        VALUES ('p1', 'old', 'NQA', 1, 'idea', 'from before', 1, 'open');
    `);
    const insert = old.prepare('INSERT INTO projects (id, data) VALUES (?, ?)');
    insert.run('p1', JSON.stringify({ ...project('p1', ['NQA']), rules: { ...DEFAULT_RULES, kinds: ['bug', 'idea'] } }));
    insert.run('p2', JSON.stringify({ ...project('p2', ['NQA']), rules: { ...DEFAULT_RULES, kinds: ['bug'] } }));
    old.close();

    const s = new SqliteStore(file);
    try {
      expect((await s.getProject('p1'))?.rules.kinds).toEqual(['bug', 'idea', 'review']);
      expect((await s.getProject('p2'))?.rules.kinds).toEqual(['bug']);
      expect(await s.getMeta('schema')).toBe('2');
      expect((await s.posts('p1', null))[0]).toMatchObject({ id: 'old', shot: false });
      expect(await s.createPost(row({ id: 'r1', kind: 'review', rating: 3 }))).toBe(true);
    } finally {
      s.close();
    }
    // A second open changes nothing: a project the owner later narrowed stays narrowed.
    const again = new SqliteStore(file);
    await again.putProject({ ...project('p1', ['NQA']), rules: { ...DEFAULT_RULES, kinds: ['bug', 'idea'] } });
    again.close();
    const third = new SqliteStore(file);
    expect((await third.getProject('p1'))?.rules.kinds).toEqual(['bug', 'idea']);
    third.close();
    rmSync(dir, { recursive: true, force: true });
  });
});
