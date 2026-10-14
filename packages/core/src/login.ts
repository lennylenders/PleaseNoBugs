import type { LoginProof } from './types.js';

/**
 * How long a proof is good for. After that the widget asks the wallet again.
 *
 * Long, because every signature is a native prompt the user has to tap, and a
 * board you have to re-sign weekly is a board people stop using. The proof
 * proves *who*, nothing more; it cannot move funds.
 */
export const LOGIN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** How far in the future `issued` may be, for a phone whose clock runs fast. */
export const LOGIN_SKEW_MS = 5 * 60 * 1000;

/** The project name a dashboard proof carries instead of a project id. */
export const DASHBOARD_PROJECT = 'dashboard';

/**
 * The exact text a wallet signs to post on one project's board.
 *
 * **It names the project and the origin, and that is the whole security
 * story.** One server serves many apps. If they all had their users sign one
 * fixed sentence, any app could collect those signatures and post as its
 * users on every other board. Scoped like this, a proof is useless anywhere
 * but the board and the site it was given to.
 *
 * Plain lines a person can read, because Nimiq Pay and the Hub show the
 * message before signing it, and "PleaseNoBugs login, Project: x, Origin: y"
 * is something a user can judge.
 *
 * Changing this string invalidates every proof in the wild, so it is part of
 * the v1 contract.
 *
 * @example
 * loginMessage({ project: 'shitti', origin: 'https://shitti.me', issued: 0 })
 * // → 'PleaseNoBugs login\nProject: shitti\nOrigin: https://shitti.me\nIssued: 1970-01-01T00:00:00.000Z'
 */
export function loginMessage(args: { project: string; origin: string; issued: number }): string {
  return [
    'PleaseNoBugs login',
    `Project: ${args.project}`,
    `Origin: ${normalizeOrigin(args.origin)}`,
    `Issued: ${new Date(args.issued).toISOString()}`,
  ].join('\n');
}

/**
 * An origin in the one spelling every comparison uses, or the input unchanged
 * if it is not a URL at all (which then simply never matches anything).
 *
 * @example
 * normalizeOrigin('https://Shitti.me/')  // → 'https://shitti.me'
 */
export function normalizeOrigin(origin: string): string {
  try {
    return new URL(origin).origin;
  } catch {
    return origin;
  }
}

/**
 * Whether a proof's timestamp is still usable at `now`.
 *
 * Shared by both ends on purpose: the client uses it to re-sign *before* the
 * server would refuse, so a user is asked at a moment of their choosing rather
 * than having a post bounce.
 */
export function proofIsFresh(issued: number, now: number = Date.now()): boolean {
  return Number.isFinite(issued) && issued <= now + LOGIN_SKEW_MS && now - issued <= LOGIN_TTL_MS;
}

/** The `Authorization` header value for a proof. */
export function encodeProof(proof: LoginProof): string {
  return `Nimiq ${toBase64Url(JSON.stringify(proof))}`;
}

/**
 * The proof inside an `Authorization` header, or null for anything that is
 * not one. Shape only: whether it is *valid* is the server's question.
 */
export function decodeProof(header: string | undefined | null): LoginProof | null {
  if (!header || !header.startsWith('Nimiq ')) return null;
  try {
    const raw = JSON.parse(fromBase64Url(header.slice(6).trim())) as Record<string, unknown>;
    const { address, publicKey, signature, issued } = raw;
    if (
      typeof address !== 'string' ||
      typeof publicKey !== 'string' ||
      typeof signature !== 'string' ||
      typeof issued !== 'number'
    ) {
      return null;
    }
    return { address, publicKey, signature, issued };
  } catch {
    return null;
  }
}

/** base64url over UTF-8, with the same code in a browser and in Node 18+. */
function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}
