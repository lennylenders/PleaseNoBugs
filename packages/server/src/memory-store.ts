import type { Answer, Project } from '@pleasenobugs/core';
import type { PostPatch, PostRow, PostWithVotes, ProjectStats, Store, TelemetryRow } from './store.js';

/**
 * Everything in a few maps, gone when the process ends.
 *
 * For tests and for trying the server out. It is also the reference the other
 * stores are checked against: if SQLite and this disagree, the contract test
 * fails, and this one is the easier of the two to read.
 *
 * Atomic for free: every method does its work synchronously before its first
 * (implicit) await, so two requests can never interleave inside one.
 */
export class MemoryStore implements Store {
  private projectMap = new Map<string, Project>();
  /** projectId → postId → row */
  private postRows = new Map<string, Map<string, PostRow>>();
  /** `${projectId}|${postId}` → voters */
  private votes = new Map<string, Set<string>>();
  /** `${projectId}|${address}` → name */
  private nameRows = new Map<string, string>();
  /** `${projectId}|${owner}` → at */
  private seen = new Map<string, number>();
  private meta = new Map<string, string>();
  /** `${instance}|${project}` → latest row */
  private telemetryRows = new Map<string, TelemetryRow>();

  async projects() {
    return [...this.projectMap.values()].map((p) => structuredClone(p));
  }

  async projectStats(projectId: string): Promise<ProjectStats> {
    const out: ProjectStats = { bugs: 0, ideas: 0, bugsDone: 0, ideasDone: 0 };
    for (const row of this.board(projectId).values()) {
      if (row.hidden) continue;
      const done = row.status === 'done';
      if (row.kind === 'bug') {
        out.bugs++;
        if (done) out.bugsDone++;
      } else {
        out.ideas++;
        if (done) out.ideasDone++;
      }
    }
    return out;
  }

  async getMeta(key: string) {
    return this.meta.get(key) ?? null;
  }

  async setMeta(key: string, value: string) {
    this.meta.set(key, value);
  }

  async putTelemetry(row: TelemetryRow) {
    this.telemetryRows.set(`${row.instance}|${row.project}`, { ...row });
  }

  async telemetry() {
    return [...this.telemetryRows.values()].map((r) => ({ ...r }));
  }

  async getProject(id: string) {
    const p = this.projectMap.get(id);
    return p ? structuredClone(p) : null;
  }

  async putProject(project: Project) {
    this.projectMap.set(project.id, structuredClone(project));
  }

  async projectsOwnedBy(address: string) {
    return [...this.projectMap.values()]
      .filter((p) => p.owners.includes(address))
      .map((p) => structuredClone(p));
  }

  private board(projectId: string) {
    let b = this.postRows.get(projectId);
    if (!b) this.postRows.set(projectId, (b = new Map()));
    return b;
  }

  async posts(projectId: string, reader: string | null): Promise<PostWithVotes[]> {
    return [...this.board(projectId).values()].map((row) => {
      const voters = this.votes.get(`${projectId}|${row.id}`) ?? new Set<string>();
      return {
        ...structuredClone(row),
        votes: voters.size,
        voted: reader !== null && voters.has(reader),
      };
    });
  }

  async getPost(projectId: string, id: string) {
    const row = this.board(projectId).get(id);
    return row ? structuredClone(row) : null;
  }

  async createPost(row: PostRow) {
    const b = this.board(row.projectId);
    if (b.has(row.id)) return false;
    b.set(row.id, structuredClone(row));
    this.votes.set(`${row.projectId}|${row.id}`, new Set([row.author]));
    return true;
  }

  async updatePost(projectId: string, id: string, patch: PostPatch) {
    const row = this.board(projectId).get(id);
    if (!row) return;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.reply === null) delete row.reply;
    else if (patch.reply !== undefined) row.reply = { ...patch.reply };
    if (patch.hidden !== undefined) {
      if (patch.hidden) row.hidden = true;
      else delete row.hidden;
    }
    if (patch.answeredAt !== undefined) row.answeredAt = patch.answeredAt;
  }

  async deletePost(projectId: string, id: string) {
    this.board(projectId).delete(id);
    this.votes.delete(`${projectId}|${id}`);
  }

  async vote(projectId: string, id: string, voter: string, up: boolean) {
    const key = `${projectId}|${id}`;
    let voters = this.votes.get(key);
    if (!voters) this.votes.set(key, (voters = new Set()));
    if (up) voters.add(voter);
    else voters.delete(voter);
    return voters.size;
  }

  async countByAuthorSince(projectId: string, author: string, since: number) {
    let n = 0;
    for (const row of this.board(projectId).values()) {
      if (row.author === author && row.at > since) n++;
    }
    return n;
  }

  async countSince(projectId: string, since: number) {
    let n = 0;
    for (const row of this.board(projectId).values()) if (row.at > since) n++;
    return n;
  }

  async answersFor(projectId: string, author: string, limit: number): Promise<Answer[]> {
    return [...this.board(projectId).values()]
      .filter((r) => r.author === author && r.answeredAt !== undefined)
      .sort((a, b) => (b.answeredAt ?? 0) - (a.answeredAt ?? 0))
      .slice(0, limit)
      .map((r) => ({ id: r.id, text: r.text, at: r.answeredAt as number }));
  }

  async names(projectId: string, addresses: string[]) {
    const out = new Map<string, string>();
    for (const a of addresses) {
      const name = this.nameRows.get(`${projectId}|${a}`);
      if (name) out.set(a, name);
    }
    return out;
  }

  async setName(projectId: string, address: string, name: string | undefined) {
    const key = `${projectId}|${address}`;
    if (name) this.nameRows.set(key, name);
    else this.nameRows.delete(key);
  }

  async getSeen(projectId: string, owner: string) {
    return this.seen.get(`${projectId}|${owner}`) ?? 0;
  }

  async setSeen(projectId: string, owner: string, at: number) {
    this.seen.set(`${projectId}|${owner}`, at);
  }
}
