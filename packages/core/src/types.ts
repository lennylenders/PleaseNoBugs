/**
 * The shapes that travel between the server and its clients.
 *
 * This file is the contract described in `docs/api-v1.md`. Inside v1 these
 * types may only grow: a new optional field is fine, a renamed or retyped one
 * is a v2. Clients must ignore fields they do not know, which is what lets the
 * server add one without breaking an app nobody has updated.
 */

/** Something is broken, or something is missing. */
export type PostKind = 'bug' | 'idea';

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
  /** Owners only. */
  context?: PostContext;
  /** Owners only: a post they took off the board, kept so it can come back. */
  hidden?: boolean;
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
 * `issued` travels because the server has to rebuild the signed message
 * byte for byte, and the timestamp is part of it.
 */
export interface LoginProof {
  address: string;
  /** Hex. */
  publicKey: string;
  /** Hex. */
  signature: string;
  /** Milliseconds since the epoch, as written into the signed message. */
  issued: number;
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
  | 'too_many'
  | 'rate_limited';
