import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  createMatcher,
  sortPosts,
  type BoardRead,
  type BoardSort,
  type Post,
  type PostContext,
  type PostKind,
} from '@pleasenobugs/core';
import type { Client } from '../client.js';
import { forReaders } from '../readonly.js';
import { insideNimiqPay } from '../signer.js';
import type { CopyKey, Translate } from '../i18n.js';
import { Choose, Sent } from './Choose.js';
import { Compose, type Draft, type Screenshots } from './Compose.js';
import { KIND, PostCard, Stars } from './PostCard.js';
import { DeleteSheet, ManageSheet, ShotSheet, type ManageChange } from './Sheets.js';
import * as Icon from './icons.js';

const PER_PAGE = 15;

/**
 * Whether a post's screenshot is on the board, so it can be shown as a plain
 * image. An owner hears about every screenshot, but reads one that is not on
 * the board through the manage sheet, with their proof; nor is one under a
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
   * floating button starts on the tiles; the board is one tap under them.
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

export type View = 'board' | 'choose' | 'compose' | 'sent';

/** Whatever is over the board, as one value so two can never be up at once. */
type Over =
  | { kind: 'delete'; post: Post }
  | { kind: 'manage'; post: Post }
  | { kind: 'shot'; post: Post }
  | null;

/**
 * The whole board: the list, writing one, and the two sheets.
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
  const [kind, setKind] = useState<'all' | PostKind>('all');
  const [page, setPage] = useState(1);
  const [over, setOver] = useState<Over>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [away, setAway] = useState(false);
  // Whether the last post landed on a board that approves first.
  const [waiting, setWaiting] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  // Keyed on the words rather than the array, which the element hands over as
  // a fresh one on every render.
  const noiseKey = (noise ?? []).join('|');
  const likeThis = useMemo(() => createMatcher(noiseKey ? noiseKey.split('|') : []), [noiseKey]);

  // Whether a board has ever arrived, as a ref so `pull` does not go stale.
  // A refresh that fails after a good read keeps the board on screen; only a
  // first read that fails says the board is unreachable.
  const loaded = useRef(false);
  const pull = useCallback(async () => {
    const res = await client.board();
    if (res.ok) {
      loaded.current = true;
      setRead(readonly ? forReaders(res.data) : res.data);
      setFailed(false);
    } else if (!loaded.current) {
      setFailed(true);
    }
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

  const shown = useMemo(() => {
    const here = posts.filter((p) => (owner || !p.hidden) && kindsKey.split(',').includes(p.kind));
    return sortPosts(kind === 'all' ? here : here.filter((p) => p.kind === kind), sort);
  }, [posts, kind, sort, owner, kindsKey]);

  /** The average over the reviews on the board, hidden ones left out for owners too. */
  const rating = useMemo(() => {
    const stars = posts.filter((p) => p.kind === 'review' && !p.hidden && p.rating).map((p) => p.rating as number);
    return stars.length ? { avg: stars.reduce((a, b) => a + b, 0) / stars.length, n: stars.length } : null;
  }, [posts]);
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
    setKind('all');
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
    setOver(null);
    patch(post.id, {
      status: change.status,
      hidden: change.hidden || undefined,
      reply: change.reply ? { text: change.reply, at: Date.now() } : undefined,
      ...(change.shotOff !== undefined ? { shotFor: change.shotOff ? 'off' : 'board' } : {}),
      ...(change.approved ? { pending: undefined } : {}),
    });
    const res = await client.manage(post.id, change);
    if (!res.ok) sayRefusal(res.error);
    void pull();
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
            onVote={vote}
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
        {onClose ? (
          <button type="button" class="icon-btn" aria-label={t('board.close')} onClick={onClose}>
            <Icon.Close />
          </button>
        ) : (
          <span />
        )}
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

      {kinds.length > 1 && (
        <div class="filters">
          {(['all', ...kinds] as const).map((k) => (
            <button
              key={k}
              type="button"
              class="chip-pick"
              aria-pressed={kind === k}
              onClick={() => {
                setKind(k);
                setPage(1);
              }}
            >
              {t(k === 'all' ? 'board.all' : KIND[k].plural)}
            </button>
          ))}
        </div>
      )}

      <div class="scroll" ref={scroller}>
        {/* What people think of the app, on top of the list it is drawn from.
            Only where reviews are in view, and only once there is one. */}
        {rating && kinds.includes('review') && (kind === 'all' || kind === 'review') && (
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
                onManage={owner ? () => setOver({ kind: 'manage', post }) : undefined}
                shotUrl={onBoard(post) ? client.shotUrl(post.id) : undefined}
                onShot={() => setOver({ kind: 'shot', post })}
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
      {over?.kind === 'shot' && (
        <ShotSheet t={t} src={client.shotUrl(over.post.id)} onClose={() => setOver(null)} />
      )}
      {over?.kind === 'manage' && rules && (
        <ManageSheet
          t={t}
          post={over.post}
          replyMax={rules.replyMax}
          loadShot={async () => {
            const res = await client.shot(over.post.id);
            return res.ok ? res.data : null;
          }}
          onSave={(change) => void manage(over.post, change)}
          onClose={() => setOver(null)}
        />
      )}
    </div>
  );
}

/** A post id. Random enough that two phones never mint the same one. */
function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** The stricter of two screenshot settings: off, then owners, then the board. */
function strictest(a: Screenshots, b: Screenshots): Screenshots {
  const order: Screenshots[] = ['off', 'owners', 'board'];
  return order[Math.min(order.indexOf(a), order.indexOf(b))];
}
