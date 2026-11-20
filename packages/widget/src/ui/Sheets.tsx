import { useEffect, useState } from 'preact/hooks';
import type { PostKind, PostStatus } from '@pleasenobugs/core';
import { NO_FILTER, type BoardFilter, type OwnFilter } from '../filter.js';
import type { CopyKey, Translate } from '../i18n.js';
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
        {children}
      </div>
    </div>
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
 * Everything the board can be narrowed to, in one sheet so the board itself
 * keeps one row for it. Choices are made here and land together with the
 * button, which says how many posts that will be, so nobody filters their
 * way to an empty board without seeing it coming. "All" turns a group off.
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
  /** How many posts a filter leaves. */
  count: (f: BoardFilter) => number;
  onApply: (f: BoardFilter) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<BoardFilter>(value);
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
        <button type="button" class="text-btn filter-reset" onClick={() => setDraft(NO_FILTER)}>
          {t('filter.reset')}
        </button>
        <button type="button" class="btn" onClick={() => onApply(draft)}>
          {n === 1 ? t('filter.showOne') : t('filter.show', { n })}
        </button>
      </div>
    </Sheet>
  );
}
