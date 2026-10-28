import type { PostKind, PostStatus, Rules } from './types.js';

/**
 * The limits a new project starts with. These are the numbers Shitti's board
 * ran on, where they had been tried on real people before being written here.
 */
export const DEFAULT_RULES: Readonly<Rules> = Object.freeze({
  perDay: 5,
  /** One field, and a short one: a wish needs more room than a title and
   *  still less than an essay. */
  textMax: 200,
  /** Longer than a post, because the reply is the one that has to explain. */
  replyMax: 300,
  kinds: ['bug', 'idea', 'review'] as PostKind[],
});

/** A display name. Long enough for a real one, short enough for a card. */
export const NAME_MAX = 24;

/** A client-minted post id. */
export const POST_ID_MAX = 128;

/** How much `context` one post may carry. */
export const CONTEXT_MAX_KEYS = 10;
export const CONTEXT_VALUE_MAX = 100;

/** The window `rules.perDay` is counted over. Rolling, never reset at midnight. */
export const DAY_MS = 24 * 60 * 60 * 1000;

export const POST_KINDS: readonly PostKind[] = ['bug', 'idea', 'review'];
export const POST_STATUSES: readonly PostStatus[] = ['open', 'planned', 'done', 'declined'];

/** Whether a value is one of the kinds, for reading a request body. */
export function isPostKind(v: unknown): v is PostKind {
  return typeof v === 'string' && (POST_KINDS as readonly string[]).includes(v);
}

/** A review's stars, both ends included. */
export const RATING_MIN = 1;
export const RATING_MAX = 5;

/** Whether a value is a whole number of stars. */
export function isRating(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= RATING_MIN && v <= RATING_MAX;
}

/**
 * A screenshot, at most this many bytes once decoded. The widget scales a
 * phone screenshot down to well under it; the limit is for scripts.
 */
export const SHOT_MAX_BYTES = 1_000_000;

/** The image types a screenshot may be. No SVG: it can carry script. */
export const SHOT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type ShotType = (typeof SHOT_TYPES)[number];

/** Whether a kind may carry a screenshot. A review is an opinion, not a report. */
export function takesShot(kind: PostKind): boolean {
  return kind === 'bug' || kind === 'idea';
}

/** Whether a value is one of the four states, for reading a request body. */
export function isPostStatus(v: unknown): v is PostStatus {
  return typeof v === 'string' && (POST_STATUSES as readonly string[]).includes(v);
}

/**
 * A post's context, cleaned to what the server will store, or null when it is
 * not an object at all.
 *
 * Silently drops what does not fit rather than refusing the post: losing a
 * debug label is cheap, and losing somebody's bug report because the host app
 * sent an eleventh key is not.
 *
 * @example
 * cleanContext({ version: '1.4.0', count: 3, host: 'nimiq-pay' })
 * // → { version: '1.4.0', host: 'nimiq-pay' }   (the number is not a string)
 */
export function cleanContext(v: unknown): Record<string, string> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const out: Record<string, string> = {};
  let n = 0;
  for (const [key, value] of Object.entries(v)) {
    if (n >= CONTEXT_MAX_KEYS) break;
    if (typeof value !== 'string' || !key || key.length > 40) continue;
    out[key] = value.slice(0, CONTEXT_VALUE_MAX);
    n++;
  }
  return out;
}
