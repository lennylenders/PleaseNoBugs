import type { Post, Project, PublicProject } from '@pleasenobugs/core';
import type { PostWithVotes } from './store.js';

/**
 * Trim a stored post down to what one reader may have.
 *
 * Everything left out is the point: the author's address never leaves, named
 * or not, and neither does the list of who voted. A reader learns only whether
 * they wrote it and whether they voted.
 *
 * @param row     the stored post with its vote count
 * @param reader  the wallet asking, normalised, or null for a stranger
 * @param name    the author's display name, if they have one
 * @param owner   whether the reader owns the project, which adds the
 *                owner-only fields
 *
 * @example
 * // An anonymous post keeps its text and loses its author entirely:
 * toVisible({ ...row, anon: true }, someoneElse, 'Fons', false).who   // → undefined
 */
export function toVisible(
  row: PostWithVotes,
  reader: string | null,
  name: string | undefined,
  owner: boolean,
): Post {
  const out: Post = {
    id: row.id,
    kind: row.kind,
    text: row.text,
    at: row.at,
    status: row.status,
    votes: row.votes,
    voted: row.voted,
    mine: reader !== null && row.author === reader,
  };
  if (!row.anon && name) out.who = name;
  if (row.reply) out.reply = row.reply;
  if (row.rating !== undefined) out.rating = row.rating;
  if (owner) {
    if (row.context && Object.keys(row.context).length) out.context = row.context;
    if (row.hidden) out.hidden = true;
    if (row.shot) out.shot = true;
  }
  return out;
}

/** What a stranger may know about a project. Owners and origins stay in. */
export function publicProject(p: Project): PublicProject {
  return { id: p.id, name: p.name, rules: p.rules };
}
