import type { PostFix, PostKind, PostStatus, Rules, ShotRule } from './types.js';

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
  screenshots: 'board' as ShotRule,
  approve: false,
});

export const SHOT_RULES: readonly ShotRule[] = ['board', 'owners', 'off'];

/** Whether a value is one of the screenshot rules, for reading a request or a variable. */
export function isShotRule(v: unknown): v is ShotRule {
  return typeof v === 'string' && (SHOT_RULES as readonly string[]).includes(v);
}

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

/** An update: its title, the lines under it, and how many posts it may say it fixed. */
export const UPDATE_TITLE_MAX = 80;
export const UPDATE_TEXT_MAX = 300;
export const UPDATE_POSTS_MAX = 50;

/** A version as an app numbers its releases, and a link to a fix. */
export const VERSION_MAX = 24;
export const LINK_MAX = 300;

/**
 * A version, trimmed: `''` for none, null when it is not one. Letters,
 * digits and `. + _ -`, starting with a letter or a digit, so it reads the
 * same on every card and can never be more than a label.
 *
 * @example
 * cleanVersion(' v1.4.2 ')   // → 'v1.4.2'
 * cleanVersion('')           // → ''
 * cleanVersion('1.4 beta')   // → null
 */
export function cleanVersion(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return '';
  return s.length <= VERSION_MAX && /^[0-9A-Za-z][0-9A-Za-z.+_-]*$/.test(s) ? s : null;
}

/** The sites a fix or an update may link to, by the host a link names, and the host it is written with. */
const CODE_SITES: Record<string, string> = {
  'github.com': 'github.com',
  'www.github.com': 'github.com',
  'gitlab.com': 'gitlab.com',
  'www.gitlab.com': 'gitlab.com',
};

/**
 * A link to a page on github.com or gitlab.com, as one clean `https://`
 * address: `''` for none, null for anything that is not one.
 *
 * Those two and nothing else, on purpose: a link on a board is something an
 * app's users are invited to tap, and "it goes to the code" is a promise this
 * keeps for every board, whoever runs it. A GitLab on somebody's own server
 * is left out for the same reason: its address could be anything. People
 * paste a link the way an address bar shows it, so a missing `https://` is
 * added and `http://` and `www.` are tidied away. A bare `github.com` is
 * refused: it points at nothing in particular.
 *
 * @example
 * cleanCodeLink('github.com/me/app/pull/42')                   // → 'https://github.com/me/app/pull/42'
 * cleanCodeLink('gitlab.com/me/app/-/merge_requests/7')        // → 'https://gitlab.com/me/app/-/merge_requests/7'
 * cleanCodeLink('https://github.com.evil.example')             // → null
 * cleanCodeLink('javascript:alert(1)')                         // → null
 */
export function cleanCodeLink(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return '';
  if (s.length > LINK_MAX) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = CODE_SITES[url.hostname];
  if (!host) return null;
  if (url.username || url.password || url.port || url.pathname.length < 2) return null;
  return `https://${host}${url.pathname}${url.search}${url.hash}`;
}

/**
 * Which site a link goes to, by name, for "View on GitHub": null for one
 * {@link cleanCodeLink} would refuse.
 *
 * @example
 * codeSite('https://gitlab.com/me/app/-/releases/v2')   // → 'GitLab'
 */
export function codeSite(link: string): 'GitHub' | 'GitLab' | null {
  const clean = cleanCodeLink(link);
  if (!clean) return null;
  return clean.startsWith('https://gitlab.com/') ? 'GitLab' : 'GitHub';
}

/**
 * A fix from a request body, `{ version?, link? }`, cleaned: `{}` when it
 * says nothing, null when either part is not what it claims to be.
 *
 * @example
 * cleanFix({ version: '1.4.2', link: 'github.com/me/app/pull/42' })
 * // → { version: '1.4.2', link: 'https://github.com/me/app/pull/42' }
 */
export function cleanFix(v: unknown): PostFix | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const { version, link } = v as Record<string, unknown>;
  const ver = version === undefined ? '' : cleanVersion(version);
  const url = link === undefined ? '' : cleanCodeLink(link);
  if (ver === null || url === null) return null;
  return { ...(ver ? { version: ver } : {}), ...(url ? { link: url } : {}) };
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
