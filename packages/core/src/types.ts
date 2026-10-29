/**
 * The shapes that travel between the server and its clients.
 *
 * This file is the contract described in `docs/api-v1.md`. Inside v1 these
 * types may only grow: a new optional field is fine, a renamed or retyped one
 * is a v2. Clients must ignore fields they do not know, which is what lets the
 * server add one without breaking an app nobody has updated.
 */

/**
 * Something is broken, something is missing, or what somebody thinks of the
 * app as it is. A review carries a `rating` and is the one kind that is not a
 * request: nothing gets planned or fixed, so it never gets a status.
 */
export type PostKind = 'bug' | 'idea' | 'review';

/**
 * Where a post stands, set by a project's owners and nobody else.
 *
 * This is what separates a board from a wishing well. Without it every post
 * reads the same three months later, and the only signal anybody gets is that
 * nothing was ever answered.
 */
export type PostStatus = 'open' | 'planned' | 'done' | 'declined';

/** An owner's answer under a post. One reply, never a thread. */
export interface PostReply {
  text: string;
  at: number;
}

/**
 * Free-form detail for reproducing a bug: an app version, a screen, whether
 * the user was inside Nimiq Pay. Owners' eyes only.
 *
 * Strings only and a handful of keys (see `CONTEXT_MAX_KEYS`), so it can never
 * become a place to stash anything bigger than a label.
 */
export type PostContext = Record<string, string>;

/**
 * Who sees a post's screenshot.
 *
 * - `board`: everybody who reads the board. Only ever because its author
 *   ticked that everyone may see it.
 * - `off`: the author agreed, but an owner took it off the board. Owners can
 *   put it back.
 * - `owners`: the author never agreed, so owners only, for good. Nobody can
 *   turn it into `board` later; that would be a promise broken after the fact.
 */
export type ShotFor = 'board' | 'off' | 'owners';

/**
 * What a board allows screenshots to be, whatever the widget asks:
 * `board` (the author may put one on the board), `owners` (only ever for the
 * owners) or `off` (none at all).
 */
export type ShotRule = 'board' | 'owners' | 'off';

/**
 * One post, as a reader receives it.
 *
 * What is *not* here is the point: the author's address and the list of who
 * voted never leave the server. A reader learns only whether they wrote it
 * themselves and whether they voted.
 */
export interface Post {
  id: string;
  kind: PostKind;
  text: string;
  at: number;
  status: PostStatus;
  /** How many wallets want this, the author included. */
  votes: number;
  /** Whether this reader is one of them. Always false without a proof. */
  voted: boolean;
  /** Whether this reader wrote it. Always false without a proof. */
  mine: boolean;
  /** The author's display name. Absent when they posted anonymously or never
   *  chose one. Never an address: a name is a label, an address an identity. */
  who?: string;
  reply?: PostReply;
  /** Reviews only: 1 to 5 stars. */
  rating?: number;
  /** Owners only. */
  context?: PostContext;
  /** A screenshot comes with it, read through the post's `/shot` route. Sent
   *  to everybody for one on the board, and to owners for any. */
  shot?: boolean;
  /** Owners only, with `shot`: who sees it. */
  shotFor?: ShotFor;
  /** Owners only: a post they took off the board, kept so it can come back. */
  hidden?: boolean;
  /** Waiting for an owner to approve it, on a board with `rules.approve`.
   *  Only its author and the owners see it until then. */
  pending?: boolean;
}

/** A project's limits. Defaults in `DEFAULT_RULES`. */
export interface Rules {
  /** Posts per wallet per rolling 24 hours. Not a punishment: a reason to pick
   *  the good one. */
  perDay: number;
  textMax: number;
  replyMax: number;
  /** Which kinds this board accepts, in the order the widget offers them. */
  kinds: PostKind[];
  /**
   * What screenshots may be on this board, enforced by the server whatever a
   * widget sends. Absent on projects made before 0.2.0, which means `board`.
   */
  screenshots?: ShotRule;
  /**
   * Whether a new post waits for an owner's approval before anybody else sees
   * it. For a board on a public page. Absent means no.
   */
  approve?: boolean;
}

/** What anybody may know about a project. */
export interface PublicProject {
  id: string;
  name: string;
  rules: Rules;
}

/** The whole project, as its owners see it. */
export interface Project extends PublicProject {
  /** Wallet addresses. Never empty: a project nobody owns nobody can answer. */
  owners: string[];
  /** Where the widget may run, as `URL.origin` strings. */
  origins: string[];
  /**
   * Fixed messages this app's own wallet login already signs, accepted as a
   * proof on this project and no other. Lets an app with a login hand the
   * widget the signature it already has, so nobody signs twice.
   *
   * Off unless the owner sets it, because such a proof never expires: the
   * message has no timestamp in it. See "App logins" in `docs/api-v1.md`.
   */
  loginMessages?: string[];
  createdAt: number;
}

/** What the reader needs to know about themselves before typing anything. */
export interface Me {
  owner: boolean;
  name?: string;
  /** Posts left in this wallet's rolling day. The allowance itself is
   *  `rules.perDay`: read it from the project, never from a copy. */
  left: number;
}

/** `GET /v1/projects/:pid/posts`. */
export interface BoardRead {
  project: PublicProject;
  /** In no promised order; see `sortPosts`. */
  posts: Post[];
  /** Present only when the request carried a valid proof. */
  me?: Me;
}

/** One of your own posts that an owner has answered. `at` is when. */
export interface Answer {
  id: string;
  text: string;
  at: number;
}

/**
 * Who is asking, sent base64url-encoded in `Authorization: Nimiq <...>`.
 *
 * `origin` and `issued` travel because the server has to rebuild the signed
 * message byte for byte and both are part of it. The project is not here: it
 * is the one in the URL, which is what makes a proof useless on any other
 * board.
 */
export interface LoginProof {
  address: string;
  /** Hex. */
  publicKey: string;
  /** Hex. */
  signature: string;
  /** The origin written into the signed message, or where an app login is used. */
  origin: string;
  /** Milliseconds since the epoch, as written into the signed message. 0 on an app login. */
  issued: number;
  /**
   * Present only on an **app login**: the app's own fixed login message, which
   * is what was signed instead of `loginMessage()`. Accepted only by a project
   * that lists it in `loginMessages`.
   */
  message?: string;
}

/** An app's own login signature, handed to the client to reuse. */
export interface AppLogin {
  address: string;
  publicKey: string;
  signature: string;
  /** The exact text that was signed. */
  message: string;
}

/** Every error the API answers with, as `{ error: ErrorCode }`. */
export type ErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'not_yours'
  | 'not_owner'
  | 'origin_not_allowed'
  | 'no_project'
  | 'no_post'
  | 'duplicate'
  | 'reviewed'
  | 'too_many'
  | 'rate_limited'
  | 'not_found'
  | 'internal';
