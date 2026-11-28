import { useEffect, useState } from 'preact/hooks';
import {
  LINK_MAX,
  VERSION_MAX,
  cleanCodeLink,
  cleanVersion,
  lastWord,
  type Message,
  type Post,
  type PostFix,
  type PostStatus,
} from '@pleasenobugs/core';
import type { CopyKey, Translate } from '../i18n.js';
import { PostCard, statusLabel } from './PostCard.js';
import { Thread } from './Talk.js';
import * as Icon from './icons.js';

/**
 * A screenshot as a URL to show, fetched when the page opens and let go when
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
    // Once per page: the loader is a fresh function on every render.
  }, []);
  return url;
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
  /**
   * What the app says under it, if anything: a new message, or with `edit`
   * the id of the app's own last message, changed.
   */
  message?: { text: string; edit?: string };
  hidden: boolean;
  shotOff?: boolean;
  /** Only for a post waiting for approval: true lets it onto the board. */
  approved?: boolean;
  /** Only for a bug or an idea saved as done: where the fix is, `{}` for nowhere. */
  fix?: PostFix;
}

/**
 * An owner answering a post, on a page of its own as the conversation is,
 * the post at its top as the board shows it: where it stands, what to say,
 * and whether it stays on the board. **One save for all of it**, because
 * separate confirmations are chances to leave halfway; it goes back to the
 * board, as the back arrow does without saving. A review has no "where it
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
 *
 * **The conversation is here whole**, newest last, with what the owner may
 * do to it: take an author's message off the board or put it back (at once,
 * like a switch), and change the app's own last message while nobody has
 * answered it. The box under it is a new message, sent with Save. A review
 * gets one answer from the app, so on a review the box is that answer.
 */
export function Manage({
  t,
  post,
  appName,
  locale,
  replyMax,
  loadShot,
  onSave,
  onHideMessage,
  onBack,
}: {
  t: Translate;
  post: Post;
  appName: string;
  locale: string;
  replyMax: number;
  /** Fetches the screenshot, for a post that has one. */
  loadShot: () => Promise<Blob | null>;
  onSave: (change: ManageChange) => void;
  /** Takes an author's message off the board, or puts it back. */
  onHideMessage: (m: Message, hidden: boolean) => void;
  onBack: () => void;
}) {
  const [status, setStatus] = useState<PostStatus>(post.status);
  const thread = post.thread ?? [];
  const last = lastWord(thread);
  // The app's own last word, which it may still change: on a review always,
  // since that is its one answer; elsewhere only until the author answers.
  const appLast = post.kind === 'review' ? thread.find((m) => m.from === 'app' && !m.hidden) : last?.from === 'app' ? last : undefined;
  const [editing, setEditing] = useState<Message | null>(post.kind === 'review' ? (appLast ?? null) : null);
  const [message, setMessage] = useState(editing?.text ?? '');
  const who = post.who ?? post.short ?? t('talk.author');
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
    <>
      <header class="bar">
        <button type="button" class="icon-btn" aria-label={t('board.back')} onClick={onBack}>
          <Icon.Back />
        </button>
        <h2 class="bar__title">{t('board.manage')}</h2>
        <span />
      </header>
      <div class="scroll talk manage" style={{ paddingBottom: '24px' }}>
        <ul class="list">
          <PostCard post={post} appName={appName} t={t} locale={locale} bare />
        </ul>

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
                  {t(statusLabel({ kind: post.kind, status: s.status }, s.label))}
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

        {thread.length > 0 && (
          <>
            <span class="label" style={{ display: 'block', marginTop: '20px', marginBottom: '8px' }}>
              {t('talk.label')}
            </span>
            <Thread
              post={post}
              thread={thread}
              appName={appName}
              t={t}
              actions={(m) =>
                m.from === 'author' ? (
                  <button type="button" class="link-btn" onClick={() => onHideMessage(m, !m.hidden)}>
                    {t(m.hidden ? 'talk.unhide' : 'talk.hide')}
                  </button>
                ) : m === appLast && post.kind !== 'review' ? (
                  <button
                    type="button"
                    class="link-btn"
                    aria-pressed={editing === m}
                    onClick={() => {
                      const on = editing !== m;
                      setEditing(on ? m : null);
                      setMessage(on ? m.text : '');
                    }}
                  >
                    {t(editing === m ? 'board.cancel' : 'talk.edit')}
                  </button>
                ) : null
              }
            />
          </>
        )}

        <span class="label" style={{ display: 'block', marginTop: '20px', marginBottom: '8px' }}>
          {t(editing && post.kind !== 'review' ? 'talk.changeLast' : 'board.replyLabel')}
        </span>
        <textarea
          class="field"
          style={{ minHeight: '96px' }}
          value={message}
          maxLength={replyMax}
          placeholder={post.mine ? t('board.replyPlaceholder') : t('talk.writeTo', { who })}
          aria-label={t('board.replyLabel')}
          onInput={(e) => setMessage((e.target as HTMLTextAreaElement).value)}
        />
        {post.kind !== 'review' && !post.mine && <p class="note">{t('talk.gets', { who: post.who ?? post.short ?? t('board.anon') })}</p>}

        {/* Approving comes first on a waiting post: it is what the post is waiting for. */}
        {post.pending && (
          <button type="button" class="approve-btn" aria-pressed={approved} onClick={() => setApproved(!approved)}>
            {t(approved ? 'board.unapprove' : 'board.approve')}
          </button>
        )}

        <button type="button" class="hide-btn" aria-pressed={hidden} onClick={() => setHidden(!hidden)}>
          {t(hidden ? 'board.unhide' : 'board.hide')}
        </button>

        <div class="manage__actions">
          <button
            type="button"
            class="btn"
            disabled={wrong}
            onClick={() =>
              onSave({
                status,
                // Only what changes something: an empty box says nothing, and
                // the same words again are not a new message.
                ...(message.trim() && message.trim() !== editing?.text
                  ? { message: { text: message.trim(), ...(editing ? { edit: editing.id } : {}) } }
                  : {}),
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
      </div>
    </>
  );
}
