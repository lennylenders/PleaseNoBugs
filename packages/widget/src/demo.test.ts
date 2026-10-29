import { describe, expect, it } from 'vitest';
import { createDemoClient } from './demo.js';

describe('createDemoClient', () => {
  it('reads a board in the language asked, signed in as a non-owner', async () => {
    const res = await createDemoClient('nl').board();
    if (!res.ok) throw new Error('no board');
    expect(res.data.posts.length).toBeGreaterThan(3);
    expect(res.data.posts[0].text).toMatch(/donkere modus/);
    expect(res.data.me).toMatchObject({ owner: false, left: 5 });
  });

  it('falls back to English for a language it has no posts in', async () => {
    const res = await createDemoClient('fr').board();
    expect(res.ok && res.data.posts[0].text).toMatch(/dark mode/);
  });

  it('counts a vote once, however often it is cast', async () => {
    const c = createDemoClient();
    const first = await c.vote('demo-3', true);
    const again = await c.vote('demo-3', true);
    expect(first.ok && first.data.votes).toBe(13);
    expect(again.ok && again.data.votes).toBe(13);
    const back = await c.vote('demo-3', false);
    expect(back.ok && back.data).toMatchObject({ votes: 12, voted: false });
  });

  it('puts a new post on top, as mine, and takes one review per visitor', async () => {
    const c = createDemoClient();
    await c.setName('Fons');
    const sent = await c.post({ id: 'x', kind: 'review', text: 'Nice', rating: 4 });
    expect(sent.ok && sent.data.left).toBe(4);
    const res = await c.board();
    expect(res.ok && res.data.posts[0]).toMatchObject({ id: 'x', mine: true, who: 'Fons', rating: 4, votes: 1 });
    const twice = await c.post({ id: 'y', kind: 'review', text: 'Again', rating: 5 });
    expect(twice).toMatchObject({ ok: false, error: 'reviewed' });
  });

  it('stops at the daily allowance', async () => {
    const c = createDemoClient();
    for (let i = 0; i < 5; i++) await c.post({ id: `p${i}`, kind: 'idea', text: 'More' });
    expect(await c.post({ id: 'p5', kind: 'idea', text: 'More' })).toMatchObject({ ok: false, error: 'too_many' });
  });

  it('shows the visitor their own screenshot on the board, and never hands out owner tools', async () => {
    const c = createDemoClient();
    const data = btoa('\x89PNG');
    await c.post({ id: 'b1', kind: 'bug', text: 'Broken', shot: { type: 'image/png', data, board: true } });
    await c.post({ id: 'b2', kind: 'bug', text: 'Also broken', shot: { type: 'image/png', data } });
    const read = await c.board();
    const posts = read.ok ? read.data.posts : [];
    expect(posts.find((p) => p.id === 'b1')?.shot).toBe(true);
    expect(posts.find((p) => p.id === 'b2')?.shot).toBeUndefined();
    expect(c.shotUrl('b1')).toBe(`data:image/png;base64,${data}`);
    expect(await c.shot('b2')).toMatchObject({ ok: false });
    expect(await c.shot('demo-0')).toMatchObject({ ok: false });
    expect(await c.manage('demo-0', { status: 'done' })).toMatchObject({ ok: false, error: 'not_owner' });
  });
});
