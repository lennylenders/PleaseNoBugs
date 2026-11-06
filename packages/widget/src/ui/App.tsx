import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  createMatcher,
  isClosed,
  lastWord,
  sortPosts,
  waitingOnApp,
  type BoardRead,
  type BoardSort,
  type Message,
  type Post,
  type PostContext,
  type PostKind,
} from '@pleasenobugs/core';
import type { Client } from '../client.js';
import { NO_FILTER, filtersOn, findIn, matchesFilter, type BoardFilter, type Found, type OwnFilter } from '../filter.js';
import { forReaders } from '../readonly.js';
import { insideNimiqPay } from '../signer.js';
import type { CopyKey, Translate } from '../i18n.js';
import { Choose, Sent } from './Choose.js';
import { Compose, type Draft, type Screenshots } from './Compose.js';
import { Badge, CodeLink, PostCard, Stars } from './PostCard.js';
import { Manage, type ManageChange } from './Manage.js';
import { DeleteSheet, FilterSheet, ShotSheet, filterLabel } from './Sheets.js';
import { Talk } from './Talk.js';
import { Updates, type UpdateDraft } from './Updates.js';
import * as Icon from './icons.js';

const PER_PAGE = 15;

/**
 * Whether a post's screenshot is on the board, so it can be shown as a plain
 * image. An owner hears about every screenshot, but reads one that is not on
 * the board through the page where they answer it, with their proof; nor is one under a
 * post they hid.
 */
const onBoard = (p: Post) => !!p.shot && (p.shotFor ?? 'board') === 'board' && !p.hidden;
/** How long a toast stays up, and the "Feedback sent!" screen. */
const TOAST_MS = 2600;

export interface AppProps {
  client: Client;
  t: Translate;
  locale: string;
  /** What the board calls the app ("{app} says"). Defaults to the project's name. */
  appName?: string;
  /** A display name the host app already knows, offered when the user shows theirs. */
  suggestName?: string;
  /** Sent with every bug, to owners only: a version, a screen. */
  context?: PostContext;
  /** Words common in this app, so the lookalike matcher ignores them. */
  noise?: string[];
  /** Offer only these kinds, of the ones the project accepts. All of them when absent. */
  kinds?: PostKind[];
  /** Whether bugs and ideas may carry a screenshot, and who sees it. On the board unless set otherwise. */
  screenshots?: Screenshots;
  /**
   * The board to read and nothing else: no writing, no votes, no signing in,
   * every post anonymous and without its screenshot (see `forReaders`).
   */
  readonly?: boolean;
  /** Whether a writer may show a name. Off for a board on a public page, where nobody should leave one. */
  names?: boolean;
  /** Present when the board is an overlay: draws the X. */
  onClose?: () => void;
  /**
   * What opens first: the board, or the tiles that ask what to write. The
   * element starts every way on the tiles, the board one tap under them,
   * unless it says `start="board"`.
   */
  start?: 'board' | 'choose';
  /**
   * A screen to show and keep showing, for the demo only: the website's
   * configurator puts each part it is changing in view. "Feedback sent!" then
   * stays up instead of going back to the board.
   */
  screen?: View;
  onPosted?: (post: { id: string; kind: PostKind }) => void;
}

export type View = 'board' | 'choose' | 'compose' | 'sent' | 'updates' | 'talk' | 'manage';

/** Whatever is over the board, as one value so two can never be up at once. */
type Over =
  | { kind: 'delete'; post: Post }
  | { kind: 'shot'; post: Post }
  | { kind: 'filter' }
  | null;

/**
 * The whole board: the list, writing one, the pages under it, and the sheets over it.
 *
 * **It owns its data and fetches it when it opens**, then again after anything
 * it did. A feedback board is a page people open now and then; polling it
 * would be traffic for nobody.
 *
 * Voting is optimistic and corrected from what the server answers, because a
 * tap that waits a round trip before the number moves reads as a tap that
 * missed. Posting is the opposite and waits (see {@link Compose}).
 */
export function App({
  client,
  t,
  locale,
  appName,
  suggestName,
  context,
  noise,
  kinds: offered,
  screenshots = 'board',
  readonly = false,
  names = true,
  onClose,
  onPosted,
  start: asked = 'board',
  screen,
}: AppProps) {
  // The tiles are the way to writing, which a read-only board does not have.
  const start = readonly ? 'board' : asked;
  const [read, setRead] = useState<BoardRead | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<View>(screen ?? start);
  // The tiles as the first screen, until the board has been visited: then
  // they are a step on the way to writing, with a way back.
  const [first, setFirst] = useState(start === 'choose');
  const [writing, setWriting] = useState<PostKind>('bug');
  const [sort, setSort] = useState<BoardSort>('top');
  const [filter, setFilterNow] = useState<BoardFilter>(NO_FILTER);
  const [query, setQueryNow] = useState('');
  // The post whose conversation is open, on its own page.
  const [talking, setTalking] = useState<string | null>(null);
  // The post an owner is answering, on its own page.
  const [managing, setManaging] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [over, setOver] = useState<Over>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [away, setAway] = useState(false);
  // Whether the last post landed on a board that approves first.
  const [waiting, setWaiting] = useState(false);
  // The posts of yours whose "it is fixed" note you closed.
  const [seen, setSeen] = useState<string[]>(() => readSeen(client.project, 'fixed'));
  // The answers from the app you read or closed the note for, as `post@at`.
  const [heard, setHeard] = useState<string[]>(() => readSeen(client.project, 'answered'));
  const scroller = useRef<HTMLDivElement>(null);

  // Keyed on the words rather than the array, which the element hands over as
  // a fresh one on every render.
  const noiseKey = (noise ?? []).join('|');
  const likeThis = useMemo(() => createMatcher(noiseKey ? noiseKey.split('|') : []), [noiseKey]);

  // Whether a board has ever arrived, as a ref so `pull` does not go stale.
  // A refresh that fails after a good read keeps the board on screen; only a
  // first read that fails says the board is unreachable.
  const loaded = useRef(false);
  const pull = useCallback(async (): Promise<BoardRead | null> => {
    const res = await client.board();
    if (res.ok) {
      loaded.current = true;
      const board = readonly ? forReaders(res.data) : res.data;
      setRead(board);
      setFailed(false);
      return board;
    }
    if (!loaded.current) setFailed(true);
    return null;
  }, [client, readonly]);

  useEffect(() => {
    void pull();
  }, [pull]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (screen) setView(screen);
  }, [screen]);

  useEffect(() => {
    if (view !== 'sent' || screen === 'sent') return;
    const id = setTimeout(() => {
      setFirst(false);
      setView('board');
    }, TOAST_MS);
    return () => clearTimeout(id);
  }, [view, screen]);

  /**
   * The order pill steps aside going down and comes straight back going up.
   * Wanting it back is deliberate, so it answers sooner (8px) than it leaves
   * (24px), and it never hides near the top where there is nothing under it.
   */
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let last = el.scrollTop;
    let travel = 0;
    const onScroll = () => {
      const y = el.scrollTop;
      const d = y - last;
      last = y;
      if (y < 48) {
        travel = 0;
        setAway(false);
        return;
      }
      travel = Math.sign(d) === Math.sign(travel) ? travel + d : d;
      if (travel > 24) setAway(true);
      else if (travel < -8) setAway(false);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [view, read]);

  const name = appName ?? read?.project.name ?? '';
  const rules = read?.project.rules;
  // The stricter of what this page asks and what the board allows, so the
  // button is never offered for something the server would refuse.
  const shots = strictest(screenshots, rules?.screenshots ?? 'board');
  const owner = !!read?.me?.owner;
  const posts = read?.posts ?? [];

  // What the project accepts, narrowed to what this page offers. A kind left
  // out is left out of the list as well, not only off the tiles.
  const kinds = (rules?.kinds ?? ['bug', 'idea']).filter((k) => !offered || offered.includes(k));
  const kindsKey = kinds.join(',');

  // A held writing screen writes a kind that is on offer.
  useEffect(() => {
    if (screen && kinds.length && !kinds.includes(writing)) setWriting(kinds[0]);
  }, [screen, kindsKey]);

  // A new search or filter starts at the first page, which is where its best
  // match is.
  const setFilter = (f: BoardFilter) => {
    setFilterNow(f);
    setPage(1);
  };
  const setQuery = (q: string) => {
    setQueryNow(q);
    setPage(1);
  };
  const on = filtersOn(filter);
  const searching = !!query.trim();

  const here = useMemo(
    () => posts.filter((p) => (owner || !p.hidden) && kindsKey.split(',').includes(p.kind)),
    [posts, owner, kindsKey],
  );
  /** Every post that passes the filter and the search, and where the search found it. */
  const found = useMemo(() => {
    const out = new Map<string, Found>();
    for (const p of here) {
      if (!matchesFilter(p, filter)) continue;
      const where = findIn(p, query);
      if (where) out.set(p.id, where);
    }
    return out;
  }, [here, filter, query]);
  const shown = useMemo(() => sortPosts(here.filter((p) => found.has(p.id)), sort), [here, found, sort]);
  /** How many posts a filter would leave, for the panel's button. */
  const countFor = (f: BoardFilter) => here.filter((p) => matchesFilter(p, f) && findIn(p, query)).length;
  // What an owner may narrow to. Waiting for approval only where it happens.
  const ownFilters: OwnFilter[] = owner
    ? ['waiting', 'hidden', ...(rules?.approve || posts.some((p) => p.pending) ? (['pending'] as const) : [])]
    : [];
  /** For an owner: bugs and ideas whose author answered and the app has not since. */
  const waitingCount = owner ? here.filter((p) => !p.hidden && waitingOnApp(p)).length : 0;

  /** The average over the reviews on the board, hidden ones left out for owners too. */
  const rating = useMemo(() => {
    const stars = posts.filter((p) => p.kind === 'review' && !p.hidden && p.rating).map((p) => p.rating as number);
    return stars.length ? { avg: stars.reduce((a, b) => a + b, 0) / stars.length, n: stars.length } : null;
  }, [posts]);
  /**
   * One of your own bugs or ideas that is done, which you have not closed
   * the note for yet: the newest. Worked out from the board, which already
   * says which posts are yours, so it costs no request and tells the server
   * nothing.
   */
  const news = useMemo(
    () =>
      posts
        .filter((p) => p.mine && p.status === 'done' && (p.kind === 'bug' || p.kind === 'idea') && !seen.includes(p.id))
        .sort((a, b) => b.at - a.at)[0],
    [posts, seen],
  );
  const closeNews = (id: string) => {
    const next = [...seen, id].slice(-SEEN_MAX);
    setSeen(next);
    writeSeen(client.project, 'fixed', next);
  };

  /**
   * One of your own posts the app said something under that you have not
   * read: the newest. A done one tells you with the note above instead.
   */
  const answered = useMemo(() => {
    const unread = posts
      .map((p) => ({ p, last: lastWord(p.thread) }))
      .filter(
        ({ p, last }) =>
          p.mine &&
          last?.from === 'app' &&
          (p.kind === 'review' || !isClosed(p.status)) &&
          !heard.includes(`${p.id}@${last.at}`),
      )
      .sort((a, b) => (b.last?.at ?? 0) - (a.last?.at ?? 0));
    return unread[0]?.p;
  }, [posts, heard]);
  /** You read what the app said under one of yours, by opening it or closing the note. */
  const hear = (post: Post) => {
    const last = lastWord(post.thread);
    if (!last || last.from !== 'app') return;
    const next = [...heard.filter((h) => !h.startsWith(`${post.id}@`)), `${post.id}@${last.at}`].slice(-SEEN_MAX);
    setHeard(next);
    writeSeen(client.project, 'answered', next);
  };
  const openTalk = (post: Post) => {
    hear(post);
    setTalking(post.id);
    setView('talk');
  };

  /** An owner's way into a post: its page for answering it. */
  const openManage = (post: Post) => {
    setManaging(post.id);
    setView('manage');
  };

  // An owner always, to write the first one; anybody else once there is one.
  const hasUpdates = !!rules && (owner || (read?.updates ?? 0) > 0);

  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
  const at = Math.min(page, pages);
  const slice = shown.slice((at - 1) * PER_PAGE, at * PER_PAGE);

  const patch = (id: string, change: Partial<Post>) =>
    setRead((r) => (r ? { ...r, posts: r.posts.map((p) => (p.id === id ? { ...p, ...change } : p)) } : r));

  /** A refusal that is not about the post itself, said the same way everywhere. */
  const sayRefusal = (error: string) => {
    if (error === 'no_signer') setToast(t('board.needWallet', { app: name }));
    else if (error !== 'declined') setToast(t('board.failed'));
  };

  const vote = async (id: string, up: boolean) => {
    const before = posts.find((p) => p.id === id);
    if (!before) return;
    patch(id, { votes: Math.max(0, before.votes + (up ? 1 : -1)), voted: up });
    const res = await client.vote(id, up);
    if (res.ok) {
      patch(id, { votes: res.data.votes, voted: res.data.voted });
      // The first write is often the one that signed in: pick up `me` with it.
      if (!read?.me) void pull();
    } else {
      patch(id, { votes: before.votes, voted: before.voted });
      sayRefusal(res.error);
    }
  };

  const send = async (draft: Draft): Promise<{ key: CopyKey | null; vars?: Record<string, string | number> } | null> => {
    const id = newId();
    // What the owner needs to reproduce a bug, and only on a bug: an idea does
    // not get better for knowing which build it was written on.
    const sentWith: PostContext | undefined =
      draft.kind === 'bug' ? { ...context, host: insideNimiqPay() ? 'nimiq-pay' : 'browser' } : undefined;

    const res = await client.post({
      id,
      kind: draft.kind,
      text: draft.text,
      anon: draft.anon,
      context: sentWith,
      rating: draft.rating,
      shot: draft.shot
        ? { type: draft.shot.type, data: draft.shot.data, ...(draft.shot.board ? { board: true } : {}) }
        : undefined,
    });
    if (!res.ok) {
      if (res.error === 'declined') return { key: null };
      if (res.error === 'no_signer') return { key: 'board.needWallet', vars: { app: name } };
      if (res.error === 'reviewed') {
        void pull();
        return { key: 'board.reviewed', vars: { app: name } };
      }
      if (res.error === 'too_many') {
        void pull();
        return { key: 'board.failedFull', vars: { max: rules?.perDay ?? 5 } };
      }
      return { key: 'board.failed' };
    }
    // Only now: setting a name is a write, and the post was the one that
    // signed in. A failure here costs a name on a card, never the post.
    if (!draft.anon && draft.name && draft.name !== read?.me?.name) await client.setName(draft.name);

    setWaiting(!!res.data.pending);
    setView('sent');
    setSort('new');
    setFilterNow(NO_FILTER);
    setQueryNow('');
    setPage(1);
    onPosted?.({ id, kind: draft.kind });
    await pull();
    return null;
  };

  /**
   * Sign in without doing anything else. Reading never asks the wallet, so
   * without this an owner would see no way to answer until their first vote,
   * and nobody would see how many posts they have left before writing one.
   */
  const signIn = async () => {
    const res = await client.signIn();
    if (res.ok) await pull();
    else sayRefusal(res.error);
  };

  const remove = async (post: Post) => {
    setOver(null);
    setRead((r) => (r ? { ...r, posts: r.posts.filter((p) => p.id !== post.id) } : r));
    const res = await client.remove(post.id);
    if (!res.ok) sayRefusal(res.error);
    void pull();
  };

  const manage = async (post: Post, change: ManageChange) => {
    // Saved: back to the board, where the card shows what changed.
    setView('board');
    const { message, ...rest } = change;
    patch(post.id, {
      status: rest.status,
      hidden: rest.hidden || undefined,
      fix: rest.status === 'done' && (rest.fix?.version || rest.fix?.link) ? rest.fix : undefined,
      ...(rest.shotOff !== undefined ? { shotFor: rest.shotOff ? 'off' : 'board' } : {}),
      ...(rest.approved ? { pending: undefined } : {}),
    });
    const res = await client.manage(post.id, rest);
    if (!res.ok) sayRefusal(res.error);
    else if (message) {
      const said = message.edit
        ? await client.editMessage(post.id, message.edit, { text: message.text })
        : await client.say(post.id, { id: newId(), text: message.text });
      if (!said.ok) refusedInTalk(said.error);
    }
    void pull();
  };

  /**
   * The conversation moved on, or closed, between reading it and answering:
   * say so and show it as it is now, rather than an error about turns.
   */
  const refusedInTalk = (error: string) => {
    if (error === 'not_your_turn' || error === 'closed' || error === 'not_found' || error === 'no_post') {
      setToast(t('talk.moved'));
      void pull();
    } else {
      sayRefusal(error);
    }
  };
  /** Each answers whether it landed, so the box keeps the words when it did not. */
  const sayUnder = async (post: Post, text: string) => {
    const res = await client.say(post.id, { id: newId(), text });
    if (!res.ok) {
      refusedInTalk(res.error);
      return false;
    }
    await pull();
    return true;
  };
  const editUnder = async (post: Post, m: Message, text: string) => {
    const res = await client.editMessage(post.id, m.id, { text });
    if (!res.ok) {
      refusedInTalk(res.error);
      return false;
    }
    await pull();
    return true;
  };
  const unsayUnder = async (post: Post, m: Message) => {
    const res = await client.unsay(post.id, m.id);
    if (!res.ok) {
      refusedInTalk(res.error);
      return false;
    }
    await pull();
    return true;
  };
  /** An owner taking an author's message off the board, or back: at once, and the page follows the board. */
  const hideMessage = async (post: Post, m: Message, hidden: boolean) => {
    const res = await client.editMessage(post.id, m.id, { hidden });
    if (!res.ok) return refusedInTalk(res.error);
    await pull();
  };

  /** Seconding a lookalike instead of writing it again: the vote, and back to the board. */
  const meToo = (id: string) => {
    const p = posts.find((x) => x.id === id);
    if (p && !p.voted) void vote(id, true);
    setFirst(false);
    setView('board');
    setToast(t('board.meTooDone'));
  };

  /** An owner's new update. The posts it fixed change too, so the board is read again. */
  const publish = async (draft: UpdateDraft) => {
    const res = await client.postUpdate({ id: newId(), ...draft });
    if (!res.ok) {
      sayRefusal(res.error);
      return false;
    }
    await pull();
    return true;
  };

  const reviewed = posts.some((p) => p.mine && p.kind === 'review');

  /** The "+": straight to writing when there is only one kind to write. */
  const write = () => {
    if (kinds.length === 1) {
      setWriting(kinds[0]);
      setView('compose');
    } else {
      setView('choose');
    }
  };

  const toBoard = () => {
    setFirst(false);
    setView('board');
  };

  if (view === 'sent') {
    return (
      <div class="app">
        <Sent t={t} onBack={toBoard} waiting={waiting || (screen === 'sent' && !!rules?.approve)} appName={name} />
      </div>
    );
  }

  if (view === 'updates' && rules) {
    return (
      <div class="app">
        <Updates
          client={client}
          t={t}
          locale={locale}
          appName={name}
          owner={owner}
          posts={posts}
          onBack={toBoard}
          onPublish={publish}
          onFail={sayRefusal}
        />
        {toast && <div class="toast" role="status">{toast}</div>}
      </div>
    );
  }

  const managed = view === 'manage' && owner ? posts.find((p) => p.id === managing) : undefined;
  if (managed && rules) {
    return (
      <div class="app">
        <Manage
          key={managed.id}
          t={t}
          post={managed}
          appName={name}
          locale={locale}
          replyMax={rules.replyMax}
          loadShot={async () => {
            const res = await client.shot(managed.id);
            return res.ok ? res.data : null;
          }}
          onSave={(change) => void manage(managed, change)}
          onHideMessage={(m, hidden) => void hideMessage(managed, m, hidden)}
          onBack={toBoard}
        />
        {toast && <div class="toast" role="status">{toast}</div>}
      </div>
    );
  }

  const talkingTo = view === 'talk' ? posts.find((p) => p.id === talking) : undefined;
  if (talkingTo && rules) {
    return (
      <div class="app">
        <Talk
          post={talkingTo}
          appName={name}
          t={t}
          locale={locale}
          replyMax={rules.replyMax}
          onBack={toBoard}
          onSay={(text) => sayUnder(talkingTo, text)}
          onEdit={(m, text) => editUnder(talkingTo, m, text)}
          onUnsay={(m) => unsayUnder(talkingTo, m)}
        />
        {toast && <div class="toast" role="status">{toast}</div>}
      </div>
    );
  }

  if (view === 'choose' && (rules || first)) {
    return (
      <div class="app">
        {first ? (
          // The first screen: nothing to go back to, only out.
          <header class="bar">
            <span />
            <span />
            {onClose ? (
              <button type="button" class="icon-btn" aria-label={t('board.close')} onClick={onClose}>
                <Icon.Close />
              </button>
            ) : (
              <span />
            )}
          </header>
        ) : (
          <header class="bar">
            <button type="button" class="icon-btn" aria-label={t('board.back')} onClick={toBoard}>
              <Icon.Back />
            </button>
            <h2 class="bar__title">{t('board.composeTitle')}</h2>
            <span />
          </header>
        )}
        <div class="scroll" style={{ paddingBottom: '24px' }}>
          {rules ? (
            <Choose
              t={t}
              kinds={kinds}
              appName={name}
              reviewed={reviewed}
              onPick={(k) => {
                setWriting(k);
                setView('compose');
              }}
              onBoard={first ? toBoard : undefined}
            />
          ) : failed ? (
            <div class="empty">
              <p>{t('board.loadFailed')}</p>
              <button type="button" class="text-btn" onClick={() => void pull()}>
                {t('board.retry')}
              </button>
            </div>
          ) : (
            <div class="empty" aria-busy="true">
              <span class="spinner" style={{ display: 'inline-block' }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'compose' && rules) {
    return (
      <div class="app">
        <header class="bar">
          <button
            type="button"
            class="icon-btn"
            aria-label={t('board.back')}
            onClick={() => setView(kinds.length > 1 ? 'choose' : 'board')}
          >
            <Icon.Back />
          </button>
          <h2 class="bar__title">{t('board.composeTitle')}</h2>
          <span />
        </header>
        <div class="scroll" ref={scroller} style={{ paddingBottom: '24px' }}>
          <Compose
            t={t}
            kind={writing}
            posts={posts}
            likeThis={likeThis}
            left={read?.me ? read.me.left : null}
            perDay={rules.perDay}
            textMax={rules.textMax}
            name={read?.me?.name ?? suggestName ?? ''}
            appName={name}
            screenshots={shots}
            names={names}
            onMeToo={meToo}
            onSend={send}
          />
        </div>
        {toast && <div class="toast" role="status">{toast}</div>}
      </div>
    );
  }

  return (
    <div class="app">
      <header class="bar">
        <div class="bar__side">
          {onClose && (
            <button type="button" class="icon-btn" aria-label={t('board.close')} onClick={onClose}>
              <Icon.Close />
            </button>
          )}
          {hasUpdates && (
            <button type="button" class="icon-btn" aria-label={t('updates.title')} onClick={() => setView('updates')}>
              <Icon.Updates />
            </button>
          )}
        </div>
        <h2 class="bar__title">{t('board.title')}</h2>
        {readonly ? (
          <span />
        ) : (
          <button
            type="button"
            class="icon-btn"
            aria-label={t('board.write')}
            disabled={!rules || !kinds.length}
            onClick={write}
          >
            <Icon.Plus />
          </button>
        )}
      </header>

      {/* One row for finding something: the search, and the Filter button
          that opens everything else. What is on shows under it, each with
          its own x, so a short board always says why it is short. */}
      <div class="filters finder">
        <label class="search">
          <Icon.Search />
          <input
            class="search__input"
            type="search"
            value={query}
            placeholder={t('search.placeholder')}
            aria-label={t('search.placeholder')}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          />
          {query && (
            <button type="button" class="search__clear" aria-label={t('search.clear')} onClick={() => setQuery('')}>
              <Icon.Close size={16} />
            </button>
          )}
        </label>
        <button
          type="button"
          class="filter-btn"
          aria-pressed={on > 0}
          aria-label={on > 0 ? `${t('filter.button')}: ${t('filter.on', { n: on })}` : t('filter.button')}
          onClick={() => setOver({ kind: 'filter' })}
        >
          <Icon.Sliders />
          <span>{t('filter.button')}</span>
          {on > 0 && <span class="filter-btn__n">{on}</span>}
        </button>
      </div>
      {on > 0 && (
        <div class="applied">
          {[
            ...filter.kinds.map((k) => ({ label: filterLabel(t, { kind: k }), off: { ...filter, kinds: filter.kinds.filter((x) => x !== k) } })),
            ...filter.statuses.map((s) => ({
              label: filterLabel(t, { status: s }),
              off: { ...filter, statuses: filter.statuses.filter((x) => x !== s) },
            })),
            ...filter.own.map((o) => ({ label: filterLabel(t, { own: o }), off: { ...filter, own: filter.own.filter((x) => x !== o) } })),
            ...(filter.mine ? [{ label: filterLabel(t, { mine: true }), off: { ...filter, mine: false } }] : []),
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              class="applied__chip"
              aria-label={t('filter.remove', { label: chip.label })}
              onClick={() => setFilter(chip.off)}
            >
              <span>{chip.label}</span>
              <Icon.Close size={14} />
            </button>
          ))}
          <button type="button" class="link-btn" onClick={() => setFilter(NO_FILTER)}>
            {t('filter.clearAll')}
          </button>
        </div>
      )}

      <div class="scroll" ref={scroller}>
        {/* Yours, and only yours: the bug you reported is fixed. Once, until
            you close it, whichever filter is on. */}
        {news && (
          <div class="news" role="status">
            <Badge tone="done" icon={() => <Icon.Done />} label={t('board.statusDone')} />
            <div class="news__text">
              <strong class="news__title">
                {news.fix?.version
                  ? t(news.kind === 'idea' ? 'news.ideaIn' : 'news.bugIn', { version: news.fix.version })
                  : t(news.kind === 'idea' ? 'news.idea' : 'news.bug')}
              </strong>
              <span class="news__post">{news.text}</span>
              {news.fix?.link && <CodeLink href={news.fix.link} t={t} label="news.see" />}
            </div>
            <button type="button" class="icon-btn news__close" aria-label={t('board.close')} onClick={() => closeNews(news.id)}>
              <Icon.Close size={18} />
            </button>
          </div>
        )}

        {/* Yours too: the app said something under one of your posts. Once,
            until you read it or close this. */}
        {answered && (
          <div class="news" role="status">
            <div class="news__text">
              <strong class="news__title">
                {t(answered.kind === 'idea' ? 'answered.idea' : answered.kind === 'review' ? 'answered.review' : 'answered.bug', {
                  app: name,
                })}
              </strong>
              <button type="button" class="link-btn news__link" onClick={() => openTalk(answered)}>
                {t('answered.see')}
              </button>
            </div>
            <button type="button" class="icon-btn news__close" aria-label={t('board.close')} onClick={() => hear(answered)}>
              <Icon.Close size={18} />
            </button>
          </div>
        )}

        {/* For owners: answers that wait for the app, and one tap to see only those. */}
        {waitingCount > 0 && !filter.own.includes('waiting') && (
          <div class="news news--owner" role="status">
            <strong class="news__title news__grow">
              {waitingCount === 1 ? t('owner.waitingOne') : t('owner.waitingMany', { n: waitingCount })}
            </strong>
            <button type="button" class="chip-btn" onClick={() => setFilter({ ...NO_FILTER, own: ['waiting'] })}>
              {t('owner.showThese')}
            </button>
          </div>
        )}

        {searching && read && (
          <p class="found-count">
            {shown.length === 1 ? t('search.countOne', { q: query.trim() }) : t('search.count', { n: shown.length, q: query.trim() })}
          </p>
        )}

        {/* What people think of the app, on top of the list it is drawn from.
            Only where reviews are in view, and only once there is one. */}
        {rating &&
          kinds.includes('review') &&
          (!filter.kinds.length || filter.kinds.includes('review')) &&
          !filter.statuses.length &&
          !filter.mine &&
          !filter.own.length &&
          !searching && (
          <div class="rating">
            <span class="rating__avg">{rating.avg.toFixed(1)}</span>
            <Stars n={rating.avg} t={t} size={18} />
            <span class="rating__n">
              {rating.n === 1 ? t('board.ratingOne') : t('board.ratingMany', { n: rating.n })}
            </span>
          </div>
        )}
        {failed ? (
          <div class="empty">
            <p>{t('board.loadFailed')}</p>
            <button type="button" class="text-btn" onClick={() => void pull()}>
              {t('board.retry')}
            </button>
          </div>
        ) : !read ? (
          <div class="empty" aria-busy="true">
            <span class="spinner" style={{ display: 'inline-block' }} />
          </div>
        ) : slice.length === 0 && (searching || on > 0) ? (
          <div class="empty nothing">
            <strong class="nothing__title">{t('filter.none')}</strong>
            <p>{t('filter.noneNote')}</p>
            <button
              type="button"
              class="outline-btn"
              onClick={() => {
                setQuery('');
                setFilter(NO_FILTER);
              }}
            >
              {t('filter.clear')}
            </button>
          </div>
        ) : slice.length === 0 ? (
          <p class="empty">
            {t(posts.length > 0 ? 'board.emptyFiltered' : readonly ? 'board.emptyRead' : 'board.emptyTitle')}
          </p>
        ) : (
          <ul class="list">
            {slice.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                appName={name}
                t={t}
                locale={locale}
                onVote={readonly ? undefined : (up) => void vote(post.id, up)}
                onDelete={post.mine || owner ? () => setOver({ kind: 'delete', post }) : undefined}
                onManage={owner ? () => openManage(post) : undefined}
                // An owner answers on the manage page, which holds the conversation.
                onTalk={owner ? () => openManage(post) : () => openTalk(post)}
                shotUrl={onBoard(post) ? client.shotUrl(post.id) : undefined}
                onShot={() => setOver({ kind: 'shot', post })}
                fresh={owner && !post.hidden && waitingOnApp(post)}
                query={query}
                found={(() => {
                  const where = found.get(post.id);
                  return where?.in === 'thread' ? where.message : undefined;
                })()}
              />
            ))}
          </ul>
        )}

        {pages > 1 && (
          <nav class="pager">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-current={n === at ? 'page' : undefined}
                aria-label={t('board.page', { n })}
                onClick={() => {
                  setPage(n);
                  scroller.current?.scrollTo({ top: 0 });
                }}
              >
                {n}
              </button>
            ))}
          </nav>
        )}

        {/* Quiet and last: the board is for reading, and this is only the way
            to be recognised before doing anything. Gone once signed in, and
            never drawn where there is no wallet to ask. */}
        {read && !read.me && client.canSign && !readonly && (
          <div class="sign-in">
            <button type="button" class="text-btn" onClick={() => void signIn()}>
              {t('board.signIn')}
            </button>
          </div>
        )}
      </div>

      {/* Floating over the foot of the list, because it is the control you
          change while reading: the end of Top, wondering what is new. */}
      <div class={`order${away ? ' order--away' : ''}`}>
        <div class="order__pill" role="tablist" aria-label={t('board.order')}>
          {(['top', 'new'] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              class="order__tab"
              aria-selected={sort === s}
              onClick={() => {
                setSort(s);
                setPage(1);
              }}
            >
              {t(s === 'top' ? 'board.top' : 'board.new')}
            </button>
          ))}
        </div>
      </div>

      {toast && <div class="toast" role="status">{toast}</div>}

      {over?.kind === 'delete' && (
        <DeleteSheet t={t} onConfirm={() => void remove(over.post)} onClose={() => setOver(null)} />
      )}
      {over?.kind === 'filter' && rules && (
        <FilterSheet
          t={t}
          kinds={kinds}
          owners={ownFilters}
          signedIn={!!read?.me}
          value={filter}
          count={countFor}
          onApply={(f) => {
            setOver(null);
            setFilter(f);
          }}
          onClose={() => setOver(null)}
        />
      )}
      {over?.kind === 'shot' && (
        <ShotSheet t={t} src={client.shotUrl(over.post.id)} onClose={() => setOver(null)} />
      )}
    </div>
  );
}

/** A post id. Random enough that two phones never mint the same one. */
function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** How many closed notes are remembered: plenty for anybody's own posts on one board. */
const SEEN_MAX = 200;

/**
 * The notes this browser closed, per board: posts whose "fixed" note went
 * (`fixed`), and answers from the app that were read (`answered`, as
 * `post@time`, so the next answer is news again). In `localStorage`,
 * because a note that came back on every visit would be nagging; only post
 * ids and times, nothing about anybody. Where storage throws (private mode,
 * a sandboxed frame) it is remembered for this visit only.
 */
function readSeen(project: string, what: 'fixed' | 'answered'): string[] {
  try {
    const raw = globalThis.localStorage?.getItem(`pleasenobugs.${what}.${project}`);
    const ids = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeSeen(project: string, what: 'fixed' | 'answered', ids: string[]) {
  try {
    globalThis.localStorage?.setItem(`pleasenobugs.${what}.${project}`, JSON.stringify(ids));
  } catch {
    // Remembered in memory for this visit, which is the best there is.
  }
}

/** The stricter of two screenshot settings: off, then owners, then the board. */
function strictest(a: Screenshots, b: Screenshots): Screenshots {
  const order: Screenshots[] = ['off', 'owners', 'board'];
  return order[Math.min(order.indexOf(a), order.indexOf(b))];
}
