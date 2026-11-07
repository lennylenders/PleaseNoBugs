import { describe, expect, it } from 'vitest';
import { doneLabel, statusLabel } from './ui/PostCard.js';

describe('doneLabel', () => {
  it('calls a done bug fixed and a done idea done', () => {
    expect(doneLabel(['bug'])).toBe('board.statusFixed');
    expect(doneLabel(['idea'])).toBe('board.statusDone');
  });

  it('names both when bugs and ideas are in view, reviews aside', () => {
    expect(doneLabel(['bug', 'idea'])).toBe('board.statusFixedOrDone');
    expect(doneLabel(['bug', 'idea', 'review'])).toBe('board.statusFixedOrDone');
    expect(doneLabel(['bug', 'review'])).toBe('board.statusFixed');
  });

  it('leaves every other status its own word', () => {
    expect(statusLabel({ kind: 'bug', status: 'done' }, 'board.statusDone')).toBe('board.statusFixed');
    expect(statusLabel({ kind: 'bug', status: 'planned' }, 'board.statusPlanned')).toBe('board.statusPlanned');
    expect(statusLabel({ kind: 'idea', status: 'done' }, 'board.statusDone')).toBe('board.statusDone');
  });
});
