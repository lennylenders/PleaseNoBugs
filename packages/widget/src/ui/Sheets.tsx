import { useEffect, useState } from 'preact/hooks';
import {
  LINK_MAX,
  VERSION_MAX,
  cleanCodeLink,
  cleanVersion,
  type Post,
  type PostFix,
  type PostStatus,
} from '@pleasenobugs/core';
import type { CopyKey, Translate } from '../i18n.js';
import { Stars } from './PostCard.js';
import * as Icon from './icons.js';

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
  /** Only for a post waiting for approval: true lets it onto the board. */
  approved?: boolean;
  /** Only for a bug or an idea saved as done: where the fix is, `{}` for nowhere. */
  fix?: PostFix;
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
 *
 * **Picking Done opens "Fixed in"**: a version and a link to the fix on
 * github.com or gitlab.com, both optional, which the card then shows to everybody and the
 * author as news. A link anywhere else is said to be wrong right under it,
 * and Save waits, rather than the server refusing the whole answer.
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
  const [approved, setApproved] = useState(false);
  const [version, setVersion] = useState(post.fix?.version ?? '');
  const [link, setLink] = useState(post.fix?.link ?? '');
  // A fix is for a bug or an idea, once it is done.
  const fixing = status === 'done' && post.kind !== 'review';
  const cleanVer = cleanVersion(version);
  const cleanLink = cleanCodeLink(link);
  const wrong = fixing && (cleanVer === null || cleanLink === null);
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

      {fixing && (
        <div class="fix-box">
          <span class="fix-box__head">
            <Icon.Link size={16} />
            {t(post.kind === 'idea' ? 'fix.titleIdea' : 'fix.title')}
          </span>
          <label class="fix-box__label">
            {t('fix.version')}
            <input
              class="input"
              value={version}
              maxLength={VERSION_MAX}
              placeholder="1.4.2"
              autocomplete="off"
              aria-invalid={cleanVer === null}
              onInput={(e) => setVersion((e.target as HTMLInputElement).value)}
            />
          </label>
          {cleanVer === null && <p class="note note--bad">{t('fix.versionBad')}</p>}
          <label class="fix-box__label">
            {t('fix.link')}
            <input
              class="input"
              type="url"
              maxLength={LINK_MAX}
              inputMode="url"
              value={link}
              placeholder="github.com/…/pull/42"
              autocomplete="off"
              aria-invalid={cleanLink === null}
              onInput={(e) => setLink((e.target as HTMLInputElement).value)}
            />
          </label>
          <p class={`note${cleanLink === null ? ' note--bad' : ''}`}>
            {t(cleanLink === null ? 'fix.linkBad' : 'fix.linkNote')}
          </p>
          <p class="note">{t('fix.who')}</p>
        </div>
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

      {/* Approving comes first on a waiting post: it is what the post is waiting for. */}
      {post.pending && (
        <button type="button" class="approve-btn" aria-pressed={approved} onClick={() => setApproved(!approved)}>
          {t(approved ? 'board.unapprove' : 'board.approve')}
        </button>
      )}

      <button type="button" class="hide-btn" aria-pressed={hidden} onClick={() => setHidden(!hidden)}>
        {t(hidden ? 'board.unhide' : 'board.hide')}
      </button>

      <div class="sheet__actions">
        <button
          type="button"
          class="btn"
          disabled={wrong}
          onClick={() =>
            onSave({
              status,
              reply: reply.trim(),
              hidden,
              ...(switchable ? { shotOff } : {}),
              ...(post.pending && approved ? { approved: true } : {}),
              ...(fixing
                ? { fix: { ...(cleanVer ? { version: cleanVer } : {}), ...(cleanLink ? { link: cleanLink } : {}) } }
                : {}),
            })
          }
        >
          {t('board.save')}
        </button>
      </div>
    </Sheet>
  );
}
