import type { BoardRead } from '@pleasenobugs/core';

/**
 * A board as `readonly` shows it: everybody anonymous, no screenshots, and
 * nobody signed in.
 *
 * A read-only board is shown somewhere other than the app it belongs to (the
 * website, one day, showing other apps' boards). Its authors chose to show a
 * name, or a screenshot, on that app's board, not on a page they may never
 * have heard of, so both stay behind. Done here rather than in the cards, so
 * nothing further down can show what was never handed to it.
 *
 * @example
 * forReaders({ project, posts: [{ ...post, who: 'Fons', shot: true }] })
 * // → { project, posts: [{ ...post }] }   (no `who`, no `shot`, no `me`)
 */
export function forReaders(read: BoardRead): BoardRead {
  return {
    project: read.project,
    posts: read.posts
      .filter((p) => !p.hidden)
      .map(({ who: _who, shot: _shot, shotFor: _shotFor, context: _context, hidden: _hidden, ...p }) => ({
        ...p,
        mine: false,
        voted: false,
      })),
  };
}
