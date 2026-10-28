import {
  NAME_MAX,
  POST_ID_MAX,
  cleanContext,
  isNimiqAddress,
  isPostKind,
  isPostStatus,
  isRating,
  normalizeAddress,
  type Project,
} from '@pleasenobugs/core';
import type { PostRow, Store } from './store.js';

/**
 * Bring an existing board in: posts, their votes and the names that go with
 * them. For anybody moving from a board of their own, which is how Shitti got
 * here.
 *
 * The file is one JSON object:
 *
 * ```json
 * {
 *   "posts": [{
 *     "id": "post-1", "author": "NQ07 ...", "anon": false,
 *     "kind": "idea", "text": "Dark mode", "at": 1760000000000,
 *     "status": "planned", "votes": ["NQ07 ...", "NQ12 ..."],
 *     "reply": { "text": "Soon", "at": 1760000100000 },
 *     "answeredAt": 1760000100000, "hidden": false,
 *     "context": { "host": "nimiq-pay" }
 *   }, {
 *     "id": "post-2", "author": "NQ12 ...", "kind": "review", "rating": 5,
 *     "text": "Love it", "at": 1760000200000
 *   }],
 *   "names": { "NQ07 ...": "Fons" }
 * }
 * ```
 *
 * **It refuses rather than guesses.** A post with a field it cannot read stops
 * the whole import before anything is written, and says which one: half an
 * import is worse than none, because running it again afterwards would then
 * have to work out which half it was.
 *
 * **Running it twice is harmless.** A post whose id exists is left alone,
 * votes are a set, names are overwritten with the same name.
 *
 * Text is taken as it was, even past this project's `textMax`: those limits
 * are about what people may write from now on, and cutting the end off
 * somebody's old post to fit a new rule would be rewriting history.
 */
export interface ImportFile {
  posts: unknown[];
  names?: Record<string, unknown>;
}

export interface ImportReport {
  imported: number;
  skipped: number;
  votes: number;
  names: number;
}

/** Thrown before anything is written, naming the post that did not hold up. */
export class ImportError extends Error {}

export async function importBoard(store: Store, project: Project, file: unknown): Promise<ImportReport> {
  if (!file || typeof file !== 'object' || !Array.isArray((file as ImportFile).posts)) {
    throw new ImportError('The file needs a "posts" array.');
  }
  const { posts, names = {} } = file as ImportFile;

  // Read everything first, write nothing until all of it holds up.
  const rows: { row: PostRow; votes: string[] }[] = posts.map((raw, i) => {
    const where = `posts[${i}]`;
    if (!raw || typeof raw !== 'object') throw new ImportError(`${where} is not an object.`);
    const p = raw as Record<string, unknown>;
    const id = p.id;
    if (typeof id !== 'string' || !id || id.length > POST_ID_MAX) throw new ImportError(`${where}.id`);
    if (!isNimiqAddress(p.author)) throw new ImportError(`${where}.author (${id})`);
    if (!isPostKind(p.kind)) throw new ImportError(`${where}.kind (${id})`);
    if (typeof p.text !== 'string' || !p.text.trim()) throw new ImportError(`${where}.text (${id})`);
    if (typeof p.at !== 'number' || !Number.isFinite(p.at)) throw new ImportError(`${where}.at (${id})`);
    const status = p.status ?? 'open';
    if (!isPostStatus(status) || (p.kind === 'review' && status !== 'open')) {
      throw new ImportError(`${where}.status (${id})`);
    }
    if (p.kind === 'review' ? !isRating(p.rating) : p.rating !== undefined) {
      throw new ImportError(`${where}.rating (${id})`);
    }
    const votes = p.votes ?? [];
    if (!Array.isArray(votes) || !votes.every(isNimiqAddress)) throw new ImportError(`${where}.votes (${id})`);
    let reply: PostRow['reply'];
    if (p.reply !== undefined && p.reply !== null) {
      const r = p.reply as Record<string, unknown>;
      if (typeof r.text !== 'string' || typeof r.at !== 'number') throw new ImportError(`${where}.reply (${id})`);
      reply = { text: r.text, at: r.at };
    }
    const context = p.context === undefined ? null : cleanContext(p.context);
    if (p.context !== undefined && context === null) throw new ImportError(`${where}.context (${id})`);

    const row: PostRow = {
      projectId: project.id,
      id,
      author: normalizeAddress(p.author),
      anon: p.anon !== false,
      kind: p.kind,
      text: p.text.trim(),
      at: p.at,
      status,
      ...(reply ? { reply } : {}),
      ...(p.hidden === true ? { hidden: true } : {}),
      ...(context && Object.keys(context).length ? { context } : {}),
      ...(typeof p.answeredAt === 'number' ? { answeredAt: p.answeredAt } : {}),
      ...(p.kind === 'review' ? { rating: p.rating as number } : {}),
    };
    return { row, votes: votes.map((v) => normalizeAddress(v as string)) };
  });

  const namePairs = Object.entries(names).map(([address, name]) => {
    if (!isNimiqAddress(address) || typeof name !== 'string') throw new ImportError(`names["${address}"]`);
    return [normalizeAddress(address), name.trim().slice(0, NAME_MAX)] as const;
  });

  const report: ImportReport = { imported: 0, skipped: 0, votes: 0, names: 0 };
  for (const { row, votes } of rows) {
    if (await store.createPost(row)) report.imported++;
    else report.skipped++;
    for (const voter of votes) {
      if (voter === row.author) continue; // createPost already counted the author
      await store.vote(project.id, row.id, voter, true);
      report.votes++;
    }
  }
  for (const [address, name] of namePairs) {
    if (!name) continue;
    await store.setName(project.id, address, name);
    report.names++;
  }
  return report;
}
