import { describe, expect, it } from 'vitest';
import { createMatcher } from './similar.js';
import { sortPosts } from './sort.js';
import { cleanContext, CONTEXT_MAX_KEYS, CONTEXT_VALUE_MAX } from './rules.js';

const post = (text: string, votes = 1, at = 0) => ({ text, votes, at });

describe('createMatcher', () => {
  const posts = [
    post('De camera opent niet bij het bewijs', 4),
    post('Donkere modus voor de instellingen', 2),
    post('Camera blijft zwart na openen', 1),
  ];

  it('finds a post sharing two meaningful words', () => {
    const likeThis = createMatcher();
    expect(likeThis(posts, 'camera opent zomaar niet bij bewijs')[0]).toBe(posts[0]);
  });

  it('needs two words, because one catches everything', () => {
    const likeThis = createMatcher();
    expect(likeThis(posts, 'camera')).toEqual([]);
  });

  it('ignores filler in all three languages', () => {
    const likeThis = createMatcher();
    expect(likeThis([post('this should have more')], 'this should have more')).toEqual([]);
    expect(likeThis([post('bitte nicht mehr')], 'bitte nicht mehr')).toEqual([]);
  });

  it('ignores the project’s own vocabulary, which is what makes it per project', () => {
    const board = [post('taken lijst laden traag')];
    expect(createMatcher()(board, 'taken lijst kapot')).toHaveLength(1);
    expect(createMatcher(['taken', 'lijst'])(board, 'taken lijst kapot')).toEqual([]);
  });

  it('puts the closer match first, then the more wanted one', () => {
    const likeThis = createMatcher();
    const a = post('knop opslaan werkt niet goed', 9);
    const b = post('knop opslaan werkt niet goed meteen', 1);
    expect(likeThis([a, b], 'knop opslaan werkt meteen')).toEqual([b, a]);
  });
});

describe('sortPosts', () => {
  const old = post('old', 5, 1);
  const fresh = post('fresh', 1, 3);
  const tie = post('tie', 5, 2);

  it('top: most votes, ties newest first', () => {
    expect(sortPosts([old, fresh, tie], 'top')).toEqual([tie, old, fresh]);
  });
  it('new: newest first, whatever the votes', () => {
    expect(sortPosts([old, fresh, tie], 'new')).toEqual([fresh, tie, old]);
  });
  it('leaves the input alone', () => {
    const input = [old, fresh];
    sortPosts(input, 'new');
    expect(input).toEqual([old, fresh]);
  });
});

describe('cleanContext', () => {
  it('keeps strings and drops the rest rather than refusing the post', () => {
    expect(cleanContext({ version: '1.0', n: 3, host: 'nimiq-pay' })).toEqual({
      version: '1.0',
      host: 'nimiq-pay',
    });
  });
  it('caps keys and value length', () => {
    const many = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${i}`, 'x'.repeat(500)]));
    const out = cleanContext(many)!;
    expect(Object.keys(out)).toHaveLength(CONTEXT_MAX_KEYS);
    expect(out.k0).toHaveLength(CONTEXT_VALUE_MAX);
  });
  it('answers null for anything that is not an object', () => {
    expect(cleanContext('x')).toBeNull();
    expect(cleanContext(['a'])).toBeNull();
    expect(cleanContext(null)).toBeNull();
  });
});
