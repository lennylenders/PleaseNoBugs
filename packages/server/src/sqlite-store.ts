import { createRequire } from 'node:module';
import type { DatabaseSync as Database, SQLInputValue } from 'node:sqlite';
import type { Answer, PostContext, PostKind, PostStatus, Project } from '@pleasenobugs/core';
import type { PostPatch, PostRow, PostWithVotes, Store } from './store.js';

/*
 * Loaded through `require` rather than an import, for one reason: Vite (which
 * vitest runs on) strips the `node:` prefix and then does not recognise
 * `sqlite` as a built-in, because it is too new for Vite's list. `require` is
 * never seen by Vite and resolves the same module in production. The type
 * import above is erased, so it has the same problem nowhere.
 */
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

/**
 * One SQLite file, which is what a self-hoster wants: no database server, a
 * backup is a file copy.
 *
 * **Built on `node:sqlite`, which ships inside Node 22.13+.** That is the
 * whole reason it was chosen over `better-sqlite3`: a native module has to be
 * compiled on install, and on Windows or a slim container that is where people
 * give up. Node still labels it experimental and prints one warning at start;
 * the API it exposes has been stable since it landed.
 *
 * Its own entry point (`@pleasenobugs/server/sqlite`) so that importing the
 * server for another store never loads it, and never prints that warning.
 *
 * Synchronous underneath, so every method finishes before anything else runs,
 * which is what makes `vote()` and `createPost()` atomic without a transaction
 * spanning an await.
 *
 * @example
 * import { SqliteStore } from '@pleasenobugs/server/sqlite';
 * const store = new SqliteStore('./pleasenobugs.db');   // or ':memory:'
 */
export class SqliteStore implements Store {
  private db: Database;

  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS posts (
        project_id  TEXT NOT NULL,
        id          TEXT NOT NULL,
        author      TEXT NOT NULL,
        anon        INTEGER NOT NULL,
        kind        TEXT NOT NULL,
        text        TEXT NOT NULL,
        at          INTEGER NOT NULL,
        status      TEXT NOT NULL,
        reply_text  TEXT,
        reply_at    INTEGER,
        hidden      INTEGER NOT NULL DEFAULT 0,
        context     TEXT,
        answered_at INTEGER,
        PRIMARY KEY (project_id, id)
      );
      CREATE INDEX IF NOT EXISTS posts_by_author ON posts (project_id, author, at);
      CREATE TABLE IF NOT EXISTS votes (
        project_id TEXT NOT NULL,
        post_id    TEXT NOT NULL,
        voter      TEXT NOT NULL,
        PRIMARY KEY (project_id, post_id, voter)
      );
      CREATE TABLE IF NOT EXISTS names (
        project_id TEXT NOT NULL,
        address    TEXT NOT NULL,
        name       TEXT NOT NULL,
        PRIMARY KEY (project_id, address)
      );
      CREATE TABLE IF NOT EXISTS seen (
        project_id TEXT NOT NULL,
        owner      TEXT NOT NULL,
        at         INTEGER NOT NULL,
        PRIMARY KEY (project_id, owner)
      );
      INSERT OR IGNORE INTO meta (key, value) VALUES ('schema', '1');
    `);
  }

  /** Close the file. Tests use it; a server normally runs until it is killed. */
  close() {
    this.db.close();
  }

  private all(sql: string, ...params: SQLInputValue[]) {
    return this.db.prepare(sql).all(...params) as Record<string, unknown>[];
  }

  private get(sql: string, ...params: SQLInputValue[]) {
    return this.db.prepare(sql).get(...params) as Record<string, unknown> | undefined;
  }

  private run(sql: string, ...params: SQLInputValue[]) {
    return this.db.prepare(sql).run(...params);
  }

  // ---- Projects ----

  async getProject(id: string) {
    const row = this.get('SELECT data FROM projects WHERE id = ?', id);
    return row ? (JSON.parse(String(row.data)) as Project) : null;
  }

  async putProject(project: Project) {
    this.run(
      'INSERT INTO projects (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data',
      project.id,
      JSON.stringify(project),
    );
  }

  /**
   * A scan over every project, filtered here. Owners live inside the JSON, and
   * a second table to index them would be one more thing to keep in step for a
   * query the dashboard runs once per visit. Fine into the thousands; past that
   * it wants an owners table.
   */
  async projectsOwnedBy(address: string) {
    return this.all('SELECT data FROM projects')
      .map((r) => JSON.parse(String(r.data)) as Project)
      .filter((p) => p.owners.includes(address));
  }

  // ---- Posts ----

  async posts(projectId: string, reader: string | null): Promise<PostWithVotes[]> {
    return this.all(
      `SELECT p.*,
         (SELECT COUNT(*) FROM votes v WHERE v.project_id = p.project_id AND v.post_id = p.id) AS votes,
         EXISTS (SELECT 1 FROM votes v
                 WHERE v.project_id = p.project_id AND v.post_id = p.id AND v.voter = ?) AS voted
       FROM posts p WHERE p.project_id = ?`,
      reader ?? '',
      projectId,
    ).map((r) => ({ ...toRow(r), votes: Number(r.votes), voted: Number(r.voted) === 1 }));
  }

  async getPost(projectId: string, id: string) {
    const row = this.get('SELECT * FROM posts WHERE project_id = ? AND id = ?', projectId, id);
    return row ? toRow(row) : null;
  }

  async createPost(row: PostRow) {
    const inserted = this.run(
      `INSERT OR IGNORE INTO posts
         (project_id, id, author, anon, kind, text, at, status, reply_text, reply_at, hidden, context, answered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      row.projectId,
      row.id,
      row.author,
      row.anon ? 1 : 0,
      row.kind,
      row.text,
      row.at,
      row.status,
      row.reply?.text ?? null,
      row.reply?.at ?? null,
      row.hidden ? 1 : 0,
      row.context ? JSON.stringify(row.context) : null,
      row.answeredAt ?? null,
    );
    if (Number(inserted.changes) === 0) return false;
    this.run(
      'INSERT OR IGNORE INTO votes (project_id, post_id, voter) VALUES (?, ?, ?)',
      row.projectId,
      row.id,
      row.author,
    );
    return true;
  }

  async updatePost(projectId: string, id: string, patch: PostPatch) {
    const sets: string[] = [];
    const params: SQLInputValue[] = [];
    if (patch.status !== undefined) {
      sets.push('status = ?');
      params.push(patch.status);
    }
    if (patch.reply !== undefined) {
      sets.push('reply_text = ?', 'reply_at = ?');
      params.push(patch.reply?.text ?? null, patch.reply?.at ?? null);
    }
    if (patch.hidden !== undefined) {
      sets.push('hidden = ?');
      params.push(patch.hidden ? 1 : 0);
    }
    if (patch.answeredAt !== undefined) {
      sets.push('answered_at = ?');
      params.push(patch.answeredAt);
    }
    if (!sets.length) return;
    this.run(`UPDATE posts SET ${sets.join(', ')} WHERE project_id = ? AND id = ?`, ...params, projectId, id);
  }

  async deletePost(projectId: string, id: string) {
    this.run('DELETE FROM votes WHERE project_id = ? AND post_id = ?', projectId, id);
    this.run('DELETE FROM posts WHERE project_id = ? AND id = ?', projectId, id);
  }

  async vote(projectId: string, id: string, voter: string, up: boolean) {
    if (up) {
      this.run(
        'INSERT OR IGNORE INTO votes (project_id, post_id, voter) VALUES (?, ?, ?)',
        projectId,
        id,
        voter,
      );
    } else {
      this.run(
        'DELETE FROM votes WHERE project_id = ? AND post_id = ? AND voter = ?',
        projectId,
        id,
        voter,
      );
    }
    const row = this.get(
      'SELECT COUNT(*) AS n FROM votes WHERE project_id = ? AND post_id = ?',
      projectId,
      id,
    );
    return Number(row?.n ?? 0);
  }

  async countByAuthorSince(projectId: string, author: string, since: number) {
    const row = this.get(
      'SELECT COUNT(*) AS n FROM posts WHERE project_id = ? AND author = ? AND at > ?',
      projectId,
      author,
      since,
    );
    return Number(row?.n ?? 0);
  }

  async countSince(projectId: string, since: number) {
    const row = this.get(
      'SELECT COUNT(*) AS n FROM posts WHERE project_id = ? AND at > ?',
      projectId,
      since,
    );
    return Number(row?.n ?? 0);
  }

  async answersFor(projectId: string, author: string, limit: number): Promise<Answer[]> {
    return this.all(
      `SELECT id, text, answered_at FROM posts
       WHERE project_id = ? AND author = ? AND answered_at IS NOT NULL
       ORDER BY answered_at DESC LIMIT ?`,
      projectId,
      author,
      limit,
    ).map((r) => ({ id: String(r.id), text: String(r.text), at: Number(r.answered_at) }));
  }

  // ---- Names ----

  async names(projectId: string, addresses: string[]) {
    const out = new Map<string, string>();
    if (!addresses.length) return out;
    const marks = addresses.map(() => '?').join(', ');
    for (const r of this.all(
      `SELECT address, name FROM names WHERE project_id = ? AND address IN (${marks})`,
      projectId,
      ...addresses,
    )) {
      out.set(String(r.address), String(r.name));
    }
    return out;
  }

  async setName(projectId: string, address: string, name: string | undefined) {
    if (name) {
      this.run(
        `INSERT INTO names (project_id, address, name) VALUES (?, ?, ?)
         ON CONFLICT(project_id, address) DO UPDATE SET name = excluded.name`,
        projectId,
        address,
        name,
      );
    } else {
      this.run('DELETE FROM names WHERE project_id = ? AND address = ?', projectId, address);
    }
  }

  // ---- Seen ----

  async getSeen(projectId: string, owner: string) {
    const row = this.get('SELECT at FROM seen WHERE project_id = ? AND owner = ?', projectId, owner);
    return Number(row?.at ?? 0);
  }

  async setSeen(projectId: string, owner: string, at: number) {
    this.run(
      `INSERT INTO seen (project_id, owner, at) VALUES (?, ?, ?)
       ON CONFLICT(project_id, owner) DO UPDATE SET at = excluded.at`,
      projectId,
      owner,
      at,
    );
  }
}

/** A database row back into the shape the rest of the server speaks. */
function toRow(r: Record<string, unknown>): PostRow {
  const row: PostRow = {
    projectId: String(r.project_id),
    id: String(r.id),
    author: String(r.author),
    anon: Number(r.anon) === 1,
    kind: String(r.kind) as PostKind,
    text: String(r.text),
    at: Number(r.at),
    status: String(r.status) as PostStatus,
  };
  if (r.reply_text !== null && r.reply_text !== undefined) {
    row.reply = { text: String(r.reply_text), at: Number(r.reply_at) };
  }
  if (Number(r.hidden) === 1) row.hidden = true;
  if (typeof r.context === 'string') row.context = JSON.parse(r.context) as PostContext;
  if (r.answered_at !== null && r.answered_at !== undefined) row.answeredAt = Number(r.answered_at);
  return row;
}
