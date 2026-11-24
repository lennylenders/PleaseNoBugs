import { randomInt } from 'node:crypto';
import {
  DEFAULT_RULES,
  POST_KINDS,
  isNimiqAddress,
  isPostKind,
  isShotRule,
  normalizeAddress,
  type PostKind,
  type Project,
  type Rules,
} from '@pleasenobugs/core';

/**
 * Making and changing projects, shared by the dashboard routes and the CLI so
 * the two cannot come to disagree about what a valid project is.
 *
 * Every validator answers the cleaned value or null, and null always means
 * "refuse the request": a project is configuration, and quietly dropping half
 * of somebody's origin list would be a widget that mysteriously does not work.
 */

export const PROJECT_NAME_MAX = 60;
export const MAX_ORIGINS = 10;
export const MAX_OWNERS = 10;

/**
 * Lower case and digits with the lookalikes left out (0/o, 1/l/i), since a
 * project id gets read off one screen and typed into another.
 */
const ID_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';
const ID_LENGTH = 10;

/** A fresh project id. 31^10 is about 8e14, so a collision is a curiosity. */
export function newProjectId(): string {
  let id = '';
  for (let i = 0; i < ID_LENGTH; i++) id += ID_ALPHABET[randomInt(ID_ALPHABET.length)];
  return id;
}

/** A project's name: trimmed, 1 to 60 characters. */
export function cleanName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const name = v.trim();
  return name && name.length <= PROJECT_NAME_MAX ? name : null;
}

/**
 * An origin the widget may run on, or null.
 *
 * Only http and https. `http` is allowed because `http://localhost:5173` is
 * where every developer tries it first, and refusing that would make the first
 * five minutes the worst ones.
 *
 * @example
 * parseOrigin('https://My.App/board')   // → 'https://my.app'
 * parseOrigin('javascript:alert(1)')        // → null
 */
export function parseOrigin(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  try {
    const url = new URL(v.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null;
  } catch {
    return null;
  }
}

export function cleanOrigins(v: unknown): string[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > MAX_ORIGINS) return null;
  const out: string[] = [];
  for (const raw of v) {
    const origin = parseOrigin(raw);
    if (!origin) return null;
    if (!out.includes(origin)) out.push(origin);
  }
  return out;
}

/** Owners: valid addresses, deduplicated, and never none. */
export function cleanOwners(v: unknown): string[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > MAX_OWNERS) return null;
  const out: string[] = [];
  for (const raw of v) {
    if (!isNimiqAddress(raw)) return null;
    const a = normalizeAddress(raw);
    if (!out.includes(a)) out.push(a);
  }
  return out;
}

export const MAX_LOGIN_MESSAGES = 3;
export const LOGIN_MESSAGE_MAX = 200;
/** The fixed start a message ending in `*` needs, so it can only ever match the app's own sentence. */
export const LOGIN_PREFIX_MIN = 12;
/** How long a signed app login may be, its changing end included. */
export const SIGNED_LOGIN_MAX = 1000;

/**
 * The app logins a project accepts, or null. An empty array is valid and
 * turns the feature off.
 *
 * **Never trimmed or normalised**: the signature is over exact bytes, and a
 * message that differs from what the app signs by one trailing space would be
 * a setting that silently never works. Our own message format is refused, so
 * a scoped, expiring proof can never be turned into a permanent one by listing
 * it here.
 *
 * **A `*` at the end means "starts with"**: for an app whose login message
 * carries something that changes every time (a date, a random code), the
 * fixed part is listed and anything may follow. That fixed part has to be at
 * least `LOGIN_PREFIX_MIN` characters, so a bare `*` or a "Sign in" can never
 * accept every message a wallet ever signed elsewhere.
 *
 * @example
 * cleanLoginMessages(['Sign in to My app'])    // → ['Sign in to My app']
 * cleanLoginMessages(['Sign in to My app*'])   // → ['Sign in to My app*']
 * cleanLoginMessages(['Sign in*'])             // → null
 * cleanLoginMessages(['PleaseNoBugs login…'])  // → null
 */
export function cleanLoginMessages(v: unknown): string[] | null {
  if (!Array.isArray(v) || v.length > MAX_LOGIN_MESSAGES) return null;
  const out: string[] = [];
  for (const m of v) {
    if (typeof m !== 'string' || !m.trim() || m.length > LOGIN_MESSAGE_MAX) return null;
    if (m.startsWith('PleaseNoBugs login')) return null;
    if (m.endsWith('*') && m.slice(0, -1).trim().length < LOGIN_PREFIX_MIN) return null;
    if (!out.includes(m)) out.push(m);
  }
  return out;
}

/**
 * A partial change to a project's rules, merged over what it has, or null if
 * any field is out of range. The ranges are generous: they exist to stop a
 * typo, not to have opinions.
 */
export function mergeRules(current: Rules, v: unknown): Rules | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const change = v as Record<string, unknown>;
  const next: Rules = { ...current, kinds: [...current.kinds] };

  const int = (x: unknown, min: number, max: number) =>
    typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max ? x : null;

  if (change.perDay !== undefined) {
    const n = int(change.perDay, 1, 100);
    if (n === null) return null;
    next.perDay = n;
  }
  if (change.textMax !== undefined) {
    const n = int(change.textMax, 20, 2000);
    if (n === null) return null;
    next.textMax = n;
  }
  if (change.replyMax !== undefined) {
    const n = int(change.replyMax, 20, 2000);
    if (n === null) return null;
    next.replyMax = n;
  }
  if (change.kinds !== undefined) {
    if (!Array.isArray(change.kinds) || !change.kinds.length || !change.kinds.every(isPostKind)) {
      return null;
    }
    // In the order core lists them, so the widget's chips never shuffle.
    next.kinds = POST_KINDS.filter((k) => (change.kinds as PostKind[]).includes(k));
  }
  if (change.screenshots !== undefined) {
    if (!isShotRule(change.screenshots)) return null;
    next.screenshots = change.screenshots;
  }
  if (change.approve !== undefined) {
    if (typeof change.approve !== 'boolean') return null;
    next.approve = change.approve;
  }
  return next;
}

/** A new project owned by one wallet, on the default rules. */
export function newProject(args: {
  name: string;
  origins: string[];
  owner: string;
  now?: number;
  id?: string;
  loginMessages?: string[];
  /** Rules that differ from the defaults, already checked (see {@link mergeRules}). */
  rules?: Partial<Rules>;
}): Project {
  return {
    id: args.id ?? newProjectId(),
    name: args.name,
    owners: [normalizeAddress(args.owner)],
    origins: args.origins,
    rules: { ...DEFAULT_RULES, kinds: [...DEFAULT_RULES.kinds], ...args.rules },
    ...(args.loginMessages?.length ? { loginMessages: args.loginMessages } : {}),
    createdAt: args.now ?? Date.now(),
  };
}

/**
 * Whether a signed app login is one of the messages a project lists: the same
 * text, or for a listed message ending in `*`, the same start. Never one of
 * our own login messages, whatever is listed.
 *
 * @example
 * appLoginListed(['Sign in to My app*'], 'Sign in to My app
Nonce: 8f3a')  // → true
 */
export function appLoginListed(listed: readonly string[], message: string): boolean {
  if (message.length > SIGNED_LOGIN_MAX || message.startsWith('PleaseNoBugs login')) return false;
  return listed.some((m) => (m.endsWith('*') ? message.startsWith(m.slice(0, -1)) : m === message));
}
