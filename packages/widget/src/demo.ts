import {
  DEFAULT_RULES,
  authorMayAnswer,
  cleanFix,
  identiconCode,
  shortAddress,
  isClosed,
  lastWord,
  latestReply,
  type BoardRead,
  type Message,
  type MessageFrom,
  type Post,
  type PostKind,
  type PostStatus,
  type Update,
} from '@pleasenobugs/core';
import type { Client, Result } from './client.js';

/**
 * A board that lives in this page's memory, for `<please-no-bugs demo>`.
 *
 * What a website showing off the widget needs, and a developer trying it
 * before they run a server: every screen works (voting, writing, the tiles,
 * "Feedback sent!") and **nothing leaves the browser**. Nothing is stored
 * either, not even in `localStorage`, so a reload is a fresh board.
 *
 * The visitor is signed in from the start as an ordinary user: a demo shows
 * what an app's users see. With `owner` (`<please-no-bugs demo="owner">`)
 * they are the app's owner instead, and the owner's side works too:
 * answering, a status, "Fixed in", hiding, writing and deleting updates.
 * Still nothing leaves the browser.
 *
 * The conversation under a post follows the server's turns: a visitor's own
 * idea starts with a question from the app they can answer, and an owner
 * finds a bug whose author answered and waits for them.
 *
 * With `samples`, the board starts with those posts instead of its own, and
 * with no updates (its own updates are about its own posts): for a page that
 * tells one short story, such as the website's home page tour.
 *
 * Typed as a {@link Client}, so a change to the real client that this one
 * does not follow is a type error rather than a demo that quietly lies.
 */
export function createDemoClient({
  owner = false,
  samples,
  identicons,
}: {
  owner?: boolean;
  samples?: DemoSample[];
  /** A PleaseNoBugs server to draw the identicons; without one, stand-ins in their colour. */
  identicons?: string;
} = {}): Client {
  const now = Date.now();
  let posts: Post[] = (samples ?? SAMPLES).map((s, i) => ({
    id: `demo-${i}`,
    kind: s.kind,
    text: s.text,
    at: now - (s.ago ?? HOUR),
    status: s.status ?? 'open',
    votes: s.votes ?? 1,
    voted: false,
    // A visitor's own; an owner is never the author of a sample.
    mine: !owner && !!s.mine,
    // A made-up wallet per name, so each sample author has an identicon of their
    // own; the visitor's own posts (`mine`) carry the visitor's, also where the
    // owner reads them, so one person has one picture on both sides.
    ...(s.who ? { who: s.who, face: s.mine ? ME_FACE : identiconCode(`NQ00 ${s.who}`) } : {}),
    ...(s.rating ? { rating: s.rating } : {}),
    ...conversation(i, s, now - (s.ago ?? HOUR)),
    ...(s.fix ? { fix: { version: s.fix, link: DEMO_LINK } } : {}),
    // What the app sent along, which only owners see.
    ...(owner && s.context ? { context: { ...s.context } } : {}),
  }));
  let updates: Update[] = (samples ? [] : UPDATES).map((u, i) => ({
    id: `demo-update-${i}`,
    title: u.title,
    text: u.text,
    version: u.version,
    link: DEMO_LINK,
    at: now - u.ago,
    posts: u.posts.map((n) => `demo-${n}`),
  }));
  let name: string | undefined;
  let left = DEFAULT_RULES.perDay;
  /** Screenshots the visitor put on the board, as data URLs: still nothing leaves the page. */
  const shots = new Map<string, string>();

  const ok = <T>(data: T): Promise<Result<T>> => later({ ok: true, data });
  const no = (
    status: number,
    error: 'not_found' | 'reviewed' | 'too_many' | 'not_owner' | 'not_yours' | 'bad_request' | 'not_your_turn' | 'closed',
  ) => later<never>({ ok: false, status, error });
  const find = (id: string) => posts.find((p) => p.id === id);
  /** A post's conversation changed: `reply` follows it, as the server's does. */
  const setThread = (p: Post, thread: Message[]) => {
    if (thread.length) p.thread = thread;
    else delete p.thread;
    const reply = latestReply(thread);
    if (reply) p.reply = reply;
    else delete p.reply;
  };
  /** Which side of a post's conversation the visitor is on, if any. */
  const side = (p: Post): MessageFrom | null => (owner ? 'app' : p.mine ? 'author' : null);

  return {
    project: 'demo',
    canSign: true,
    address: () => DEMO_ADDRESS,
    signIn: () => ok(DEMO_ADDRESS),
    signOut() {},

    // At once, without the wait: the tiles are there while the panel grows,
    // instead of a spinner they replace halfway.
    board: () =>
      Promise.resolve<Result<BoardRead>>({
        ok: true,
        data: {
          project: { id: 'demo', name: 'Demo app', rules: { ...DEFAULT_RULES, kinds: [...DEFAULT_RULES.kinds] } },
          posts: posts.map((p) => ({ ...p })),
          me: { owner, left, face: ME_FACE, short: ME_SHORT, ...(name ? { name } : {}) },
          updates: updates.length,
        },
      }),
    me: () => ok({ owner, left, face: ME_FACE, short: ME_SHORT, ...(name ? { name } : {}) }),
    answers: () => ok({ answers: [] }),

    post(p) {
      if (left <= 0) return no(429, 'too_many');
      if (p.kind === 'review' && posts.some((q) => q.mine && q.kind === 'review')) return no(409, 'reviewed');
      left -= 1;
      posts = [
        {
          id: p.id,
          kind: p.kind,
          text: p.text,
          at: Date.now(),
          status: 'open',
          votes: 1,
          voted: true,
          mine: true,
          ...(!p.anon ? { face: ME_FACE, ...(name ? { who: name } : { short: ME_SHORT }) } : {}),
          ...(p.kind === 'review' ? { rating: p.rating } : {}),
          ...(p.shot?.board ? { shot: true } : {}),
        },
        ...posts,
      ];
      // One kept for the owners only has nobody to show it to here.
      if (p.shot?.board) shots.set(p.id, `data:${p.shot.type};base64,${p.shot.data}`);
      return ok({ ok: true as const, left });
    },
    // The visitor's own screenshots on the board; nothing else exists here.
    shot: async (id) => {
      const url = shots.get(id);
      return url ? ok(await (await fetch(url)).blob()) : no(404, 'not_found');
    },
    shotUrl: (id) => shots.get(id) ?? '',
    // A server only to draw them, nothing else: without one, the card shows
    // the stand-in in the identicon's colour.
    faceUrl: (code) => (identicons ? `${identicons.replace(/\/+$/, '')}/v1/identicons/${encodeURIComponent(code)}.svg` : ''),
    vote(id, up) {
      const p = find(id);
      if (!p) return no(404, 'not_found');
      if (p.voted !== up) p.votes += up ? 1 : -1;
      p.voted = up;
      return ok({ ok: true as const, votes: p.votes, voted: p.voted });
    },
    remove(id) {
      const p = find(id);
      if (!p) return no(404, 'not_found');
      posts = posts.filter((q) => q !== p);
      shots.delete(id);
      return ok({ ok: true as const });
    },
    setName(n) {
      name = n.trim() || undefined;
      // Like the server: a name shows on the posts already written with one.
      for (const p of posts) {
        if (!p.mine || p.face === undefined) continue;
        if (name) {
          p.who = name;
          delete p.short;
        } else {
          delete p.who;
          p.short = ME_SHORT;
        }
      }
      return ok({ ok: true as const, ...(name ? { name } : {}) });
    },
    // As the server: one change for all of it, and a fix only on a done
    // bug or idea, gone as soon as it stands anywhere else.
    manage(id, change) {
      if (!owner) return no(403, 'not_owner');
      const p = find(id);
      if (!p) return no(404, 'not_found');
      if (change.status && p.kind !== 'review') p.status = change.status;
      if (change.reply !== undefined) {
        // As the server: the same words again change nothing, other words
        // change the app's last message or follow the author's answer.
        const text = change.reply.trim();
        const thread = p.thread ?? [];
        const last = lastWord(thread);
        if (text !== (latestReply(thread)?.text ?? '')) {
          if (last?.from === 'app') {
            setThread(
              p,
              text ? thread.map((m) => (m === last ? { ...m, text, edited: Date.now() } : m)) : thread.filter((m) => m !== last),
            );
          } else if (text) {
            setThread(p, [...thread, { id: `reply-${Date.now()}`, from: 'app', text, at: Date.now() }]);
          }
        }
      }
      if (change.hidden !== undefined) {
        if (change.hidden) p.hidden = true;
        else delete p.hidden;
      }
      if (change.approved) delete p.pending;
      if (p.status !== 'done' || p.kind === 'review') delete p.fix;
      else if (change.fix !== undefined) {
        const fix = change.fix && cleanFix(change.fix);
        if (change.fix && !fix) return no(400, 'bad_request');
        if (fix && (fix.version || fix.link)) p.fix = fix;
        else delete p.fix;
      }
      return ok({ ok: true as const });
    },
    // The conversation, by the server's rules (see `authorMayAnswer`).
    say(id, m) {
      const p = find(id);
      if (!p) return no(404, 'not_found');
      const from = side(p);
      const text = m.text.trim();
      if (!text || text.length > DEFAULT_RULES.replyMax) return no(400, 'bad_request');
      if (!from) return no(403, 'not_yours');
      if (from === 'author' && !authorMayAnswer(p)) {
        return no(409, p.kind === 'review' || isClosed(p.status) ? 'closed' : 'not_your_turn');
      }
      if (from === 'app' && p.kind === 'review' && p.thread?.some((x) => x.from === 'app')) return no(409, 'not_your_turn');
      const message: Message = { id: m.id, from, text, at: Date.now() };
      setThread(p, [...(p.thread ?? []), message]);
      return ok({ ok: true as const, message });
    },
    editMessage(id, messageId, change) {
      const p = find(id);
      const m = p?.thread?.find((x) => x.id === messageId);
      if (!p || !m) return no(404, 'not_found');
      let next: Message = { ...m };
      if (change.hidden !== undefined) {
        if (!owner) return no(403, 'not_owner');
        if (m.from !== 'author') return no(400, 'bad_request');
        if (change.hidden) next.hidden = true;
        else delete next.hidden;
      }
      if (change.text !== undefined) {
        const text = change.text.trim();
        if (!text || text.length > DEFAULT_RULES.replyMax) return no(400, 'bad_request');
        if (side(p) !== m.from) return no(403, 'not_yours');
        if (lastWord(p.thread)?.id !== m.id) return no(409, 'not_your_turn');
        if (text !== m.text) next = { ...next, text, edited: Date.now() };
      }
      setThread(p, (p.thread ?? []).map((x) => (x === m ? next : x)));
      return ok({ ok: true as const, message: next });
    },
    unsay(id, messageId) {
      const p = find(id);
      const m = p?.thread?.find((x) => x.id === messageId);
      if (!p || !m) return no(404, 'not_found');
      if (side(p) !== m.from) return no(403, 'not_yours');
      if (lastWord(p.thread)?.id !== m.id) return no(409, 'not_your_turn');
      setThread(p, (p.thread ?? []).filter((x) => x !== m));
      return ok({ ok: true as const });
    },
    // Only those whose posts are still here, like the server; at once, like
    // the board, so the page is there to read rather than a spinner first.
    updates: () =>
      Promise.resolve<Result<{ updates: Update[] }>>({
        ok: true,
        data: { updates: updates.map((u) => ({ ...u, posts: u.posts.filter((id) => !!find(id)) })) },
      }),
    // The bugs and ideas it names go to done, with its version and link.
    postUpdate(u) {
      if (!owner) return no(403, 'not_owner');
      const fix = cleanFix({ version: u.version ?? '', link: u.link });
      if (!u.title.trim() || !fix?.link) return no(400, 'bad_request');
      const named = (u.posts ?? []).filter((id) => {
        const p = find(id);
        return p && p.kind !== 'review';
      });
      for (const id of named) {
        const p = find(id) as Post;
        p.status = 'done';
        p.fix = fix;
      }
      const update: Update = {
        id: u.id,
        title: u.title.trim(),
        ...(u.text?.trim() ? { text: u.text.trim() } : {}),
        ...(fix.version ? { version: fix.version } : {}),
        link: fix.link,
        at: Date.now(),
        posts: named,
      };
      updates = [update, ...updates];
      return ok({ ok: true as const, update });
    },
    removeUpdate(id) {
      if (!owner) return no(403, 'not_owner');
      if (!updates.some((u) => u.id === id)) return no(404, 'not_found');
      updates = updates.filter((u) => u.id !== id);
      return ok({ ok: true as const });
    },
  };
}

/** Not a real address: nothing in a demo is anybody's. */
const DEMO_ADDRESS = 'NQ00 DEMO DEMO DEMO DEMO DEMO DEMO DEMO DEMO';
const ME_FACE = identiconCode(DEMO_ADDRESS);
const ME_SHORT = shortAddress(DEMO_ADDRESS);

/**
 * Where the demo's fixes and updates go: a real page on GitHub, this
 * project's own releases, so a tap in a demo never lands on a 404.
 */
const DEMO_LINK = 'https://github.com/lennylenders/PleaseNoBugs/releases';

/** A short wait, so the demo has the same rhythm as a board on a server. */
function later<T>(value: Result<T>): Promise<Result<T>> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 250));
}

/** A post a demo board starts with. Votes default to 1, and it was written an hour ago. */
export interface DemoSample {
  kind: PostKind;
  text: string;
  votes?: number;
  /** How long ago it was written, in milliseconds. */
  ago?: number;
  status?: PostStatus;
  who?: string;
  rating?: number;
  /** The app's one answer. */
  reply?: string;
  /** A conversation instead: who said what, in order. */
  thread?: [MessageFrom, string][];
  /** The visitor's own, so they can answer the app under it, with the visitor's identicon. On an owner's board it is not theirs, but keeps that identicon. */
  mine?: boolean;
  /** The version a done post was fixed in. */
  fix?: string;
  /** What the app sent along with it, shown to owners. */
  context?: Record<string, string>;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** A sample's messages, a few minutes apart after it was written, and the reply widgets before them read. */
function conversation(i: number, s: DemoSample, at: number): Pick<Post, 'thread' | 'reply'> {
  const said: [MessageFrom, string][] = s.thread ?? (s.reply ? [['app', s.reply]] : []);
  if (!said.length) return {};
  const thread: Message[] = said.map(([from, text], n) => ({
    id: `demo-${i}-m${n}`,
    from,
    text,
    at: at + (n + 1) * 5 * 60_000,
  }));
  const reply = latestReply(thread);
  return { thread, ...(reply ? { reply } : {}) };
}

/** The Updates page. `posts` are places in the samples. */
const UPDATES: { title: string; text: string; version: string; ago: number; posts: number[] }[] = [
  { title: 'Switching accounts works again', text: 'The send button stayed grey after you switched accounts. It now follows the account you picked.', version: '1.4.2', ago: 2 * DAY, posts: [1] },
  { title: 'Opens faster', text: 'About twice as fast on older phones.', version: '1.4.0', ago: 21 * DAY, posts: [] },
];

/** The demo board's posts. */
const SAMPLES: DemoSample[] = [
  { kind: 'idea', text: 'A dark mode that follows my phone', votes: 24, ago: 6 * DAY, status: 'planned', who: 'Mira', reply: 'On its way in the next release.' },
  { kind: 'bug', text: 'The send button does nothing after I switch accounts', votes: 17, ago: 2 * DAY, status: 'done', fix: '1.4.2', reply: 'Thanks for the steps, that made it easy to find.' },
  { kind: 'review', text: 'Fast, simple and it never asks me twice. Love it.', votes: 9, ago: 3 * DAY, rating: 5, who: 'Joost' },
  { kind: 'idea', text: 'Let me pin my favourite contacts to the top', votes: 12, ago: 4 * HOUR, mine: true, thread: [['app', 'Good one! Pinned at the top of the list, or on a Favourites tab of their own?']] },
  { kind: 'review', text: 'Does what it says. The history screen could be clearer.', votes: 4, ago: 9 * DAY, rating: 4 },
  { kind: 'bug', text: 'Amounts over 1,000 overlap the currency on small phones', votes: 6, ago: 20 * HOUR, who: 'Sam', context: { version: '1.4.2', screen: 'Send' }, thread: [['app', 'Thanks! Which phone is it, and which currency?'], ['author', 'An iPhone SE, in euros.']] },
  { kind: 'idea', text: 'Export my history as a CSV file', votes: 3, ago: 12 * DAY, status: 'declined', reply: 'Not for now: it would mean storing more than we want to.' },
];
