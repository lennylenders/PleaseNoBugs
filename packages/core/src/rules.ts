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
  kinds: ['bug', 'idea'] as PostKind[],
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

export const POST_KINDS: readonly PostKind[] = ['bug', 'idea'];
export const POST_STATUSES: readonly PostStatus[] = ['open', 'planned', 'done', 'declined'];

/** Whether a value is one of the two kinds, for reading a request body. */
export function isPostKind(v: unknown): v is PostKind {
  return typeof v === 'string' && (POST_KINDS as readonly string[]).includes(v);
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
