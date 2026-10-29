import { describe, expect, it } from 'vitest';
import type { BoardRead, Post } from '@pleasenobugs/core';
import { forReaders } from './readonly.js';

const post = (p: Partial<Post>): Post => ({
  id: 'p',
  kind: 'bug',
  text: 'Broken',
  at: 0,
  status: 'open',
  votes: 1,
  voted: false,
  mine: false,
  ...p,
});

const read: BoardRead = {
  project: { id: 'x', name: 'App', rules: { perDay: 5, textMax: 200, replyMax: 300, kinds: ['bug', 'idea', 'review'] } },
  posts: [
    post({ id: 'named', who: 'Fons', mine: true, voted: true }),
    post({ id: 'pic', shot: true, shotFor: 'board', context: { version: '1.0' } }),
    post({ id: 'gone', hidden: true }),
    post({ id: 'stars', kind: 'review', rating: 4, reply: { text: 'Thanks', at: 1 } }),
  ],
  me: { owner: true, left: 5 },
};

describe('forReaders', () => {
  it('shows every post anonymous, without screenshots, to nobody in particular', () => {
    const out = forReaders(read);
    expect(out.me).toBeUndefined();
    expect(out.posts.map((p) => p.id)).toEqual(['named', 'pic', 'stars']);
    for (const p of out.posts) {
      expect(p).not.toHaveProperty('who');
      expect(p).not.toHaveProperty('shot');
      expect(p).not.toHaveProperty('shotFor');
      expect(p).not.toHaveProperty('context');
      expect(p).toMatchObject({ mine: false, voted: false });
    }
  });

  it('keeps what the board is for: the words, the stars, the votes and the answer', () => {
    const stars = forReaders(read).posts.find((p) => p.id === 'stars');
    expect(stars).toMatchObject({ text: 'Broken', rating: 4, votes: 1, reply: { text: 'Thanks' } });
  });
});
