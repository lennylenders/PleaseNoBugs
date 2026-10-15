import type {
  Answer,
  PostContext,
  PostKind,
  PostReply,
  PostStatus,
  Project,
} from '@pleasenobugs/core';

/**
 * Where a board keeps its rows, behind one interface so the same server runs on
 * an in-memory map, an SQLite file or Postgres.
 *
 * **Every method is async**, even where both shipped stores answer at once,
 * because a database over a network cannot, and an interface that assumed
 * otherwise would have to break the day somebody wrote one.
 *
 * **The awkward operations are the store's job, not the router's.** Voting is
 * the example: done as read-the-post, change-the-list, write-it-back, two votes
 * arriving together lose one. So the interface has `vote()` and leaves it to
 * each store to make that atomic (a primary key in SQL, a single synchronous
 * block in memory). A new store has to pass the shared contract tests in
 * `store.test.ts`, which is the definition of "works".
 *
 * Addresses arrive here already normalised (`normalizeAddress` in core).
 */

/** A post as stored. Votes live apart from it; see {@link Store.vote}. */
export interface PostRow {
  projectId: string;
  id: string;
  /** The author. Stored whether or not it may be shown, never sent anywhere. */
  author: string;
  anon: boolean;
  kind: PostKind;
  text: string;
  at: number;
  status: PostStatus;
  reply?: PostReply;
  hidden?: boolean;
  context?: PostContext;
  /**
   * When an owner last set a status on it or wrote under it. Its own field
   * rather than `reply.at`, because a status moved with nothing written is an
   * answer too. Nothing else touches it, so a vote cannot lift somebody's news.
   */
  answeredAt?: number;
}

/** A post plus its vote count and whether one particular reader voted. */
export interface PostWithVotes extends PostRow {
  votes: number;
  voted: boolean;
}

/** What `updatePost` may change. `null` removes a field. */
export interface PostPatch {
  status?: PostStatus;
  reply?: PostReply | null;
  hidden?: boolean;
  answeredAt?: number;
}

/** How much one board has had, for telemetry. Hidden posts are not counted. */
export interface ProjectStats {
  bugs: number;
  ideas: number;
  /** Bugs an owner has marked done: fixed. */
  bugsDone: number;
  /** Ideas an owner has marked done: built. */
  ideasDone: number;
}

/** The latest telemetry one installation sent about one of its projects. */
export interface TelemetryRow extends ProjectStats {
  instance: string;
  project: string;
  version: string;
  receivedAt: number;
}

export interface Store {
  // ---- Projects ----
  getProject(id: string): Promise<Project | null>;
  /** Insert or replace. */
  putProject(project: Project): Promise<void>;
  projectsOwnedBy(address: string): Promise<Project[]>;
  /** Every project on this server. */
  projects(): Promise<Project[]>;
  projectStats(projectId: string): Promise<ProjectStats>;

  // ---- This installation ----
  /** A small key-value table: the installation's own id lives here. */
  getMeta(key: string): Promise<string | null>;
  setMeta(key: string, value: string): Promise<void>;

  // ---- Telemetry received (a collecting server only) ----
  /** Keeps only the latest row per installation and project name. */
  putTelemetry(row: TelemetryRow): Promise<void>;
  telemetry(): Promise<TelemetryRow[]>;

  // ---- Posts ----
  /** Every post on a board, hidden ones included; the router filters. */
  posts(projectId: string, reader: string | null): Promise<PostWithVotes[]>;
  getPost(projectId: string, id: string): Promise<PostRow | null>;
  /**
   * Write a new post **and the author's own vote** in one step, since the
   * number means "how many want this" and the author is one of them.
   * Answers false, writing nothing, when the id is taken.
   */
  createPost(row: PostRow): Promise<boolean>;
  updatePost(projectId: string, id: string, patch: PostPatch): Promise<void>;
  /** Removes the post and its votes. */
  deletePost(projectId: string, id: string): Promise<void>;
  /** Add or remove one wallet's vote, atomically. Answers the new count. */
  vote(projectId: string, id: string, voter: string, up: boolean): Promise<number>;
  /** How many posts this wallet wrote on this board after `since`. */
  countByAuthorSince(projectId: string, author: string, since: number): Promise<number>;
  /** How many posts anybody wrote on this board after `since`. */
  countSince(projectId: string, since: number): Promise<number>;
  /** This wallet's answered posts, newest answer first. */
  answersFor(projectId: string, author: string, limit: number): Promise<Answer[]>;

  // ---- Names, per wallet per project ----
  names(projectId: string, addresses: string[]): Promise<Map<string, string>>;
  /** Empty or undefined clears it. */
  setName(projectId: string, address: string, name: string | undefined): Promise<void>;

  // ---- What an owner has seen ----
  getSeen(projectId: string, owner: string): Promise<number>;
  setSeen(projectId: string, owner: string, at: number): Promise<void>;
}
