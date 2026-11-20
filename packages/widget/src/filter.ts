import { shownThread, waitingOnApp, type Message, type Post, type PostKind, type PostStatus } from '@pleasenobugs/core';

/** What only an owner can narrow the board to. */
export type OwnFilter = 'waiting' | 'hidden' | 'pending';

/**
 * What the Filter panel narrows the board to. Inside a group any choice
 * matches (Bugs and Ideas shows both); between groups every one has to
 * (Bugs and Planned shows planned bugs). An empty group is no filter.
 */
export interface BoardFilter {
  kinds: PostKind[];
  statuses: PostStatus[];
  /** Only what you wrote yourself. */
  mine: boolean;
  /** Owners only. */
  own: OwnFilter[];
}

export const NO_FILTER: BoardFilter = Object.freeze({ kinds: [], statuses: [], mine: false, own: [] }) as BoardFilter;

/** How many filters are on, for the number on the Filter button. */
export function filtersOn(f: BoardFilter): number {
  return f.kinds.length + f.statuses.length + (f.mine ? 1 : 0) + f.own.length;
}

/**
 * Whether a post passes the filter. A review has no status, so choosing a
 * status leaves reviews out rather than pretending they are all open.
 */
export function matchesFilter(p: Post, f: BoardFilter): boolean {
  if (f.kinds.length && !f.kinds.includes(p.kind)) return false;
  if (f.statuses.length && (p.kind === 'review' || !f.statuses.includes(p.status))) return false;
  if (f.mine && !p.mine) return false;
  if (
    f.own.length &&
    !f.own.some((o) => (o === 'waiting' ? waitingOnApp(p) : o === 'hidden' ? !!p.hidden : !!p.pending))
  ) {
    return false;
  }
  return true;
}

/** The words of a search, lower case, in the order typed. */
export function searchWords(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/** Where a search found a post: its own text, or a message in the conversation under it. */
export type Found = { in: 'text' } | { in: 'thread'; message: Message };

/**
 * Whether a post matches a search, and where: every word has to be in it,
 * anywhere in the post or its conversation, so "pixel camera" finds the bug
 * about the camera whose author said "Pixel 7" when asked.
 *
 * Plain substrings, no ranking: a board is a list in the tens or hundreds,
 * read top to bottom, and a search that hides how it decided is one people
 * stop trusting.
 *
 * @example
 * findIn({ text: 'Camera opens black', thread: [{ text: 'A Pixel 7', … }] }, 'pixel')
 * // → { in: 'thread', message: { text: 'A Pixel 7', … } }
 */
export function findIn(p: Post, query: string): Found | null {
  const words = searchWords(query);
  if (!words.length) return { in: 'text' };
  const has = (text: string, w: string) => text.toLowerCase().includes(w);
  if (words.every((w) => has(p.text, w))) return { in: 'text' };
  const thread = shownThread(p.thread);
  if (!words.every((w) => has(p.text, w) || thread.some((m) => has(m.text, w)))) return null;
  // The message that says the most of what was asked, to show on the card.
  const score = (m: Message) => words.filter((w) => has(m.text, w)).length;
  const message = thread.reduce((best, m) => (score(m) > score(best) ? m : best), thread[0]);
  return { in: 'thread', message };
}

/**
 * A bit of a long text around the first word searched for, so a card can
 * show why it matched without the whole message.
 *
 * @example
 * snippet('Only on my old Samsung. My new phone is fine.', 'phone', 24)   // → '…My new phone is fine.'
 */
export function snippet(text: string, query: string, max = 60): string {
  if (text.length <= max) return text;
  const lower = text.toLowerCase();
  const at = Math.min(...searchWords(query).map((w) => lower.indexOf(w)).filter((i) => i >= 0), text.length);
  let start = at === text.length ? 0 : Math.max(0, Math.min(at - 8, text.length - max));
  // Never half a word at the front.
  if (start > 0 && text[start - 1] !== ' ') {
    const space = text.indexOf(' ', start);
    if (space >= 0 && space < at) start = space + 1;
  }
  const cut = text.slice(start, start + max).trim();
  return `${start > 0 ? '…' : ''}${cut}${start + max < text.length ? '…' : ''}`;
}

/**
 * A text cut where the searched words are, so each can be marked.
 *
 * @example
 * marks('My Pixel 6', 'pixel')   // → [{ text: 'My ', hit: false }, { text: 'Pixel', hit: true }, { text: ' 6', hit: false }]
 */
export function marks(text: string, query: string): { text: string; hit: boolean }[] {
  const words = searchWords(query);
  if (!words.length) return [{ text, hit: false }];
  const lower = text.toLowerCase();
  const hit = new Array<boolean>(text.length).fill(false);
  for (const w of words) {
    for (let i = lower.indexOf(w); i >= 0; i = lower.indexOf(w, i + 1)) hit.fill(true, i, i + w.length);
  }
  const out: { text: string; hit: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = out[out.length - 1];
    if (last && last.hit === hit[i]) last.text += text[i];
    else out.push({ text: text[i], hit: hit[i] });
  }
  return out;
}
