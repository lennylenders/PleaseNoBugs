import { describe, expect, it } from 'vitest';
import { importBoard, ImportError } from './importer.js';
import { MemoryStore } from './memory-store.js';
import { newProject } from './projects.js';
import { wallet } from './test-helpers.js';

const A = wallet('a1');
const B = wallet('b2');
const OWNER = wallet('c3');

async function setup() {
  const store = new MemoryStore();
  const project = newProject({ id: 'p', name: 'P', origins: ['https://p.app'], owner: OWNER.address });
  await store.putProject(project);
  return { store, project };
}

const file = () => ({
  posts: [
    {
      id: 'post-1',
      author: A.address,
      anon: false,
      kind: 'idea',
      text: 'Dark mode',
      at: 1000,
      status: 'planned',
      votes: [A.address, B.address],
      reply: { text: 'Soon', at: 2000 },
      answeredAt: 2000,
    },
    { id: 'post-2', author: B.address, kind: 'bug', text: 'Crash', at: 3000, hidden: true, context: { host: 'nimiq-pay' } },
  ],
  names: { [A.address]: 'Alice' },
});

describe('importBoard', () => {
  it('brings posts, votes, answers and names across', async () => {
    const { store, project } = await setup();
    const report = await importBoard(store, project, file());
    expect(report).toEqual({ imported: 2, skipped: 0, votes: 1, names: 1 });

    const posts = await store.posts('p', B.key);
    const one = posts.find((p) => p.id === 'post-1')!;
    expect(one).toMatchObject({ votes: 2, voted: true, status: 'planned', anon: false, answeredAt: 2000 });
    expect(one.reply).toEqual({ text: 'Soon', at: 2000 });
    const two = posts.find((p) => p.id === 'post-2')!;
    expect(two).toMatchObject({ votes: 1, hidden: true, anon: true, context: { host: 'nimiq-pay' } });
    expect((await store.names('p', [A.key])).get(A.key)).toBe('Alice');
    // The author's answer reaches them on /answers like any other.
    expect(await store.answersFor('p', A.key, 10)).toEqual([{ id: 'post-1', text: 'Dark mode', at: 2000 }]);
  });

  it('is harmless to run twice', async () => {
    const { store, project } = await setup();
    await importBoard(store, project, file());
    const again = await importBoard(store, project, file());
    expect(again.imported).toBe(0);
    expect(again.skipped).toBe(2);
    expect((await store.posts('p', null)).find((p) => p.id === 'post-1')!.votes).toBe(2);
  });

  it('writes nothing when any post does not hold up, and says which', async () => {
    const { store, project } = await setup();
    const bad = file();
    (bad.posts[1] as Record<string, unknown>).kind = 'rant';
    await expect(importBoard(store, project, bad)).rejects.toThrow(ImportError);
    await expect(importBoard(store, project, bad)).rejects.toThrow(/posts\[1\]\.kind \(post-2\)/);
    expect(await store.posts('p', null)).toEqual([]);
  });

  it('refuses a file that is not one', async () => {
    const { store, project } = await setup();
    await expect(importBoard(store, project, { nope: [] })).rejects.toThrow(/posts/);
  });
});
