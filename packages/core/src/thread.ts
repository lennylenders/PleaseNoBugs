import type { Message, PostKind, PostReply, PostStatus } from './types.js';

/**
 * The rules of the conversation under a post, in one place, so the server
 * that enforces them and the widget that draws them can never disagree about
 * whose turn it is.
 *
 * A hidden message does not count. To everybody but the owners it is not
 * there, so counting it would leave its author staring at a conversation that
 * ends with the app's question and no way to answer it.
 */

/** Whether a kind has a conversation the author can join. A review gets the app's answer and nothing back. */
export function takesAnswers(kind: PostKind): boolean {
  return kind === 'bug' || kind === 'idea';
}

/** Whether a status closes the conversation for the author: it is done, or will not be. */
export function isClosed(status: PostStatus): boolean {
  return status === 'done' || status === 'declined';
}

/** The messages everybody sees, in order. */
export function shownThread(thread: Message[] | undefined): Message[] {
  return (thread ?? []).filter((m) => !m.hidden);
}

/** The last message everybody sees, or undefined before anybody wrote. */
export function lastWord(thread: Message[] | undefined): Message | undefined {
  const shown = shownThread(thread);
  return shown[shown.length - 1];
}

/**
 * Whether the author may write under their post now: a bug or an idea that
 * is still open or planned, right after a message from the app.
 *
 * @example
 * authorMayAnswer({ kind: 'bug', status: 'open', thread: [{ from: 'app', … }] })   // → true
 * authorMayAnswer({ kind: 'bug', status: 'open', thread: [{ from: 'author', … }] }) // → false, the app is next
 */
export function authorMayAnswer(post: { kind: PostKind; status: PostStatus; thread?: Message[] }): boolean {
  return takesAnswers(post.kind) && !isClosed(post.status) && lastWord(post.thread)?.from === 'app';
}

/** Whether the author answered and the app has not said anything since: what "New answer" means to an owner. */
export function waitingOnApp(post: { thread?: Message[] }): boolean {
  return lastWord(post.thread)?.from === 'author';
}

/** The app's latest message as the one reply widgets from before conversations read, or undefined. */
export function latestReply(thread: Message[] | undefined): PostReply | undefined {
  const app = shownThread(thread).filter((m) => m.from === 'app');
  const last = app[app.length - 1];
  return last ? { text: last.text, at: last.at } : undefined;
}
