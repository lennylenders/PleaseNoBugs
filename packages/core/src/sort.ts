/** Which order the board is read in. */
export type BoardSort = 'top' | 'new';

/**
 * The board in the order a tab asks for.
 *
 * Two tabs rather than one order, because most-voted-first eats its own young:
 * a new post starts at one vote and lands under everything, so on a board more
 * than a fortnight old nobody would ever read a new idea.
 *
 * `top` breaks ties by date rather than by arrival order, so a board where
 * nothing has been voted on yet reads newest-first instead of shuffling under
 * people as they scroll.
 *
 * @example
 * sortPosts(posts, 'top')   // most wanted first
 * sortPosts(posts, 'new')   // most recent first
 */
export function sortPosts<P extends { at: number; votes: number }>(posts: P[], sort: BoardSort): P[] {
  const out = [...posts];
  if (sort === 'new') return out.sort((a, b) => b.at - a.at);
  return out.sort((a, b) => b.votes - a.votes || b.at - a.at);
}
