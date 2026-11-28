/**
 * What this browser remembers about how somebody wants to post on one board,
 * in `localStorage`:
 *
 * - `anon`: whether they post anonymously, set once in Settings instead of on
 *   every post.
 * - `named`: whether a wallet was asked for a name on its first post already,
 *   so the question comes once and never again. Per wallet: somebody who
 *   logs out and signs in with another is asked for that one.
 * - `updates`: how many updates they had seen, so the megaphone's dot only
 *   says something when there is something new.
 *
 * Per board, and nothing about anybody else: a yes, a no, a number, and in
 * `named` the visitor's own address as part of the key. Where storage
 * throws (private mode, a sandboxed frame) the answer lives for this visit only,
 * in `memory`.
 */
const memory = new Map<string, string>();

function key(project: string, what: string) {
  return `pleasenobugs.${what}.${project}`;
}

/**
 * The demo board (`demo`, sample posts in the page) keeps nothing between
 * visits: every visitor, and every replay of the website's tour, starts as a
 * newcomer, asked for a name on their first post.
 */
const keeps = (project: string) => project !== 'demo';

function get(project: string, what: string): string | null {
  const k = key(project, what);
  if (!keeps(project)) return null;
  try {
    const v = globalThis.localStorage?.getItem(k);
    if (v !== null && v !== undefined) return v;
  } catch {
    // Storage off: fall through to this visit's memory.
  }
  return memory.get(k) ?? null;
}

function set(project: string, what: string, value: string) {
  if (!keeps(project)) return;
  const k = key(project, what);
  memory.set(k, value);
  try {
    globalThis.localStorage?.setItem(k, value);
  } catch {
    // Remembered in memory for this visit, which is the best there is.
  }
}

/** Whether this browser posts anonymously on this board. Off unless they turned it on. */
export function readAnon(project: string): boolean {
  return get(project, 'anon') === '1';
}

export function writeAnon(project: string, anon: boolean) {
  set(project, 'anon', anon ? '1' : '0');
}

/** Whether this wallet was asked the first-post question about a name here already. */
export function readAsked(project: string, address: string | null): boolean {
  return get(project, `named.${address ?? ''}`) === '1';
}

export function writeAsked(project: string, address: string | null) {
  set(project, `named.${address ?? ''}`, '1');
}

/** How many updates this browser had seen on this board. */
export function readUpdatesSeen(project: string): number {
  return Number(get(project, 'updates') ?? 0) || 0;
}

export function writeUpdatesSeen(project: string, n: number) {
  set(project, 'updates', String(n));
}
