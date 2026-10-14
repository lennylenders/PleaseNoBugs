import {
  encodeProof,
  loginMessage,
  normalizeAddress,
  normalizeOrigin,
  proofIsFresh,
  type Answer,
  type AppLogin,
  type BoardRead,
  type ErrorCode,
  type LoginProof,
  type Me,
  type PostContext,
  type PostKind,
  type PostStatus,
} from '@pleasenobugs/core';
import { insideNimiqPay, nimiqPaySigner, SignerError, type Signer } from './signer.js';

export { insideNimiqPay, nimiqPaySigner, SignerError, type Signer, type SignedMessage } from './signer.js';
export { createMatcher, sortPosts } from '@pleasenobugs/core';
export type * from '@pleasenobugs/core';

export interface ClientOptions {
  /** The API, e.g. `https://feedback.example.com` (no `/v1`). */
  server: string;
  /** The project id from the dashboard or `create-project`. */
  project: string;
  /**
   * How to get a signature. Defaults to Nimiq Pay's own wallet when running
   * inside it; outside Nimiq Pay, without one, the board is read-only.
   *
   * `null` means never ask, even inside Nimiq Pay: for a background read (a
   * badge, a bell) that must not put a wallet prompt in front of somebody who
   * did not tap anything.
   */
  signer?: Signer | null;
  /**
   * Your app's own wallet login, reused so nobody signs twice. Only works on a
   * project whose owner listed that exact message (`loginMessages`). A
   * function is read on every request, so a login or logout in your app is
   * picked up without recreating the client.
   *
   * Tried before the signer. If the server refuses it, the client stops using
   * it for this session and falls back to the signer.
   */
  appLogin?: AppLogin | null | (() => AppLogin | null | undefined);
  /** The origin written into the signed message. Defaults to this page's. */
  origin?: string;
  /**
   * Where the proof is remembered between visits, so somebody signs once a
   * month rather than once a visit. Defaults to `localStorage`; `null` keeps
   * it in memory only.
   */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
  /** For tests and unusual runtimes. */
  fetch?: typeof fetch;
}

/**
 * Every call answers one of these rather than throwing, so a caller handles a
 * refusal with an `if` instead of a try. `network` is the server not
 * answering at all, `no_signer` is "there is no wallet to ask", `declined` is
 * the user saying no to the signature.
 */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: ErrorCode | 'network' | 'no_signer' | 'declined'; body?: unknown };

/**
 * A talking-to-the-server object for one project. Everything the widget does
 * goes through this, so anything the widget can do, a developer building their
 * own UI can do too.
 *
 * **It signs as late as possible.** Reading never asks the wallet: a stored
 * proof is sent if there is one and the board comes back as a stranger's if
 * there is not. The first *write* is what asks, because that is the moment the
 * user has a reason to tap "sign". After that the proof is remembered for its
 * lifetime (30 days).
 *
 * **A refused proof is retried once, freshly signed.** A proof can stop working
 * without the client knowing (the owner changed the project's origins, the
 * server restarted with a different clock), and the honest response to that is
 * to ask the wallet again, not to fail a vote.
 *
 * @example
 * const client = createClient({ server: 'https://feedback.example.com', project: 'k7q2m9xw4p' });
 * const board = await client.board();
 * if (board.ok) render(sortPosts(board.data.posts, 'top'));
 * await client.post({ id: crypto.randomUUID(), kind: 'idea', text: 'Dark mode' });
 */
export function createClient(options: ClientOptions) {
  const base = options.server.replace(/\/+$/, '');
  const project = options.project;
  const origin = normalizeOrigin(options.origin ?? (typeof location !== 'undefined' ? location.origin : ''));
  const signer =
    options.signer === null ? undefined : (options.signer ?? (insideNimiqPay() ? nimiqPaySigner() : undefined));
  const doFetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  const storage = options.storage === undefined ? safeLocalStorage() : options.storage;
  const key = `pleasenobugs.proof.${project}.${origin}`;

  let proof: LoginProof | null = read();
  /** One signature at a time: two taps must not open two wallet prompts. */
  let signing: Promise<Result<string>> | null = null;
  /** Set once the server turned the app login down; it is not offered again. */
  let appLoginRefused = false;

  /** The app's own login as a proof, if there is one worth offering. */
  function fromApp(): LoginProof | null {
    if (appLoginRefused || !options.appLogin) return null;
    const a = typeof options.appLogin === 'function' ? options.appLogin() : options.appLogin;
    return a ? { ...a, origin, issued: 0 } : null;
  }

  function read(): LoginProof | null {
    try {
      const raw = storage?.getItem(key);
      if (!raw) return null;
      const p = JSON.parse(raw) as LoginProof;
      return proofIsFresh(p.issued) ? p : null;
    } catch {
      return null;
    }
  }

  function remember(p: LoginProof | null) {
    proof = p;
    try {
      if (p) storage?.setItem(key, JSON.stringify(p));
      else storage?.removeItem(key);
    } catch {
      // Private mode or a full quota: the proof lives in memory for this visit.
    }
  }

  /** The app's login, else the stored proof if it is still good. Never asks the wallet. */
  function current(): LoginProof | null {
    const app = fromApp();
    if (app) return app;
    if (proof && !proofIsFresh(proof.issued)) remember(null);
    return proof;
  }

  /**
   * Ask the wallet for a fresh proof. Answers the signing address.
   * Concurrent callers share one prompt.
   */
  function signIn(): Promise<Result<string>> {
    const app = fromApp();
    if (app) return Promise.resolve({ ok: true, data: normalizeAddress(app.address) });
    if (!signer) return Promise.resolve({ ok: false, status: 0, error: 'no_signer' });
    if (signing) return signing;
    signing = (async (): Promise<Result<string>> => {
      try {
        const issued = Date.now();
        const signed = await signer(loginMessage({ project, origin, issued }));
        remember({ ...signed, origin, issued });
        return { ok: true, data: normalizeAddress(signed.address) };
      } catch (e) {
        if (e instanceof SignerError && e.reason === 'no_wallet') {
          return { ok: false, status: 0, error: 'no_signer' };
        }
        return { ok: false, status: 0, error: 'declined' };
      } finally {
        signing = null;
      }
    })();
    return signing;
  }

  async function request<T>(
    method: string,
    path: string,
    opts: { body?: unknown; auth: 'none' | 'optional' | 'required' },
  ): Promise<Result<T>> {
    const attempt = async (p: LoginProof | null): Promise<Result<T>> => {
      const headers: Record<string, string> = {};
      if (opts.body !== undefined) headers['content-type'] = 'application/json';
      if (p) headers.authorization = encodeProof(p);
      let res: Response;
      try {
        res = await doFetch(`${base}${path}`, {
          method,
          headers,
          ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
        });
      } catch {
        return { ok: false, status: 0, error: 'network' };
      }
      const body = await res.json().catch(() => null);
      if (res.ok) return { ok: true, data: body as T };
      const error = (body && typeof body.error === 'string' ? body.error : 'internal') as ErrorCode;
      return { ok: false, status: res.status, error, body };
    };

    if (opts.auth === 'none') return attempt(null);

    let p = current();
    if (!p && opts.auth === 'required') {
      const signed = await signIn();
      if (!signed.ok) return signed;
      p = current();
    }
    const first = await attempt(p);
    if (first.ok || first.status !== 401 || !p) return first;

    // The proof we had stopped working. Forget it, then: a read goes on as a
    // stranger, a write asks the wallet once more.
    if (p.message !== undefined) appLoginRefused = true;
    else remember(null);
    if (opts.auth === 'optional') return attempt(null);
    const again = await signIn();
    if (!again.ok) return again;
    return attempt(current());
  }

  const at = (path = '') => `/v1/projects/${encodeURIComponent(project)}${path}`;
  const post = (id: string) => at(`/posts/${encodeURIComponent(id)}`);

  return {
    /** The project this client talks to. */
    project,
    /** Whether the user can be signed in at all: a signer, or an app login. */
    get canSign() {
      return !!signer || fromApp() !== null;
    },
    /** The signed-in address, if a proof is stored. */
    address(): string | null {
      const p = current();
      return p ? normalizeAddress(p.address) : null;
    },
    signIn,
    /** Forget the stored proof. The next write asks the wallet again. */
    signOut() {
      remember(null);
    },

    /** The whole board, plus `me` when signed in. Never prompts. */
    board: () => request<BoardRead>('GET', at('/posts'), { auth: 'optional' }),
    me: () => request<Me>('GET', at('/me'), { auth: 'required' }),
    answers: () => request<{ answers: Answer[] }>('GET', at('/answers'), { auth: 'required' }),

    post: (p: { id: string; kind: PostKind; text: string; anon?: boolean; context?: PostContext }) =>
      request<{ ok: true; left: number }>('POST', at('/posts'), { body: p, auth: 'required' }),
    vote: (id: string, up: boolean) =>
      request<{ ok: true; votes: number; voted: boolean }>('POST', `${post(id)}/vote`, {
        body: { up },
        auth: 'required',
      }),
    remove: (id: string) => request<{ ok: true }>('DELETE', post(id), { auth: 'required' }),
    setName: (name: string) =>
      request<{ ok: true; name?: string }>('PUT', at('/me'), { body: { name }, auth: 'required' }),
    manage: (id: string, change: { status?: PostStatus; reply?: string; hidden?: boolean }) =>
      request<{ ok: true }>('POST', `${post(id)}/manage`, { body: change, auth: 'required' }),
  };
}

export type Client = ReturnType<typeof createClient>;

/** `localStorage`, or null where touching it throws (private mode, sandboxed frames). */
function safeLocalStorage(): Storage | null {
  try {
    const s = globalThis.localStorage;
    const probe = '__pleasenobugs__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}
