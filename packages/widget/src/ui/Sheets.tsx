import { useEffect, useState } from 'preact/hooks';
import type { Post, PostStatus } from '@pleasenobugs/core';
import type { CopyKey, Translate } from '../i18n.js';
import { Stars } from './PostCard.js';

/**
 * A screenshot as a URL to show, fetched when the sheet opens and let go when
 * it closes, so a picture of somebody's screen lives no longer than the look.
 */
function useShot(load: (() => Promise<Blob | null>) | null): string | 'loading' | 'failed' | null {
  const [url, setUrl] = useState<string | 'loading' | 'failed' | null>(load ? 'loading' : null);
  useEffect(() => {
    if (!load) return;
    let made: string | null = null;
    let gone = false;
    void load().then((blob) => {
      if (gone) return;
      if (!blob) return setUrl('failed');
      made = URL.createObjectURL(blob);
      setUrl(made);
    });
    return () => {
      gone = true;
      if (made) URL.revokeObjectURL(made);
    };
    // Once per sheet: the loader is a fresh function on every render.
  }, []);
  return url;
}

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

export function DeleteSheet({ t, onConfirm, onClose }: { t: Translate; onConfirm: () => void; onClose: () => void }) {
  return (
    <Sheet label={t('board.deleteTitle')} onClose={onClose}>
      <h2 class="sheet__title">{t('board.deleteTitle')}</h2>
      <p class="sheet__quote">{t('board.deleteNote')}</p>
      <div class="sheet__actions">
        <button type="button" class="btn btn--danger" onClick={onConfirm}>
          {t('board.delete')}
        </button>
        <button type="button" class="text-btn" onClick={onClose}>
          {t('board.cancel')}
        </button>
      </div>
    </Sheet>
  );
}

/** The four states, in the order a post travels through them. */
const STATUSES: { status: PostStatus; label: CopyKey }[] = [
  { status: 'open', label: 'board.statusOpen' },
  { status: 'planned', label: 'board.statusPlanned' },
  { status: 'done', label: 'board.statusDone' },
  { status: 'declined', label: 'board.statusDeclined' },
];

/** What an owner's save sends. `shotOff` only for a screenshot its author put on the board. */
export interface ManageChange {
  status: PostStatus;
  reply: string;
  hidden: boolean;
  shotOff?: boolean;
}

/**
 * An owner answering a post: where it stands, what to say, and whether it
 * stays on the board. **One save for all of it**, because separate
 * confirmations are chances to leave halfway. A review has no "where it
 * stands", so it gets the rest.
 *
 * On a post that carries context it also shows what the app sent along (a
 * version, the host), which only owners see, and the screenshot if there is
 * one, saying who sees it. One its author put on the board can be **taken
 * off it on its own**, for when it shows something private after all, while
 * the post stays up. One the author kept for the owners has no such switch:
 * nobody may put it on the board for them.
 */
export function ManageSheet({
  t,
  post,
  replyMax,
  loadShot,
  onSave,
  onClose,
}: {
  t: Translate;
  post: Post;
  replyMax: number;
  /** Fetches the screenshot, for a post that has one. */
  loadShot: () => Promise<Blob | null>;
  onSave: (change: ManageChange) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<PostStatus>(post.status);
  const [reply, setReply] = useState(post.reply?.text ?? '');
  const [hidden, setHidden] = useState(!!post.hidden);
  const [shotOff, setShotOff] = useState(post.shotFor === 'off');
  // Whether the author agreed to the board, so an owner may switch it.
  const switchable = post.shot && (post.shotFor === 'board' || post.shotFor === 'off');
  const shotWho: CopyKey =
    post.shotFor === 'owners' ? 'board.shotForOwners' : shotOff ? 'board.shotForOff' : 'board.shotForBoard';
  const context = post.context ? Object.entries(post.context) : [];
  const shot = useShot(post.shot ? loadShot : null);

  return (
    <Sheet label={t('board.manage')} onClose={onClose}>
      <h2 class="sheet__title">{t('board.manage')}</h2>
      {post.rating !== undefined && (
        <div style={{ marginTop: '8px' }}>
          <Stars n={post.rating} t={t} />
        </div>
      )}
      <p class="sheet__quote">{post.text}</p>

      {post.shot && (
        <figure class="sheet__shot">
          {shot === 'loading' ? (
            <span class="spinner" />
          ) : shot === 'failed' ? (
            <figcaption>{t('board.shotGone')}</figcaption>
          ) : (
            shot && (
              <a href={shot} target="_blank" rel="noopener">
                <img src={shot} alt={t('board.shot')} />
              </a>
            )
          )}
          {shot !== 'failed' && (
            <figcaption>
              {t(shotWho)} {t('board.shotGoes')}
            </figcaption>
          )}
          {switchable && (
            <button type="button" class="hide-btn" aria-pressed={shotOff} onClick={() => setShotOff(!shotOff)}>
              {t(shotOff ? 'board.shotOn' : 'board.shotOff')}
            </button>
          )}
        </figure>
      )}

      {context.length > 0 && (
        <dl class="context" aria-label={t('board.context')}>
          {context.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {post.kind !== 'review' && (
        <>
          <span class="label" style={{ display: 'block', marginTop: '20px', marginBottom: '8px' }}>
            {t('board.setStatus')}
          </span>
          <div class="states" role="radiogroup" aria-label={t('board.setStatus')}>
            {STATUSES.map((s) => (
              <button
                key={s.status}
                type="button"
                role="radio"
                aria-checked={status === s.status}
                class="chip-pick"
                onClick={() => setStatus(s.status)}
              >
                {t(s.label)}
              </button>
            ))}
          </div>
        </>
      )}

      <span class="label" style={{ display: 'block', marginTop: '20px', marginBottom: '8px' }}>
        {t('board.replyLabel')}
      </span>
      <textarea
        class="field"
        style={{ minHeight: '96px' }}
        value={reply}
        maxLength={replyMax}
        placeholder={t('board.replyPlaceholder')}
        aria-label={t('board.replyLabel')}
        onInput={(e) => setReply((e.target as HTMLTextAreaElement).value)}
      />

      <button type="button" class="hide-btn" aria-pressed={hidden} onClick={() => setHidden(!hidden)}>
        {t(hidden ? 'board.unhide' : 'board.hide')}
      </button>

      <div class="sheet__actions">
        <button
          type="button"
          class="btn"
          onClick={() => onSave({ status, reply: reply.trim(), hidden, ...(switchable ? { shotOff } : {}) })}
        >
          {t('board.save')}
        </button>
      </div>
    </Sheet>
  );
}
