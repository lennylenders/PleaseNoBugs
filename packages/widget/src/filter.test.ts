import { describe, expect, it } from 'vitest';
import type { Message, Post } from '@pleasenobugs/core';
import { NO_FILTER, filtersOn, findIn, marks, matchesFilter, snippet } from './filter.js';

const post = (over: Partial<Post> = {}): Post => ({
  id: 'p',
  kind: 'bug',
  text: 'The camera opens black',
  at: 1,
  status: 'open',
  votes: 1,
  voted: false,
  mine: false,
  ...over,
});
const msg = (from: Message['from'], text: string, over: Partial<Message> = {}): Message => ({
  id: text,
  from,
  text,
  at: 1,
  ...over,
});

describe('matchesFilter', () => {
  it('lets everything through with nothing on', () => {
    expect(matchesFilter(post(), NO_FILTER)).toBe(true);
    expect(filtersOn(NO_FILTER)).toBe(0);
  });

  it('matches any choice inside a group and every group at once', () => {
    const f = { ...NO_FILTER, kinds: ['bug', 'idea'] as const, statuses: ['planned'] as const };
    const both = { ...f, kinds: [...f.kinds], statuses: [...f.statuses] };
    expect(matchesFilter(post({ status: 'planned' }), both)).toBe(true);
    expect(matchesFilter(post({ kind: 'idea', status: 'planned' }), both)).toBe(true);
    expect(matchesFilter(post({ status: 'open' }), both)).toBe(false);
    expect(filtersOn(both)).toBe(3);
  });

  it('leaves reviews out once a status is chosen: they have none', () => {
    const f = { ...NO_FILTER, statuses: ['open' as const] };
    expect(matchesFilter(post({ kind: 'review' }), f)).toBe(false);
  });

  it('narrows to your own, and an owner to what waits on them', () => {
    expect(matchesFilter(post({ mine: true }), { ...NO_FILTER, mine: true })).toBe(true);
    expect(matchesFilter(post(), { ...NO_FILTER, mine: true })).toBe(false);
    const waiting = { ...NO_FILTER, own: ['waiting' as const] };
    expect(matchesFilter(post({ thread: [msg('app', 'Which phone?'), msg('author', 'A Pixel')] }), waiting)).toBe(true);
    expect(matchesFilter(post({ thread: [msg('app', 'Which phone?')] }), waiting)).toBe(false);
    // An answer an owner took off the board waits on nobody.
    expect(matchesFilter(post({ thread: [msg('app', 'Q'), msg('author', 'rude', { hidden: true })] }), waiting)).toBe(false);
    expect(matchesFilter(post({ hidden: true }), { ...NO_FILTER, own: ['hidden'] })).toBe(true);
  });
});

describe('findIn', () => {
  it('finds every word, in the post or in its conversation', () => {
    const p = post({ thread: [msg('app', 'Which phone?'), msg('author', 'A Pixel 7, every time')] });
    expect(findIn(p, 'camera')).toEqual({ in: 'text' });
    expect(findIn(p, 'PIXEL')).toEqual({ in: 'thread', message: p.thread![1] });
    expect(findIn(p, 'camera pixel')).toMatchObject({ in: 'thread', message: { text: 'A Pixel 7, every time' } });
    expect(findIn(p, 'samsung')).toBeNull();
    expect(findIn(p, '   ')).toEqual({ in: 'text' });
  });

  it('never finds a post by words an owner took off the board', () => {
    const p = post({ thread: [msg('app', 'Q'), msg('author', 'something rude', { hidden: true })] });
    expect(findIn(p, 'rude')).toBeNull();
  });
});

describe('snippet and marks', () => {
  it('cuts a long text around the first word searched for', () => {
    expect(snippet('Short', 'x')).toBe('Short');
    expect(snippet('Only on my old Samsung. My new phone is fine.', 'phone', 24)).toBe('…My new phone is fine.');
  });

  it('marks every place a word was found, whatever its case', () => {
    expect(marks('My Pixel 6', 'pixel')).toEqual([
      { text: 'My ', hit: false },
      { text: 'Pixel', hit: true },
      { text: ' 6', hit: false },
    ]);
    expect(marks('abc', '')).toEqual([{ text: 'abc', hit: false }]);
  });
});
