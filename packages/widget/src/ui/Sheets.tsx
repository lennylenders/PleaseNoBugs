import { useEffect, useState } from 'preact/hooks';
import { NAME_MAX, type BoardSort, type PostKind, type PostStatus } from '@pleasenobugs/core';
import { NO_FILTER, type BoardFilter, type OwnFilter } from '../filter.js';
import type { CopyKey, Translate } from '../i18n.js';
import { Face } from './Face.js';
import { KIND, doneLabel } from './PostCard.js';
import * as Icon from './icons.js';

/**
 * A sheet over the board: a scrim that closes it, and a panel that rises from
 * the bottom. Absolute inside the widget rather than fixed to the window, so an
 * inline board keeps its sheets inside its own box instead of covering the
 * host app.
 */
function Sheet({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: preact.ComponentChildren;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div class="scrim" onClick={onClose}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <span class="sheet__grip" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

/**
 * Somebody not signed in tapped Send feedback or a vote, outside Nimiq Pay
 * where signing in is a step of its own (a wallet window). Said here, at the
 * moment it matters, instead of a card on top of the board for everybody who
 * only came to read; with what signing is not, before it is asked.
 */
export function SignInSheet({
  t,
  why,
  canSign,
  appName,
  onSignIn,
  onClose,
}: {
  t: Translate;
  why: 'feedback' | 'vote';
  /** Whether there is a wallet to ask at all. Without one, it only says so. */
  canSign: boolean;
  appName: string;
  onSignIn: () => void;
  onClose: () => void;
}) {
  const title: CopyKey = why === 'vote' ? 'board.signInVote' : 'board.signInFeedback';
  return (
    <Sheet label={t(title)} onClose={onClose}>
      <h2 class="sheet__title">{t(title)}</h2>
      <p class="sheet__quote">{canSign ? t('board.signInNote') : t('board.needWallet', { app: appName })}</p>
      <div class="sheet__actions">
        {canSign && (
          <button type="button" class="btn" onClick={onSignIn}>
            {t('board.signInButton')}
          </button>
        )}
        <button type="button" class="text-btn" onClick={onClose}>
          {t(canSign ? 'board.notNow' : 'board.close')}
        </button>
      </div>
    </Sheet>
  );
}

/** Asking before Log out, which is easy to tap by mistake and a wallet window to undo. */
export function LogOutSheet({ t, onConfirm, onClose }: { t: Translate; onConfirm: () => void; onClose: () => void }) {
  return (
    <Sheet label={t('settings.logOutTitle')} onClose={onClose}>
      <h2 class="sheet__title">{t('settings.logOutTitle')}</h2>
      <p class="sheet__quote">{t('settings.logOutText')}</p>
      <div class="sheet__actions">
        <button type="button" class="btn btn--danger" onClick={onConfirm}>
          {t('settings.logOut')}
        </button>
        <button type="button" class="text-btn" onClick={onClose}>
          {t('board.cancel')}
        </button>
      </div>
    </Sheet>
  );
}

/**
 * Once, on somebody's first post: how should others see you? Asked as the
 * post goes up rather than in a form before it, so the name is there under
 * the very first post, and asked only of somebody who has none and is not
 * posting anonymously. Skip is a real answer: others see a short address.
 */
export function NameSheet({
  t,
  face,
  faceUrl,
  suggest = '',
  onSave,
  onSkip,
  onClose,
}: {
  t: Translate;
  face?: string;
  faceUrl?: (code: string) => string;
  /** A name the host app already knows, filled in to keep or change. */
  suggest?: string;
  onSave: (name: string) => void;
  onSkip: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(suggest);
  const src = face && faceUrl ? faceUrl(face) : undefined;
  return (
    <Sheet label={t('name.title')} onClose={onClose}>
      <Face code={face} src={src} size={48} />
      <h2 class="sheet__title sheet__title--under">{t('name.title')}</h2>
      <p class="sheet__quote">{t('name.text')}</p>
      <label class="name-field sheet__field">
        <Face code={face} src={src} size={24} />
        <input
          class="input"
          value={name}
          maxLength={NAME_MAX}
          placeholder={t('board.namePlaceholder')}
          aria-label={t('board.namePlaceholder')}
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) onSave(name.trim());
          }}
        />
      </label>
      <div class="sheet__actions">
        <button type="button" class="btn" disabled={!name.trim()} onClick={() => onSave(name.trim())}>
          {t('name.save')}
        </button>
        <button type="button" class="text-btn" onClick={onSkip}>
          {t('name.skip')}
        </button>
      </div>
    </Sheet>
  );
}

/**
 * A screenshot on the board, whole. Read straight from the server, the same
 * image the card shows, so there is nothing to fetch or let go of here.
 */
export function ShotSheet({ t, src, onClose }: { t: Translate; src: string; onClose: () => void }) {
  const [failed, setFailed] = useState(false);
  return (
    <Sheet label={t('board.shot')} onClose={onClose}>
      <figure class="sheet__shot sheet__shot--whole">
        {failed ? (
          <figcaption>{t('board.shotGone')}</figcaption>
        ) : (
          <img src={src} alt={t('board.shot')} onError={() => setFailed(true)} />
        )}
      </figure>
      <div class="sheet__actions">
        <button type="button" class="text-btn" onClick={onClose}>
          {t('board.close')}
        </button>
      </div>
    </Sheet>
  );
}

/** Asking before something goes for good: a post, by default, or an update. */
export function DeleteSheet({
  t,
  onConfirm,
  onClose,
  title = 'board.deleteTitle',
  note = 'board.deleteNote',
  confirm = 'board.delete',
}: {
  t: Translate;
  onConfirm: () => void;
  onClose: () => void;
  title?: CopyKey;
  note?: CopyKey;
  confirm?: CopyKey;
}) {
  return (
    <Sheet label={t(title)} onClose={onClose}>
      <h2 class="sheet__title">{t(title)}</h2>
      <p class="sheet__quote">{t(note)}</p>
      <div class="sheet__actions">
        <button type="button" class="btn btn--danger" onClick={onConfirm}>
          {t(confirm)}
        </button>
        <button type="button" class="text-btn" onClick={onClose}>
          {t('board.cancel')}
        </button>
      </div>
    </Sheet>
  );
}

/** The four states, as the Filter panel offers them. */
const FILTER_STATUSES: PostStatus[] = ['open', 'planned', 'done', 'declined'];
const STATUS_LABEL: Record<PostStatus, CopyKey> = {
  open: 'board.statusOpen',
  planned: 'board.statusPlanned',
  done: 'board.statusDone',
  declined: 'board.statusDeclined',
};
const OWN_LABEL: Record<OwnFilter, CopyKey> = {
  waiting: 'filter.waiting',
  hidden: 'board.hidden',
  pending: 'board.waiting',
};

/** A chip's words, for the chips under the search field as well as here. */
export function filterLabel(
  t: Translate,
  f: { kind?: PostKind; status?: PostStatus; kinds?: readonly PostKind[]; own?: OwnFilter; mine?: true },
): string {
  if (f.kind) return t(KIND[f.kind].plural);
  // Done is Fixed for bugs, Done for ideas, and both when both are in view (`kinds`).
  if (f.status) return t(f.status === 'done' && f.kinds ? doneLabel(f.kinds) : STATUS_LABEL[f.status]);
  if (f.own) return t(OWN_LABEL[f.own]);
  return t('filter.mine');
}

/**
 * Everything the board can be narrowed to, and its order, in one sheet so the
 * board itself keeps one row for it. Choices are made here and land together
 * with the button, which says how many posts that will be, so nobody filters
 * their way to an empty board without seeing it coming. "All" turns a group off.
 *
 * The order (Top or Newest) comes first: it is the choice people change most,
 * and it never changes how many posts there are.
 *
 * `own` (Waiting on you, Off the board, Waiting for approval) is for owners
 * only, and "Only my posts" for somebody signed in: nobody else has any.
 */
export function FilterSheet({
  t,
  kinds,
  owners,
  signedIn,
  value,
  sort: sortNow,
  count,
  onApply,
  onClose,
}: {
  t: Translate;
  /** The kinds on this board. */
  kinds: PostKind[];
  /** What an owner may narrow to, or nothing for anybody else. */
  owners: OwnFilter[];
  signedIn: boolean;
  value: BoardFilter;
  /** The board's order now. */
  sort: BoardSort;
  /** How many posts a filter leaves. */
  count: (f: BoardFilter) => number;
  onApply: (f: BoardFilter, sort: BoardSort) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<BoardFilter>(value);
  const [sort, setSort] = useState<BoardSort>(sortNow);
  const n = count(draft);
  const toggle = <K extends 'kinds' | 'statuses' | 'own'>(key: K, item: BoardFilter[K][number]) =>
    setDraft((d) => {
      const list = d[key] as (typeof item)[];
      return { ...d, [key]: list.includes(item) ? list.filter((x) => x !== item) : [...list, item] };
    });

  const group = <K extends 'kinds' | 'statuses' | 'own'>(
    key: K,
    title: CopyKey,
    items: BoardFilter[K][number][],
    label: (item: BoardFilter[K][number]) => string,
    all = true,
  ) => (
    <div class="pick-group" role="group" aria-label={t(title)}>
      <span class="label">{t(title)}</span>
      <div class="states">
        {all && (
          <button
            type="button"
            class="chip-pick"
            aria-pressed={!draft[key].length}
            onClick={() => setDraft((d) => ({ ...d, [key]: [] }))}
          >
            {t('board.all')}
          </button>
        )}
        {items.map((item) => (
          <button
            key={item}
            type="button"
            class="chip-pick"
            aria-pressed={(draft[key] as (typeof item)[]).includes(item)}
            onClick={() => toggle(key, item)}
          >
            {label(item)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Sheet label={t('filter.title')} onClose={onClose}>
      <div class="sheet__head">
        <h2 class="sheet__title">{t('filter.title')}</h2>
        <button type="button" class="icon-btn" aria-label={t('board.close')} onClick={onClose}>
          <Icon.Close />
        </button>
      </div>

      <div class="pick-group" role="group" aria-label={t('filter.sort')}>
        <span class="label">{t('filter.sort')}</span>
        <div class="states">
          {(['top', 'new'] as const).map((s) => (
            <button key={s} type="button" class="chip-pick" aria-pressed={sort === s} onClick={() => setSort(s)}>
              {t(s === 'top' ? 'board.top' : 'board.newest')}
            </button>
          ))}
        </div>
      </div>

      {kinds.length > 1 && group('kinds', 'filter.kind', kinds, (k) => filterLabel(t, { kind: k }))}
      {group('statuses', 'filter.status', FILTER_STATUSES, (s) => filterLabel(t, { status: s, kinds: draft.kinds.length ? draft.kinds : kinds }))}
      {kinds.includes('review') && <p class="note">{t('filter.statusNote')}</p>}

      {owners.length > 0 && (
        <div class="pick-own">{group('own', 'filter.own', owners, (o) => filterLabel(t, { own: o }), false)}</div>
      )}

      {signedIn && (
        <div class="switch-row switch-row--box">
          <span class="switch-row__label" id="pnb-only-mine">
            {t('filter.mine')}
          </span>
          <button
            type="button"
            role="switch"
            class="switch"
            aria-checked={draft.mine}
            aria-labelledby="pnb-only-mine"
            onClick={() => setDraft((d) => ({ ...d, mine: !d.mine }))}
          />
        </div>
      )}

      <div class="sheet__foot">
        <button
          type="button"
          class="text-btn filter-reset"
          onClick={() => {
            setDraft(NO_FILTER);
            setSort('top');
          }}
        >
          {t('filter.reset')}
        </button>
        <button type="button" class="btn" onClick={() => onApply(draft, sort)}>
          {n === 1 ? t('filter.showOne') : t('filter.show', { n })}
        </button>
      </div>
    </Sheet>
  );
}
